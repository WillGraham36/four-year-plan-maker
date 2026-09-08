import assert from "node:assert/strict";
import test from "node:test";
import { loadModule, result } from "./helpers";

type Courses = typeof import("../services/course-service");
const row = { course_id: "CMSC131", name: "Intro", dept_id: "CMSC", credits: 4, gen_eds: '[["FSAR"]]', last_synced_at: null };

test("cached course lookup normalizes IDs and returns the frontend DTO without fetching", async (context) => {
  const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected fetch"); });
  const subject = loadModule<Courses>("server/services/course-service.ts", {
    "@/server/db/client": { query: async (_sql: string, values: unknown[]) => { assert.deepEqual(values, ["CMSC131"]); return result([row]); } },
  });
  assert.deepEqual(await subject.findOrFetchCourse(" cmsc 131 "), { courseId: "CMSC131", name: "Intro", credits: 4, genEds: [["FSAR"]] });
  assert.equal(fetch.mock.calls.length, 0);
});

test("invalid course IDs and wildcard search input cannot query the database", async () => {
  const subject = loadModule<Courses>("server/services/course-service.ts");
  for (const input of ["bad", "ZZZZ131", "CMSC131' OR 1=1", "CMSC131/other"]) {
    await assert.rejects(() => subject.findOrFetchCourse(input), { status: 404 });
  }
  for (const input of ["", "%", "CMSC%", "CMS_", "ZZZZ"]) assert.deepEqual(await subject.autocompleteCourses(input), []);
});

test("umd.io failure returns incomplete cached data, or 404 if no local record exists", async (context) => {
  context.mock.method(globalThis, "fetch", async () => { throw new Error("network unavailable"); });
  let cached = true;
  const subject = loadModule<Courses>("server/services/course-service.ts", {
    "@/server/db/client": { query: async () => result(cached ? [{ ...row, name: null, gen_eds: null }] : []) },
  });
  assert.deepEqual(await subject.findOrFetchCourse("CMSC131"), { courseId: "CMSC131", name: "", credits: 4, genEds: [] });
  cached = false;
  await assert.rejects(() => subject.findOrFetchCourse("CMSC131"), { status: 404 });
});

test("umd.io responses normalize credits and Gen Eds before storing and returning", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json([{ course_id: "CMSC131", name: " Intro ", credits: "4", gen_ed: ["FSAR", ["DSHU", "DVUP"]] }]));
  const subject = loadModule<Courses>("server/services/course-service.ts", {
    "@/server/db/client": { query: async (sql: string, values: unknown[]) => {
      if (sql.startsWith("SELECT")) return result();
      assert.deepEqual(values.slice(0, 5), ["CMSC131", "Intro", "CMSC", 4, '[["FSAR"],["DSHU","DVUP"]]']);
      return result([{ ...row, gen_eds: values[4] }]);
    } },
  });
  assert.deepEqual((await subject.findOrFetchCourse("CMSC131")).genEds, [["FSAR"], ["DSHU", "DVUP"]]);
});

test("batch lookup deduplicates normalized courses and avoids unnecessary remote lookups", async (context) => {
  const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected fetch"); });
  let queries = 0;
  const subject = loadModule<Courses>("server/services/course-service.ts", {
    "@/server/db/client": { query: async (_sql: string, values: unknown[]) => {
      queries += 1; assert.deepEqual(values, [["CMSC131"]]); return result([row]);
    } },
  });
  assert.equal((await subject.findOrFetchCourses(["CMSC131", " cmsc 131 "])).size, 1);
  assert.equal((await subject.findOrFetchCourses([])).size, 0);
  assert.equal(queries, 1);
  assert.equal(fetch.mock.calls.length, 0);
});

test("department pagination reads subsequent pages and filters other departments", async (context) => {
  const pages: string[] = [];
  context.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("dept_id"), "CMSC");
    pages.push(url.searchParams.get("page")!);
    return Response.json(pages.length === 1
      ? Array.from({ length: 100 }, (_, i) => ({ course_id: `CMSC${100 + i}`, credits: "3" }))
      : [{ course_id: "CMSC300", credits: "3" }, { course_id: "MATH140", credits: "4" }]);
  });
  const subject = loadModule<Courses>("server/services/course-service.ts");
  assert.equal((await subject.fetchDepartmentCourses("CMSC")).length, 101);
  assert.deepEqual(pages, ["1", "2"]);
});
