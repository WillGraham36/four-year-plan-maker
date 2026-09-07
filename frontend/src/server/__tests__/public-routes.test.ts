import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { loadModule, result } from "./helpers";
import * as responses from "../http/api-response";

test("public course search passes its query and returns suggestions", async () => {
  const subject = loadModule<typeof import("../../app/api/courses/search/route")>("app/api/courses/search/route.ts", {
    "@/server/services/course-service": { autocompleteCourses: async (q: string) => { assert.equal(q, "cmsc 1"); return [{ courseId: "CMSC131", name: "Intro", credits: 4 }]; } },
  });
  const response = await subject.GET(new NextRequest("http://localhost/api/courses/search?q=cmsc%201"));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data[0].courseId, "CMSC131");
});

test("public course detail awaits dynamic parameters and preserves not-found errors", async () => {
  const subject = loadModule<typeof import("../../app/api/courses/[courseId]/route")>("app/api/courses/[courseId]/route.ts", {
    "@/server/http/api-response": responses,
    "@/server/services/course-service": { findOrFetchCourse: async (id: string) => {
      assert.equal(id, "CMSC999");
      throw new responses.ApiError(404, "COURSE_NOT_FOUND", "Course not found");
    } },
  });
  const response = await subject.GET(new Request("http://localhost"), { params: Promise.resolve({ courseId: "CMSC999" }) });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "COURSE_NOT_FOUND");
});

test("health endpoint checks the database and returns a structured response", async () => {
  const subject = loadModule<typeof import("../../app/api/health/route")>("app/api/health/route.ts", {
    "@/server/db/client": { query: async (sql: string) => { assert.equal(sql, "SELECT 1"); return result(); } },
  });
  assert.deepEqual(await (await subject.GET()).json(), { ok: true, data: { status: "ok" } });
});

test("session endpoint returns the current session DTO", async () => {
  const session = { authenticated: false, guest: false, userId: null, onboarded: false, guestExpiresAt: null };
  const subject = loadModule<typeof import("../../app/api/session/route")>("app/api/session/route.ts", {
    "@/server/auth/current-session": { getCurrentSession: async () => session },
  });
  assert.deepEqual(await (await subject.GET()).json(), { ok: true, data: session });
});

test("guest migration endpoint requires a signed-in user and clears cookies on success", async () => {
  let userId: string | null = null;
  let migrations = 0;
  const subject = loadModule<typeof import("../../app/api/guest-session/migrate/route")>("app/api/guest-session/migrate/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId }) },
    "next/headers": { cookies: async () => ({ get: () => ({ value: "guest_token" }) }) },
    "@/server/auth/current-session": { getCurrentSession: async () => ({ userId, guest: false }) },
    "@/server/auth/guest-session": { migrateGuestSession: async (token: string, id: string) => {
      migrations += 1;
      assert.equal(token, "guest_token"); assert.equal(id, "user_owner");
      return { message: "Migrated" };
    } },
  });
  assert.equal((await subject.POST()).status, 401);
  assert.equal(migrations, 0);
  userId = "user_owner";
  const response = await subject.POST();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.userId, "user_owner");
  assert.equal(migrations, 1);
  assert.match(response.headers.get("set-cookie")!, /Max-Age=0/);
});

test("unexpected errors are logged but sensitive details are not returned", async (context) => {
  const logged = context.mock.method(console, "error", () => {});
  const response = await responses.route(async () => { throw new Error("database password=secret"); });
  assert.equal(response.status, 500);
  const body = await response.text();
  assert.equal(body.includes("secret"), false);
  assert.match(body, /INTERNAL_ERROR/);
  assert.equal(logged.mock.calls.length, 1);
});

test("100 concurrent handler requests keep their independent response data", async () => {
  const subject = loadModule<typeof import("../../app/api/courses/search/route")>("app/api/courses/search/route.ts", {
    "@/server/services/course-service": { autocompleteCourses: async (q: string) => {
      await new Promise((resolve) => setImmediate(resolve));
      return [{ courseId: q }];
    } },
  });
  await Promise.all(Array.from({ length: 100 }, async (_, index) => {
    const response = await subject.GET(new NextRequest(`http://localhost/api/courses/search?q=CMSC${100 + index}`));
    assert.equal((await response.json()).data[0].courseId, `CMSC${100 + index}`);
  }));
});
