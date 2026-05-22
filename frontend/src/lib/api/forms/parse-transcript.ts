"use server";

import { TranscriptParsingService } from "@/lib/transcript/service";

const transcriptParsingService = new TranscriptParsingService();

export async function parseTranscript(file: File) {
  return transcriptParsingService.parsePdfFile(file);
}

export type { ExtractedTextValues, TranscriptParsingResult } from "@/lib/transcript/types";
