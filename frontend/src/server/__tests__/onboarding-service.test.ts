import assert from "node:assert/strict";
import test from "node:test";
import { loadModule, result } from "./helpers";
import { onboardingSchema } from "../validation/domain";
import * as responses from "../http/api-response";

type Onboarding = typeof import("../services/onboarding-service");
const input = onboardingSchema.parse({
  startTerm: "FALL", startYear: 2026, endTerm: "SPRING", endYear: 2030,
  major: "Computer Science", track: "ML",
  transferCredits: [{ name: "AP Calculus", course: { courseId: "MATH140", name: "Calculus", credits: 4, genEds: [["FSMA"]] }, semester: { term: "TRANSFER", year: -1 }, genEdOverrides: [["FSMA"]] }],
});

test("onboarding creates the user before transfers and saves imported placements on the same connection", async () => {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const client = { query: async (sql: string, values?: unknown[]) => { calls.push({ sql, values }); return result([], 1); } };
  const completed = [{ course: { courseId: "CMSC131", name: "Intro", credits: 4, genEds: [] }, semester: { term: "FALL" as const, year: 2026 }, index: 0 }];
  const subject = loadModule<Onboarding>("server/services/onboarding-service.ts", {
    "@/server/db/transactions": { withTransaction: async (operation: (connection: unknown) => Promise<unknown>) => operation(client) },
    "./course-service": { findOrCreateCourse: async (course: unknown, connection: unknown) => { assert.equal(connection, client); return course; } },
    "./planner-service": { saveCoursePlacementsInTransaction: async (id: string, placements: unknown, connection: unknown) => {
      assert.equal(id, "user_owner"); assert.equal(connection, client); assert.equal(placements, completed);
      assert.ok(calls.some(({ sql }) => sql.includes("INSERT INTO user_courses")));
    } },
  });
  await subject.saveOnboarding("user_owner", input, completed);
  assert.match(calls[0].sql, /INSERT INTO users/);
  assert.equal(calls[0].values?.[7], 4, "ML must persist its legacy enum ordinal");
  for (const call of calls) assert.equal(call.values?.[0], "user_owner");
  const transfer = calls.find(({ sql }) => sql.includes("INSERT INTO user_courses"));
  assert.deepEqual(transfer?.values, ["user_owner", "MATH140", "TRANSFER", -1, "AP Calculus", '[["FSMA"]]']);
});

test("CS onboarding requires a track before opening a transaction", async () => {
  const subject = loadModule<Onboarding>("server/services/onboarding-service.ts");
  await assert.rejects(() => subject.saveOnboarding("user_owner", { ...input, track: null }), { status: 400, code: "TRACK_REQUIRED" });
});

test("failed imported placement propagates out of onboarding for transaction rollback", async () => {
  const original = new Error("placement failed");
  const subject = loadModule<Onboarding>("server/services/onboarding-service.ts", {
    "@/server/db/transactions": { withTransaction: async (operation: (connection: unknown) => Promise<unknown>) => operation({ query: async () => result() }) },
    "./planner-service": { saveCoursePlacementsInTransaction: async () => { throw original; } },
  });
  await assert.rejects(() => subject.saveOnboarding("user_owner", { ...input, transferCredits: [] }), (error) => error === original);
});

test("onboarding retrieval returns null for a missing user but propagates database failures", async () => {
  let error: Error = new responses.ApiError(404, "USER_NOT_FOUND", "Missing");
  const subject = loadModule<Onboarding>("server/services/onboarding-service.ts", {
    "@/server/http/api-response": responses,
    "./user-service": { getUser: async () => { throw error; } },
  });
  assert.equal(await subject.getOnboarding("user_owner"), null);
  error = new Error("database unavailable");
  await assert.rejects(() => subject.getOnboarding("user_owner"), (thrown) => thrown === error);
});
