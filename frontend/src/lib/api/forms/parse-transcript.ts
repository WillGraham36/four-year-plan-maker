"use server";

import { TranscriptParsingService } from "@/lib/transcript/service";
import { requireUserId } from "@/server/auth/current-session";
import { acquireTranscriptLease } from "@/server/security/abuse-limits";
import { ApiError } from "@/server/http/api-response";
import { TranscriptInputError, validateTranscriptFile } from "@/lib/transcript/limits";
import type { TranscriptParsingResult } from "@/lib/transcript/types";

const transcriptParsingService = new TranscriptParsingService();

export async function parseTranscript(file: File): Promise<TranscriptParsingResult> {
  let release: (() => Promise<void>) | undefined;
  try {
    if (process.env.TRANSCRIPT_PARSING_ENABLED === "false") {
      return { error: "Transcript import is temporarily unavailable. You can enter courses manually." };
    }
    validateTranscriptFile(file);
    const userId = await requireUserId();
    release = await acquireTranscriptLease(userId);
    return await transcriptParsingService.parsePdfFile(file);
  } catch (error) {
    if (error instanceof ApiError || error instanceof TranscriptInputError) return { error: error.message };
    console.error("Transcript admission failed");
    return { error: "Transcript import is unavailable. Please try again later or enter courses manually." };
  } finally {
    await release?.();
  }
}

export type { ExtractedTextValues, TranscriptParsingResult } from "@/lib/transcript/types";
