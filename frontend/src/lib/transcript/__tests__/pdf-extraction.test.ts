import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractTextFromPdf } from "../service";
import { MAX_TRANSCRIPT_PAGES } from "../limits";

test("extracts a synthetic multi-page transcript with the installed PDF parser", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("UNOFFICIAL TRANSCRIPT Historic Course Information", { font, size: 12 });
  pdf.addPage().drawText("Fall 2025 CMSC430 INTRO TO COMPILERS", { font, size: 12 });
  const bytes = await pdf.save({ useObjectStreams: false });
  const text = await extractTextFromPdf(Buffer.from(bytes));
  assert.match(text, /UNOFFICIAL TRANSCRIPT/);
  assert.match(text, /CMSC430/);
});

test("rejects spoofed PDF content before starting a worker", async () => {
  await assert.rejects(extractTextFromPdf(Buffer.from("this is not a PDF")), /not a valid PDF/);
});

test("rejects PDFs exceeding the page limit", async () => {
  const pdf = await PDFDocument.create();
  for (let i = 0; i <= MAX_TRANSCRIPT_PAGES; i++) pdf.addPage();
  await assert.rejects(extractTextFromPdf(Buffer.from(await pdf.save({ useObjectStreams: false }))), /at most 20 pages/);
});

test("terminates a worker when its processing deadline is exceeded", async () => {
  await assert.rejects(extractTextFromPdf(Buffer.from("%PDF-1.7 invalid"), 1), /timed out/);
});
