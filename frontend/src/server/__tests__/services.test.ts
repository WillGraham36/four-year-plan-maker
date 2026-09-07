import assert from "node:assert/strict";
import test from "node:test";
import { loadModule, result } from "./helpers";
import type { DatabaseClient } from "../db/client";
import type { UserCourseRecord } from "../dto/domain";

type Users = typeof import("../services/user-service");
type Planner = typeof import("../services/planner-service");
type Courses = typeof import("../services/course-service");
type Transactions = typeof import("../db/transactions");

test("database tracks preserve unset values and support both legacy ordinals and names", () => {
  const { trackFromDatabase, trackToDatabase } = loadModule<Users>("server/services/user-service.ts");
  for (const value of [null, "", "garbage", -1, 5]) assert.equal(trackFromDatabase(value), undefined);
  for (const [index, name] of (["GENERAL", "DATA_SCIENCE", "QUANTUM", "CYBERSECURITY", "ML"] as const).entries()) {
    assert.equal(trackFromDatabase(index), name);
    assert.equal(trackFromDatabase(String(index)), name);
    assert.equal(trackFromDatabase(name), name);
    assert.equal(trackToDatabase(name), index);
  }
  assert.equal(trackToDatabase(undefined), null);
});

for (const failure of ["none", "operation", "COMMIT", "BEGIN", "ROLLBACK"] as const) {
  test(`transaction ${failure}: commit/rollback and always release the connection`, async (context) => {
    context.mock.method(console, "error", () => {});
    const calls: string[] = [];
    const original = new Error("original failure");
    const client = {
      query: async (sql: string) => {
        calls.push(sql);
        if (sql === failure && failure !== "ROLLBACK") throw original;
        if (failure === "ROLLBACK" && sql === "ROLLBACK") throw new Error("rollback failure");
        return result();
      },
      release: (error?: Error) => {
        calls.push("RELEASE");
        if (failure === "ROLLBACK") assert.equal(error?.message, "rollback failure");
        else assert.equal(error, undefined);
      },
    };
    const { withTransaction } = loadModule<Transactions>("server/db/transactions.ts", {
      "./client": { getPool: () => ({ connect: async () => client }) },
    });
    const operation = () => withTransaction(async () => {
      calls.push("OPERATION");
      if (failure === "operation" || failure === "ROLLBACK") throw original;
      return 42;
    });
    if (failure === "none") {
      assert.equal(await operation(), 42);
      assert.deepEqual(calls, ["BEGIN", "OPERATION", "COMMIT", "RELEASE"]);
    } else {
      await assert.rejects(operation, (error) => error === original);
      assert.equal(calls.at(-1), "RELEASE");
      assert.ok(calls.includes("ROLLBACK"));
    }
  });
}

test("planner submissions cannot overwrite existing shared catalog metadata", async () => {
  const canonical = { course_id: "CMSC131", name: "Official title", dept_id: "CMSC", credits: 4, gen_eds: '[["FSAR"]]', last_synced_at: null };
  const { findOrCreateCourse } = loadModule<Courses>("server/services/course-service.ts");
  const client = {
    query: async (sql: string, values: unknown[]) => {
      assert.equal(values[0], "CMSC131");
      if (sql.includes("INSERT")) {
        assert.match(sql, /ON CONFLICT \(course_id\) DO NOTHING/);
        return result();
      }
      return result([canonical]);
    },
  } as DatabaseClient;
  const course = await findOrCreateCourse({ courseId: "cmsc 131", name: "Forged", credits: 30, genEds: [["FSAW"]] }, client);
  assert.equal(course.name, "Official title");
  assert.equal(course.credits, 4);
  assert.deepEqual(course.genEds, [["FSAR"]]);
});

test("invalid lower-level custom concentration is rejected before database mutation", async () => {
  const writes: string[] = [];
  const { setCustomULCourse } = loadModule<Planner>("server/services/planner-service.ts", {
    "@/server/db/client": { query: async (sql: string) => { writes.push(sql); return result([], 1); } },
  });
  await assert.rejects(() => setCustomULCourse("user_owner", { courseId: "MATH140", semester: { term: "FALL", year: 2026 } }, true), { status: 400, code: "NOT_UPPER_LEVEL" });
  assert.deepEqual(writes, []);
});

test("saving an existing placement persists its new slot index and keeps user scope", async () => {
  const writes: Array<{ sql: string; values?: unknown[] }> = [];
  const { saveCoursePlacementsInTransaction } = loadModule<Planner>("server/services/planner-service.ts", {
    "./course-service": { findOrCreateCourse: async () => ({ courseId: "CMSC131" }) },
    "./user-service": { getUser: async () => ({ ul_concentration: "" }) },
  });
  const client = {
    query: async (sql: string, values?: unknown[]) => {
      writes.push({ sql, values });
      if (sql.includes("SELECT id")) return result([{ id: "42" }]);
      return result();
    },
  } as DatabaseClient;
  const saved = await saveCoursePlacementsInTransaction("user_owner", [{
    course: { courseId: "CMSC131", name: "Intro", credits: 4, genEds: [] },
    semester: { term: "FALL", year: 2026 }, index: 7,
  }], client);
  assert.equal(saved.savedCourses[0].id, 42);
  const update = writes.find(({ sql }) => /UPDATE user_courses SET index/.test(sql));
  assert.ok(update, "existing course must move to the requested slot");
  assert.ok(update.values?.includes("user_owner"));
  assert.ok(update.values?.includes(7));
});

test("deleting an off term removes its courses and completion in the same transaction", async () => {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const client = { query: async (sql: string, values?: unknown[]) => { calls.push({ sql, values }); return result([], 1); } };
  const { deleteOffTerm } = loadModule<Users>("server/services/user-service.ts", {
    "@/server/db/transactions": { withTransaction: async (operation: (client: unknown) => Promise<unknown>) => operation(client) },
  });
  await deleteOffTerm("user_owner", { term: "SUMMER", year: 2026 });
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.match(call.sql, /WHERE user_id = \$1 AND term = \$2 AND year = \$3/);
    assert.deepEqual(call.values, ["user_owner", "SUMMER", 2026]);
  }
});

test("notes reject oversize input before a write and preserve parameterized user scope", async () => {
  const calls: unknown[][] = [];
  const { updateNote } = loadModule<Users>("server/services/user-service.ts", {
    "@/server/db/client": { query: async (_sql: string, values: unknown[]) => { calls.push(values); return result([], 1); } },
  });
  await assert.rejects(() => updateNote("user_owner", "x".repeat(50_001)), { status: 400, code: "NOTE_TOO_LONG" });
  assert.deepEqual(calls, []);
  await updateNote("user_owner", "  O'Brien's plan  ");
  assert.deepEqual(calls, [["user_owner", "O'Brien's plan"]]);
});

test("upper-level concentration deduplicates repeats and preserves a custom selection", async () => {
  const { getULConcentration, groupCourses } = loadModule<Planner>("server/services/planner-service.ts", {
    "./user-service": { getUser: async () => ({ ul_concentration: "MATH" }) },
  });
  const make = (id: number, courseId: string, custom = false): UserCourseRecord => ({
    id, userId: "user_owner", courseId, semester: { term: "FALL", year: 2026 + id },
    selectedGenEds: ["FSAR"], transferCreditName: null, customUlConcentration: custom,
    transferGenEdsOverride: [["FSAR"]], index: 0,
    course: { courseId, name: "Title", credits: 3, genEds: [["FSAW"]], deptId: courseId.slice(0, 4), lastSyncedAt: null },
  });
  const courses = [make(1, "MATH310"), make(2, "MATH310", true), make(3, "MATH140"), make(4, "STAT400", true), make(5, "CMSC330")];
  const concentration = await getULConcentration("user_owner", courses);
  assert.deepEqual(concentration.courses.map((course) => course.courseId), ["MATH310", "STAT400"]);
  assert.equal(concentration.courses[0].custom, true);
  const grouped = groupCourses(courses);
  const dto = grouped["Semester(term=FALL, year=2027)"][0];
  assert.deepEqual(dto.genEds, [["FSAR"]]);
  assert.equal(dto.assignedGenEdBranchIndex, 0);
  assert.equal("userId" in dto, false);
});
