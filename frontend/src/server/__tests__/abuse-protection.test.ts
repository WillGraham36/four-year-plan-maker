import assert from "node:assert/strict";
import test from "node:test";
import { loadModule, result } from "./helpers";
import * as responses from "../http/api-response";

type Action = typeof import("../../lib/api/forms/parse-transcript");

function action(options: { unauthenticated?: boolean; limited?: boolean; failure?: boolean } = {}) {
  const calls: string[] = [];
  const subject = loadModule<Action>("lib/api/forms/parse-transcript.ts", {
    "@/server/http/api-response": responses,
    "@/server/auth/current-session": { requireUserId: async () => {
      calls.push("auth");
      if (options.unauthenticated) throw new responses.ApiError(401, "UNAUTHENTICATED", "Authentication is required");
      return "guest_owner";
    } },
    "@/server/security/abuse-limits": { acquireTranscriptLease: async (userId: string) => {
      assert.equal(userId, "guest_owner"); calls.push("quota");
      if (options.limited) throw new responses.ApiError(429, "RATE_LIMITED", "Too many requests");
      return async () => { calls.push("release"); };
    } },
    "@/lib/transcript/service": { TranscriptParsingService: class {
      async parsePdfFile() {
        calls.push("parse");
        if (options.failure) throw new Error("upstream secret");
        return { success: true };
      }
    } },
  });
  return { subject, calls };
}

const file = () => new File(["%PDF-1.7 synthetic"], "test.pdf", { type: "application/pdf" });

test("anonymous transcript requests cannot acquire quotas or invoke the parser", async () => {
  const { subject, calls } = action({ unauthenticated: true });
  assert.ok("error" in await subject.parseTranscript(file()));
  assert.deepEqual(calls, ["auth"]);
});

test("quota rejection happens before parsing", async () => {
  const { subject, calls } = action({ limited: true });
  assert.ok("error" in await subject.parseTranscript(file()));
  assert.deepEqual(calls, ["auth", "quota"]);
});

test("valid guest transcript releases its lease after success", async () => {
  const { subject, calls } = action();
  assert.ok("success" in await subject.parseTranscript(file()));
  assert.deepEqual(calls, ["auth", "quota", "parse", "release"]);
});

test("parser failure releases its lease without returning sensitive errors", async (context) => {
  context.mock.method(console, "error", () => {});
  const { subject, calls } = action({ failure: true });
  assert.doesNotMatch(JSON.stringify(await subject.parseTranscript(file())), /secret/);
  assert.equal(calls.at(-1), "release");
});

test("kill switch and oversized files stop before admission", async () => {
  const previous = process.env.TRANSCRIPT_PARSING_ENABLED;
  try {
    process.env.TRANSCRIPT_PARSING_ENABLED = "false";
    const { subject, calls } = action();
    assert.ok("error" in await subject.parseTranscript(file()));
    assert.deepEqual(calls, []);
    process.env.TRANSCRIPT_PARSING_ENABLED = "true";
    const large = new File([new Uint8Array(3 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" });
    assert.ok("error" in await subject.parseTranscript(large));
    assert.deepEqual(calls, []);
  } finally {
    if (previous === undefined) delete process.env.TRANSCRIPT_PARSING_ENABLED;
    else process.env.TRANSCRIPT_PARSING_ENABLED = previous;
  }
});

test("public course endpoints reject limits before service calls", async () => {
  for (const path of ["search", "[courseId]"]) {
    const subject = loadModule<{ GET: (request: Request, context: unknown) => Promise<Response> }>(`app/api/courses/${path}/route.ts`, {
      "@/server/http/api-response": responses,
      "@/server/security/abuse-limits": { limitPublicCourses: async () => { throw new responses.ApiError(429, "RATE_LIMITED", "Too many requests"); } },
      "@/server/services/course-service": {
        autocompleteCourses: async () => assert.fail("limited search reached service"),
        findOrFetchCourse: async () => assert.fail("limited detail reached service"),
      },
    });
    assert.equal((await subject.GET(new Request("http://localhost"), { params: Promise.resolve({ courseId: "CMSC131" }) })).status, 429);
  }
});

test("pending guest tokens cannot bypass creation limits through session resolution", async () => {
  const calls: string[] = [];
  const client = { query: async (sql: string) => { calls.push(sql); return result(); } };
  const subject = loadModule<typeof import("../auth/guest-session")>("server/auth/guest-session.ts", {
    "@/server/db/transactions": { withTransaction: async (operation: (value: unknown) => Promise<unknown>) => operation(client) },
    "@/server/security/abuse-limits": { limitGuestCreation: async () => { throw new responses.ApiError(429, "RATE_LIMITED", "Too many requests"); } },
  });
  await assert.rejects(subject.resolveGuestSession(`tp_pending_guest_${"a".repeat(43)}`, { materializePending: true }), { status: 429 });
  await assert.rejects(subject.createOrResumeGuestSession(null), { status: 429 });
  assert.equal(calls.some((sql) => sql.includes("INSERT INTO users")), false);
});

test("busy transcript admission never consumes quotas or inserts another lease", async () => {
  const calls: string[] = [];
  const subject = loadModule<typeof import("../security/abuse-limits")>("server/security/abuse-limits.ts", {
    "@/server/http/api-response": responses,
    "./request-identity": { currentIpSubject: async () => "ip", hashSubject: () => "user", positiveLimit: (_name: string, fallback: number) => fallback },
    "@/server/db/transactions": { withTransaction: async (operation: (client: unknown) => Promise<unknown>) => operation({
      query: async (sql: string) => { calls.push(sql); return result([{ total: 1, own: 1 }]); },
    }) },
  });
  await assert.rejects(subject.acquireTranscriptLease("user"), { status: 429 });
  assert.equal(calls.some((sql) => sql.includes("INSERT INTO")), false);
});

test("IP identity ignores spoofed headers and groups IPv6 /64 addresses", () => {
  const subject = loadModule<typeof import("../security/request-identity")>("server/security/request-identity.ts", {
    "next/headers": {},
  });
  const oldVercel = process.env.VERCEL;
  const oldHeader = process.env.ABUSE_TRUSTED_IP_HEADER;
  try {
    delete process.env.VERCEL; delete process.env.ABUSE_TRUSTED_IP_HEADER;
    assert.equal(subject.ipSubject(new Headers({ "x-forwarded-for": "1.2.3.4" })), subject.ipSubject(new Headers()));
    process.env.VERCEL = "1";
    assert.equal(subject.ipSubject(new Headers({ "x-vercel-forwarded-for": "2001:db8:1:2::1" })), subject.ipSubject(new Headers({ "x-vercel-forwarded-for": "2001:db8:1:2::abcd" })));
    assert.notEqual(subject.ipSubject(new Headers({ "x-vercel-forwarded-for": "1.2.3.4" })), subject.ipSubject(new Headers({ "x-vercel-forwarded-for": "1.2.3.5" })));
  } finally {
    if (oldVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = oldVercel;
    if (oldHeader === undefined) delete process.env.ABUSE_TRUSTED_IP_HEADER; else process.env.ABUSE_TRUSTED_IP_HEADER = oldHeader;
  }
});
