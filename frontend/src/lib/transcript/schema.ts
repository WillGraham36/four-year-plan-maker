import { z } from "zod";
import { ALL_GEN_EDS, ALL_MAJORS, ALL_MINORS, Term } from "@/lib/utils/types";
import { TranscriptParseResponse, TranscriptTerm } from "./types";

const transcriptTerms = ["Spring", "Summer", "Fall", "Winter"] as const;

const semesterSchema = z.object({
  term: z.enum(transcriptTerms),
  year: z.number().int().min(1900).max(2200),
});

const courseCodeSchema = z
  .string()
  .trim()
  .min(2)
  .transform((value) => value.replace(/\s+/g, "").toUpperCase());

export const transcriptParseResponseSchema = z
  .object({
    startSemester: semesterSchema.nullable(),
    graduationSemester: semesterSchema.nullable(),
    major: z.string().trim().nullable(),
    specialization: z.string().trim().nullable(),
    minor: z.string().trim().nullable(),
    transferCredits: z.array(
      z.object({
        courseCode: courseCodeSchema,
        courseName: z.string().trim().min(1),
        credits: z.number().min(0).max(30).nullable(),
        sourceInstitution: z.string().trim().nullable(),
        genEds: z.string().trim(),
      })
    ),
    completedCourses: z.array(
      z.object({
        courseCode: courseCodeSchema,
        semester: semesterSchema,
      })
    ),
  })
  .strict()
  .transform((value) => ({
    ...value,
    major: normalizeCatalogValue(value.major, ALL_MAJORS),
    minor: normalizeCatalogValue(value.minor, ALL_MINORS),
    specialization: normalizeSpecialization(value.specialization),
    transferCredits: dedupeBy(
      value.transferCredits
        .filter((credit) => isLikelyCourseCode(credit.courseCode))
        .map((credit) => ({
          ...credit,
          genEds: normalizeGenEds(credit.genEds),
        })),
      (credit) => `${credit.courseCode}:${credit.sourceInstitution ?? ""}`
    ),
    completedCourses: dedupeBy(
      value.completedCourses.filter((course) => isLikelyCourseCode(course.courseCode)),
      (course) => `${course.courseCode}:${course.semester.term}:${course.semester.year}`
    ),
  })) satisfies z.ZodTypeAny;

export const transcriptJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "startSemester",
    "graduationSemester",
    "major",
    "specialization",
    "minor",
    "transferCredits",
    "completedCourses",
  ],
  properties: {
    startSemester: nullableSemesterJsonSchema(),
    graduationSemester: nullableSemesterJsonSchema(),
    major: nullableStringJsonSchema(),
    specialization: nullableStringJsonSchema(),
    minor: nullableStringJsonSchema(),
    transferCredits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["courseCode", "courseName", "credits", "sourceInstitution", "genEds"],
        properties: {
          courseCode: { type: "string" },
          courseName: { type: "string" },
          credits: nullableNumberJsonSchema(),
          sourceInstitution: nullableStringJsonSchema(),
          genEds: { type: "string" },
        },
      },
    },
    completedCourses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["courseCode", "semester"],
        properties: {
          courseCode: { type: "string" },
          semester: semesterJsonSchema(),
        },
      },
    },
  },
} as const;

export function toPlannerTerm(term: TranscriptTerm): Term {
  return term.toUpperCase() as Term;
}

export function normalizeParsedTranscript(parsed: unknown): TranscriptParseResponse {
  const result = transcriptParseResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI transcript JSON failed validation: ${result.error.message}`);
  }
  return result.data as TranscriptParseResponse;
}

function semesterJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["term", "year"],
    properties: {
      term: { type: "string", enum: transcriptTerms },
      year: { type: "integer" },
    },
  } as const;
}

function nullableSemesterJsonSchema() {
  return {
    anyOf: [semesterJsonSchema(), { type: "null" }],
  } as const;
}

function nullableStringJsonSchema() {
  return {
    anyOf: [{ type: "string" }, { type: "null" }],
  } as const;
}

function nullableNumberJsonSchema() {
  return {
    anyOf: [{ type: "number" }, { type: "null" }],
  } as const;
}

function normalizeCatalogValue(value: string | null, allowedValues: readonly string[]) {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  return allowedValues.find((candidate) => lowerValue.includes(candidate.toLowerCase())) ?? value;
}

function normalizeSpecialization(value: string | null) {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes("machine")) return "Machine Learning";
  if (lowerValue.includes("data")) return "Data Science";
  if (lowerValue.includes("quantum")) return "Quantum Information";
  if (lowerValue.includes("cyber")) return "Cybersecurity";
  if (lowerValue.includes("general")) return "General Track";
  return value;
}

function normalizeGenEds(value: string | undefined) {
  if (!value) return "";
  const normalized = value.toUpperCase().replace(/\s+/g, " ").trim();
  const tokens = normalized.split(/,\s*|\s+OR\s+|\s+/).filter(Boolean);
  const validTokens = tokens.filter((token) => ALL_GEN_EDS.includes(token as never));
  if (validTokens.length === 0) return "";
  if (normalized.includes(" OR ")) return validTokens.join(" or ");
  if (normalized.includes(",")) return validTokens.join(", ");
  return validTokens.join(" ");
}

function isLikelyCourseCode(value: string) {
  return /^[A-Z]{4}\d{3}[A-Z]{0,2}$/.test(value);
}

function dedupeBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}
