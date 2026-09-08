import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { TranscriptParsingService } from "../service";

const parsed = {
  startSemester: null, graduationSemester: null, major: null, specialization: null,
  minor: null, transferCredits: [], completedCourses: [],
};

async function syntheticPdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("UNOFFICIAL TRANSCRIPT Historic Course Information COURSE", { font, size: 10 });
  return new File([Buffer.from(await pdf.save({ useObjectStreams: false }))], "synthetic.pdf", { type: "application/pdf" });
}

test("real PDF extraction returns parsed values without echoing transcript text", async (context) => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  try {
    const fetchMock = context.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      assert.equal(body.store, false);
      assert.match(JSON.stringify(body.input), /UNOFFICIAL TRANSCRIPT/);
      return Response.json({ output_text: JSON.stringify(parsed) });
    });
    const result = await new TranscriptParsingService().parsePdfFile(await syntheticPdf());
    assert.ok("success" in result);
    assert.equal("text" in result, false);
    assert.equal(fetchMock.mock.calls.length, 1);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("provider authentication errors are not retried or exposed", async (context) => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  try {
    const fetchMock = context.mock.method(globalThis, "fetch", async () => Response.json({ error: { message: "secret provider details" } }, { status: 401 }));
    context.mock.method(console, "error", () => {});
    const result = await new TranscriptParsingService().parsePdfFile(await syntheticPdf());
    assert.ok("error" in result);
    assert.doesNotMatch(JSON.stringify(result), /secret|details/);
    assert.equal(fetchMock.mock.calls.length, 1);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("provider timeout respects the remaining total deadline and is not retried", async (context) => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  try {
    const fetchMock = context.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal!.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    const started = Date.now();
    await assert.rejects(new TranscriptParsingService().parseTranscriptText("COURSE", started + 30), /aborted|deadline/);
    assert.ok(Date.now() - started < 1000);
    assert.ok(fetchMock.mock.calls.length <= 1);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("retryable provider failures use at most two attempts", async (context) => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  try {
    const fetchMock = context.mock.method(globalThis, "fetch", async () => Response.json({}, { status: 503 }));
    await assert.rejects(new TranscriptParsingService().parseTranscriptText("COURSE"));
    assert.equal(fetchMock.mock.calls.length, 2);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});
