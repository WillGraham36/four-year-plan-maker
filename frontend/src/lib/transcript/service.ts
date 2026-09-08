import { PdfReader } from "pdfreader";
import { ALL_GEN_EDS } from "@/lib/utils/types";
import {
  buildTranscriptExtractionInput,
  TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT,
} from "./prompt";
import {
  normalizeParsedTranscript,
  toPlannerTerm,
  transcriptJsonSchema,
} from "./schema";
import {
  ExtractedTextValues,
  TranscriptParseResponse,
  TranscriptParsingResult,
} from "./types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.5-nano";
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_TRANSCRIPT_CHARS = 36_000;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

export class TranscriptParsingService {
  async parsePdfFile(file: File): Promise<TranscriptParsingResult> {
    try {
      if (!file) return { error: "No file provided" };
      if (file.type !== "application/pdf")
        return { error: "File must be a PDF" };
      if (file.size > 10 * 1024 * 1024)
        return { error: "File size exceeds 10 MB limit" };

      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractTextFromPdf(buffer);
      const cleanedText = prepareTranscriptText(text);

      if (!looksLikeTranscript(cleanedText)) {
        return { error: "Invalid transcript format" };
      }

      const rawParsed = await this.parseTranscriptText(cleanedText);

      return {
        success: true,
        text: cleanedText,
        filename: file.name,
        rawParsed,
        parsed: toExtractedTextValues(rawParsed),
      };
    } catch (error) {
      console.error("Transcript parsing failed", error);
      return {
        error: "Failed to parse transcript",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async parseTranscriptText(
    transcriptText: string,
  ): Promise<TranscriptParseResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const body = {
      model: process.env.OPENAI_TRANSCRIPT_MODEL ?? DEFAULT_MODEL,
      instructions: TRANSCRIPT_EXTRACTION_SYSTEM_PROMPT,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildTranscriptExtractionInput(transcriptText),
            },
          ],
        },
      ],
      temperature: 0,
      max_output_tokens: 8_000,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "transcript_parse_response",
          strict: true,
          schema: transcriptJsonSchema,
        },
      },
    };

    const json = await postOpenAIWithRetry(apiKey, body);
    const outputText = extractOutputText(json);

    if (!outputText) {
      throw new Error("OpenAI returned no transcript JSON");
    }

    const rawParsed = JSON.parse(outputText);
    const transferCredits = parseTransferCreditsFromText(transcriptText);
    const specialization = parseComputerScienceSpecializationFromText(transcriptText);

    return normalizeParsedTranscript({
      ...rawParsed,
      specialization: specialization ?? rawParsed.specialization,
      transferCredits:
        transferCredits.length > 0
          ? transferCredits
          : removeNoCreditTransfers(rawParsed.transferCredits ?? []),
    });
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const textItems: string[] = [];

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
        return;
      }

      if (!item) {
        resolve(textItems.join(" "));
        return;
      }

      if (item.text) textItems.push(item.text);
    });
  });
}

export function prepareTranscriptText(text: string) {
  const normalized = text
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .replace(
      /\b\d+\s*\/\s*\d+\s*\/\s*\d+\s*,\s*\d+\s*:\s*\d+\s*[AP]\s*M\s*Testudo\s*-\s*Unofficial\s*Transcript\s*https?:\/\/\S+\s*\d+\s*\/\s*\d+\b/gi,
      " ",
    )
    .trim();

  const start = findFirstIndex(normalized, [
    "UNOFFICIAL TRANSCRIPT",
    "Transfer Credit Information",
    "Historic Course Information",
  ]);
  const relevant = start >= 0 ? normalized.slice(start) : normalized;

  return relevant.slice(0, MAX_TRANSCRIPT_CHARS);
}

export function looksLikeTranscript(text: string) {
  const upperText = text.toUpperCase();
  const signals = [
    "UNOFFICIAL TRANSCRIPT",
    "TRANSFER CREDIT INFORMATION",
    "HISTORIC COURSE INFORMATION",
    "CURRENT COURSE INFORMATION",
    "COURSE",
  ];
  return signals.filter((signal) => upperText.includes(signal)).length >= 2;
}

export function toExtractedTextValues(
  parsed: TranscriptParseResponse,
): ExtractedTextValues {
  const graduationSemester = inferGraduationSemester(parsed.startSemester);

  return {
    major: parsed.major,
    specialization: parsed.specialization,
    minor: parsed.minor,
    startTerm: parsed.startSemester
      ? toPlannerTerm(parsed.startSemester.term)
      : null,
    startYear: parsed.startSemester?.year ?? null,
    endTerm: graduationSemester ? toPlannerTerm(graduationSemester.term) : null,
    endYear: graduationSemester?.year ?? null,
    transferCredits: parsed.transferCredits.map((credit) => ({
      name: formatCourseName(credit.courseName),
      courseId: credit.courseCode,
      genEds: credit.genEds ?? "",
      credits: credit.credits,
      sourceInstitution: credit.sourceInstitution,
    })),
    completedCourses: parsed.completedCourses.map((course) => ({
      term: toPlannerTerm(course.semester.term),
      year: course.semester.year,
      courseId: course.courseCode,
    })),
  };
}

export function parseTransferCreditsFromText(text: string) {
  const section = extractTransferSection(text);
  if (!section) return [];

  const institutionBlocks = splitTransferSectionByInstitution(section, text);
  const parsedCredits = institutionBlocks.flatMap(({ sourceInstitution, block }) =>
    /advanced placement/i.test(sourceInstitution)
      ? parseApCreditBlock(block, sourceInstitution)
      : parseExternalTransferBlock(block, sourceInstitution),
  );

  return dedupeTransferCredits(parsedCredits);
}

export function parseComputerScienceSpecializationFromText(text: string) {
  const majorMatch = text.match(/Major:\s*Computer Science\s*-\s*([^*]+?)(?=\s+(?:T\s+)?(?:Freshman|Sophomore|Junior|Senior|Undergraduate|Graduate|Current Status|Minor:|GenEd Program|$))/i);
  const rawSpecialization = majorMatch?.[1]?.trim();

  if (!rawSpecialization) return null;

  return rawSpecialization
    .replace(/\bT\b$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferGraduationSemester(startSemester: TranscriptParseResponse["startSemester"]) {
  if (!startSemester) return null;

  if (startSemester.term === "Fall") {
    return { term: "Spring" as const, year: startSemester.year + 4 };
  }

  if (startSemester.term === "Spring") {
    return { term: "Fall" as const, year: startSemester.year + 3 };
  }

  return { term: "Spring" as const, year: startSemester.year + 4 };
}

function extractTransferSection(text: string) {
  const match = text.match(
    /Transfer Credit Information(?:\s*\*\*)?\s*(?:\*\*\s*Equivalences\s*\*\*)?([\s\S]*?)(?=Historic Course Information|Fall\s+\d{4}|Spring\s+\d{4}|Summer\s+\d{4}|Winter\s+\d{4}|$)/i,
  );
  return match?.[1]?.trim() ?? "";
}

function splitTransferSectionByInstitution(section: string, fullText: string) {
  const institutions = extractTransferInstitutions(fullText).filter((institution) =>
    section.toLowerCase().includes(institution.toLowerCase()),
  );

  if (institutions.length === 0) {
    return [{ sourceInstitution: "Transfer Credit", block: section }];
  }

  const positions = institutions
    .map((sourceInstitution) => ({
      sourceInstitution,
      index: section.toLowerCase().indexOf(sourceInstitution.toLowerCase()),
    }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index);

  return positions.map((position, index) => {
    const nextPosition = positions[index + 1];
    return {
      sourceInstitution: position.sourceInstitution,
      block: section.slice(position.index, nextPosition?.index ?? section.length),
    };
  });
}

function extractTransferInstitutions(text: string) {
  const receivedSection = text.match(
    /Course Transcripts received from the following institutions:([\s\S]*?)(?=Transfer Credit Information)/i,
  )?.[1];

  if (!receivedSection) return [];

  return [...receivedSection.matchAll(/([A-Za-z][A-Za-z .&'-]+?)\s+on\s+\d{2}\/\d{2}\/\d{2}/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function parseApCreditBlock(block: string, sourceInstitution: string) {
  const apRegex =
    /(?:\b\d{4}\s+)?([A-Z][A-Z0-9 &.'-]+?)\/SCR\s+\d+\s+(NC|[A-FP][+-]?)\s+(\d+\.\d{2})\s+([A-Z]{4}\d{3}[A-Z]{0,2}|No Credit)(?:\s+((?:(?:FSAW|FSPW|FSMA|FSOC|FSAR|DSNL|DSNS|DSHS|DSHU|DSSP|SCIS|DVUP|DVCC)(?:,?\s*(?:or\s+)?(?:FSAW|FSPW|FSMA|FSOC|FSAR|DSNL|DSNS|DSHS|DSHU|DSSP|SCIS|DVUP|DVCC))*)))?/g;

  return [...block.matchAll(apRegex)]
    .filter((match) => isCreditBearingTransfer(match[2], match[3], match[4]))
    .map((match) => ({
      courseCode: match[4].trim(),
      courseName: `AP ${formatCourseName(match[1].trim())}`,
      credits: Number(match[3]),
      sourceInstitution,
      genEds: normalizeGenEdText(match[5] ?? ""),
    }));
}

function parseExternalTransferBlock(block: string, sourceInstitution: string) {
  const cleanedBlock = block
    .replace(sourceInstitution, " ")
    .replace(/Acceptable UG Inst\. Credits:\s*\d+\.\d{2}/gi, " ")
    .replace(/Applicable UG Inst\. Credits:\s*\d+\.\d{2}/gi, " ");
  const transferRegex =
    /(?:\b\d{4}\s+)?([A-Z][A-Z0-9 &.'-]+?)\s+(NC|[A-FP][+-]?)\s+(\d+\.\d{2})\s+([A-Z]{4}\d{3}[A-Z]{0,2}|No Credit)(?:\s+((?:(?:FSAW|FSPW|FSMA|FSOC|FSAR|DSNL|DSNS|DSHS|DSHU|DSSP|SCIS|DVUP|DVCC)(?:,?\s*(?:or\s+)?(?:FSAW|FSPW|FSMA|FSOC|FSAR|DSNL|DSNS|DSHS|DSHU|DSSP|SCIS|DVUP|DVCC))*)))?/g;

  return [...cleanedBlock.matchAll(transferRegex)]
    .filter((match) => isCreditBearingTransfer(match[2], match[3], match[4]))
    .map((match) => ({
      courseCode: match[4].trim(),
      courseName: formatCourseName(match[1].trim()),
      credits: Number(match[3]),
      sourceInstitution,
      genEds: normalizeGenEdText(match[5] ?? ""),
    }));
}

function removeNoCreditTransfers(credits: TranscriptParseResponse["transferCredits"]) {
  return credits.filter((credit) => {
    const noCreditText = `${credit.courseCode} ${credit.courseName}`.toLowerCase();
    return credit.credits !== 0 && !noCreditText.includes("no credit");
  });
}

function isCreditBearingTransfer(grade: string, credits: string, equivalentCourse: string) {
  return grade !== "NC" && Number(credits) > 0 && !/no credit/i.test(equivalentCourse);
}

function normalizeGenEdText(value: string) {
  const normalized = value.toUpperCase().replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const validTokens = normalized
    .split(/,\s*|\s+OR\s+|\s+/)
    .filter((token) => ALL_GEN_EDS.includes(token as never));

  if (validTokens.length === 0) return "";
  if (normalized.includes(" OR ")) return validTokens.join(" or ");
  if (normalized.includes(",")) return validTokens.join(", ");
  return validTokens.join(" ");
}

function dedupeTransferCredits<T extends { courseCode: string; sourceInstitution: string | null }>(credits: T[]) {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const credit of credits) {
    const key = `${credit.courseCode}:${credit.sourceInstitution ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(credit);
  }

  return deduped;
}

async function postOpenAIWithRetry(apiKey: string, body: unknown) {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.OPENAI_TRANSCRIPT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
    );

    try {
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const json = await response.json().catch(() => null);
      if (response.ok) return json;

      const message =
        json?.error?.message ?? `OpenAI request failed with ${response.status}`;
      lastError = new Error(message);

      if (
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === maxAttempts
      ) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxAttempts) throw lastError;
    } finally {
      clearTimeout(timeout);
    }

    await wait(250 * attempt);
  }

  throw lastError ?? new Error("OpenAI request failed");
}

function extractOutputText(response: any): string | null {
  if (typeof response?.output_text === "string") return response.output_text;

  const output = response?.output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

function findFirstIndex(text: string, needles: string[]) {
  return needles.reduce((lowest, needle) => {
    const index = text.toUpperCase().indexOf(needle.toUpperCase());
    if (index < 0) return lowest;
    return lowest < 0 ? index : Math.min(lowest, index);
  }, -1);
}

function formatCourseName(name: string): string {
  return name
    .split(" ")
    .map((word) =>
      word.length <= 2
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
