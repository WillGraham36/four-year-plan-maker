import { Worker } from "node:worker_threads";
import { join } from "node:path";
import {
  MAX_EXTRACTED_CHARS, MAX_TRANSCRIPT_PAGES, PDF_EXTRACTION_TIMEOUT_MS, TranscriptInputError,
} from "./limits";

// Separate thread is necessary: a Promise timeout cannot interrupt synchronous PDF parsing.
const workerSource = `
  const { parentPort, workerData } = require('node:worker_threads');
  const { createRequire } = require('node:module');
  const { PdfReader } = createRequire(workerData.requireBase)('pdfreader');
  const controller = new AbortController();
  const bytes = Buffer.alloc(workerData.bytes.length);
  bytes.set(workerData.bytes);
  const text = [];
  let length = 0;
  let finished = false;
  function finish(result) {
    if (finished) return;
    finished = true;
    parentPort.postMessage(result);
    controller.abort();
  }
  new PdfReader({ signal: controller.signal }).parseBuffer(bytes, (error, item) => {
    if (finished) return;
    if (error) return finish({ error: 'invalid' });
    if (!item) return finish({ text: text.join(' ') });
    if (item.page > workerData.maxPages) return finish({ error: 'pages' });
    if (item.text) {
      length += item.text.length + 1;
      if (length > workerData.maxChars) return finish({ error: 'text' });
      text.push(item.text);
    }
  });
`;

export async function extractTextFromPdf(buffer: Buffer, timeoutMs = PDF_EXTRACTION_TIMEOUT_MS): Promise<string> {
  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new TranscriptInputError("File is not a valid PDF.");
  }
  const worker = new Worker(workerSource, {
    eval: true,
    workerData: { bytes: buffer, requireBase: join(process.cwd(), "package.json"), maxPages: MAX_TRANSCRIPT_PAGES, maxChars: MAX_EXTRACTED_CHARS },
    resourceLimits: { maxOldGenerationSizeMb: 128, maxYoungGenerationSizeMb: 16 },
    stdout: true,
    stderr: true,
  });
  // Parser diagnostics can contain document content. Do not forward them to application logs.
  worker.stdout?.resume();
  worker.stderr?.resume();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await new Promise<string>((resolve, reject) => {
      timeout = setTimeout(() => reject(new TranscriptInputError("PDF processing timed out. Try a smaller PDF.")), timeoutMs);
      worker.once("message", (message: { text?: string; error?: string }) => {
        if (typeof message.text === "string") return resolve(message.text);
        const error = message.error === "pages" ? `PDF must contain at most ${MAX_TRANSCRIPT_PAGES} pages.`
          : message.error === "text" ? "PDF contains too much text. Please upload only your transcript."
          : "Could not read this PDF. Please export a new copy and try again.";
        reject(new TranscriptInputError(error));
      });
      worker.once("error", () => reject(new TranscriptInputError("Could not process this PDF. Try a smaller PDF.")));
      worker.once("exit", () => reject(new TranscriptInputError("PDF processing stopped. Please try again.")));
    });
  } finally {
    clearTimeout(timeout);
    await worker.terminate();
  }
}
