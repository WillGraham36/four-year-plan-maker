import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractTextFromPdf } from "../service";

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
