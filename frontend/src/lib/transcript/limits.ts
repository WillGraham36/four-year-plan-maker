// Keep multipart overhead below Vercel's 4.5 MB request limit.
export const MAX_TRANSCRIPT_FILE_MB = 3;
export const MAX_TRANSCRIPT_FILE_BYTES = MAX_TRANSCRIPT_FILE_MB * 1024 * 1024;
export const MAX_TRANSCRIPT_PAGES = 20;
export const MAX_EXTRACTED_CHARS = 36_000;
export const PDF_EXTRACTION_TIMEOUT_MS = 8_000;
export const TRANSCRIPT_DEADLINE_MS = 25_000;

export class TranscriptInputError extends Error {}

export function validateTranscriptFile(file: File) {
  if (!(file instanceof File) || file.size === 0) {
    throw new TranscriptInputError("Please choose a non-empty PDF file.");
  }
  if (file.type !== "application/pdf") {
    throw new TranscriptInputError("File must be a PDF.");
  }
  if (file.size > MAX_TRANSCRIPT_FILE_BYTES) {
    throw new TranscriptInputError(`File size exceeds ${MAX_TRANSCRIPT_FILE_MB} MB limit.`);
  }
}
