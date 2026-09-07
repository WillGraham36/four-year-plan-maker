import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { ApiError } from "../http/api-response";
import * as responses from "../http/api-response";
import { loadModule } from "./helpers";

type Handler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>;
type Route = Record<string, Handler>;
const course = { courseId: "CMSC131", name: "Intro", credits: 4, genEds: [] };
const semester = { term: "FALL", year: 2026 };
const identifier = { courseId: course.courseId, semester };
const placement = { course, semester, index: 0 };
const cases = [
  { path: "academic/overview", method: "GET", service: "academic-overview-service", operation: "getAcademicOverview" },
  { path: "user/profile", method: "GET", service: "user-service", operation: "getUserInfo" },
  { path: "onboarding", method: "GET", service: "onboarding-service", operation: "getOnboarding" },
  { path: "onboarding", method: "POST", service: "onboarding-service", operation: "saveOnboarding", body: { startTerm: "FALL", startYear: 2026, endTerm: "SPRING", endYear: 2030, major: "Computer Science", track: "GENERAL" }, status: 201 },
  { path: "planner/courses", method: "GET", service: "planner-service", operation: "getUserCourses" },
  { path: "planner/courses", method: "POST", service: "planner-service", operation: "saveCoursePlacements", body: [placement], status: 201 },
  { path: "planner/courses", method: "DELETE", service: "planner-service", operation: "deleteCoursePlacements", body: [identifier] },
  { path: "planner/notes", method: "PUT", service: "user-service", operation: "updateNote", body: { note: "My plan" } },
  { path: "planner/off-terms", method: "POST", service: "user-service", operation: "createOffTerm", body: { term: "SUMMER", year: 2026 } },
  { path: "planner/off-terms", method: "DELETE", service: "user-service", operation: "deleteOffTerm", query: "?term=SUMMER&year=2026" },
  { path: "planner/semesters/[term]/[year]/completion", method: "PUT", service: "user-service", operation: "updateSemesterCompletion", body: { completed: true } },
  { path: "requirements/cs-track", method: "PUT", service: "user-service", operation: "updateTrack", body: { track: "ML" } },
  { path: "requirements/geneds", method: "GET", service: "planner-service", operation: "getUserCourses" },
  { path: "requirements/ul-concentration", method: "GET", service: "planner-service", operation: "getULConcentration" },
  { path: "requirements/ul-concentration", method: "PATCH", service: "user-service", operation: "updateConcentration", body: { concentration: "MATH" } },
  { path: "requirements/ul-concentration/custom-courses", method: "POST", service: "planner-service", operation: "setCustomULCourse", body: identifier },
  { path: "requirements/ul-concentration/custom-courses", method: "DELETE", service: "planner-service", operation: "setCustomULCourse", body: identifier },
  { path: "admin/courses/catalog", method: "GET", service: "course-service", operation: "getCourseCatalog", admin: true },
  { path: "admin/courses/sync", method: "POST", service: "course-service", operation: "syncDepartments", body: { departments: ["CMSC"] }, admin: true },
] satisfies Array<{ path: string; method: string; service: string; operation: string; body?: unknown; query?: string; status?: number; admin?: boolean }>;

function setup(entry: typeof cases[number], authError?: ApiError) {
  const calls: Array<{ operation: string; args: unknown[] }> = [];
  const dependencies: Record<string, unknown> = {
    "@/server/http/api-response": responses,
    "@/server/auth/current-session": {
      requireUserId: async () => { if (authError) throw authError; return "user_owner"; },
      requireAdmin: async () => { if (authError) throw authError; return "admin_owner"; },
    },
  };
  for (const service of ["planner-service", "user-service", "course-service", "onboarding-service", "gen-ed-service", "academic-overview-service"]) {
    dependencies[`@/server/services/${service}`] = new Proxy({}, {
      get: (_target, operation: string) => (...args: unknown[]) => {
        calls.push({ operation, args });
        return operation === "groupCourses" ? {} : Promise.resolve([]);
      },
    });
  }
  const subject = loadModule<Route>(`app/api/${entry.path}/route.ts`, dependencies);
  const invoke = (body: unknown = entry.body, query = entry.query ?? "", raw?: string) => {
    const request = new NextRequest(`http://localhost/api/${entry.path}${query}`, {
      method: entry.method,
      ...(entry.method === "GET" || body === undefined && raw === undefined ? {} : {
        headers: { "Content-Type": "application/json" }, body: raw ?? JSON.stringify(body),
      }),
    });
    return subject[entry.method](request, { params: Promise.resolve({ term: "FALL", year: "2026" }) });
  };
  return { invoke, calls };
}

for (const entry of cases) {
  test(`${entry.method} ${entry.path}: authorized response and user scope`, async () => {
    const { invoke, calls } = setup(entry);
    const response = await invoke();
    assert.equal(response.status, entry.status ?? 200);
    assert.equal((await response.json()).ok, true);
    const call = calls.find((call) => call.operation === entry.operation);
    assert.ok(call, "handler must call its service");
    if (!entry.admin) assert.equal(call.args[0], "user_owner");
  });

  test(`${entry.method} ${entry.path}: rejects unauthorized access without service calls`, async () => {
    const { invoke, calls } = setup(entry, new ApiError(401, "UNAUTHENTICATED", "Sign in"));
    const response = await invoke();
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHENTICATED");
    assert.deepEqual(calls, []);
  });

  if (entry.body !== undefined) {
    test(`${entry.method} ${entry.path}: invalid schema and malformed JSON return 400 without writes`, async () => {
      for (const raw of ["null", "{broken", ""]) {
        const { invoke, calls } = setup(entry);
        const response = await invoke(null, "", raw);
        assert.equal(response.status, 400, `body: ${JSON.stringify(raw)}`);
        assert.equal((await response.json()).ok, false);
        assert.deepEqual(calls, []);
      }
    });
  }
}

test("off-term deletion rejects a missing year rather than coercing it to zero", async () => {
  const entry = cases.find((entry) => entry.path === "planner/off-terms" && entry.method === "DELETE")!;
  const { invoke, calls } = setup(entry);
  assert.equal((await invoke(undefined, "?term=SUMMER")).status, 400);
  assert.deepEqual(calls, []);
});

test("admin routes reject non-admin users before accessing the catalog", async () => {
  for (const entry of cases.filter((entry) => entry.admin)) {
    const { invoke, calls } = setup(entry, new ApiError(403, "FORBIDDEN", "Admin required"));
    assert.equal((await invoke()).status, 403);
    assert.deepEqual(calls, []);
  }
});

test("planner batch limit is enforced before any writes", async () => {
  const entry = cases.find((entry) => entry.operation === "saveCoursePlacements")!;
  const { invoke, calls } = setup(entry);
  assert.equal((await invoke(Array.from({ length: 201 }, () => placement))).status, 400);
  assert.deepEqual(calls, []);
  assert.equal((await invoke(Array.from({ length: 200 }, () => placement))).status, 201);
});

test("guest resume preserves onboarding state and refreshes its cookie", async () => {
  const expiresAt = new Date("2030-01-01");
  const subject = loadModule<Route>("app/api/guest-session/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: null }) },
    "@/server/auth/current-session": { isOnboarded: async (id: string) => { assert.equal(id, "guest_owner"); return true; } },
    "@/server/auth/guest-session": { createOrResumeGuestSession: async () => ({ userId: "guest_owner", expiresAt, token: "saved_token", created: false }) },
  });
  const response = await subject.POST(new NextRequest("http://localhost/api/guest-session", { method: "POST" }), { params: Promise.resolve({}) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.onboarded, true);
  assert.match(response.headers.get("set-cookie")!, /saved_token/);
});
