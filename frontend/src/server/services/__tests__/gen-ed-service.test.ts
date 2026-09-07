import assert from "node:assert/strict";
import test from "node:test";
import type { DatabaseClient } from "@/server/db/client";
import type { UserCourseRecord } from "@/server/dto/domain";
import { calculateGenEds } from "../gen-ed-service";

function course(
  id: number,
  courseId: string,
  genEds: string[][],
  term: UserCourseRecord["semester"]["term"] = "FALL",
): UserCourseRecord {
  return {
    id,
    userId: "user_1",
    courseId,
    semester: { term, year: 2026 },
    selectedGenEds: null,
    transferCreditName: null,
    customUlConcentration: false,
    transferGenEdsOverride: null,
    index: id,
    course: {
      courseId,
      name: courseId,
      deptId: courseId.slice(0, 4),
      credits: 3,
      genEds,
      lastSyncedAt: null,
    },
  };
}

test("assigns a basic Gen Ed course to its requirement", async () => {
  const requirements = await calculateGenEds([course(1, "ENGL101", [["FSAW"]])]);
  assert.equal(requirements[0].courseId, "ENGL101");
  assert.equal(requirements[0].satisfiedByGenEd, "FSAW");
});

test("chooses the branch that satisfies the most requirements", async () => {
  const updates: unknown[][] = [];
  const client = {
    query: async <T>(_sql: string, values?: unknown[]) => {
      updates.push(values || []);
      return { rows: [], rowCount: 1 } as never as Awaited<ReturnType<DatabaseClient["query"]>>;
    },
  } as DatabaseClient;

  const requirements = await calculateGenEds([
    course(1, "TEST300", [["FSAW"], ["DSHU", "DVUP"]]),
  ], client);

  assert.equal(requirements.filter((item) => item.courseId === "TEST300").length, 2);
  assert.deepEqual(updates[0], [1, ["DSHU", "DVUP"]]);
});

test("honors same-semester course prerequisites in Gen Ed tokens", async () => {
  const withoutPrerequisite = await calculateGenEds([
    course(1, "TEST300", [["DVUP|CMSC131"]]),
  ]);
  assert.equal(withoutPrerequisite.find((item) => item.requirementName === "DVUP")?.courseId, "");

  const withPrerequisite = await calculateGenEds([
    course(1, "CMSC131", []),
    course(2, "TEST300", [["DVUP|CMSC131"]]),
  ]);
  assert.equal(withPrerequisite.find((item) => item.requirementName === "DVUP")?.courseId, "TEST300");
});

test("uses separate courses for duplicate requirement slots", async () => {
  const requirements = await calculateGenEds([
    course(1, "HIST200", [["DSHS"]]),
    course(2, "HIST201", [["DSHS"]]),
  ]);
  const humanities = requirements.filter((item) => item.requirementName === "DSHS");
  assert.deepEqual(humanities.map((item) => item.courseId).sort(), ["HIST200", "HIST201"]);
});

test("does not overlap Gen Ed writes on a transaction connection", async () => {
  let active = false;
  let writes = 0;
  const client = {
    query: async () => {
      assert.equal(active, false, "transaction queries must run sequentially");
      active = true;
      await new Promise((resolve) => setTimeout(resolve, 1));
      writes += 1;
      active = false;
      return { rows: [], rowCount: 1, command: "UPDATE", oid: 0, fields: [] };
    },
  } as DatabaseClient;
  await calculateGenEds([
    course(1, "ENGL101", [["FSAW"]]),
    course(2, "MATH140", [["FSMA"]]),
  ], client);
  assert.equal(writes, 2);
});

test("transfer overrides replace catalog branches and retain the transfer label", async () => {
  const transfer = course(1, "MATH140", [["FSAR"]], "TRANSFER");
  transfer.transferGenEdsOverride = [["FSMA"]];
  transfer.transferCreditName = "AP Calculus";
  const requirements = await calculateGenEds([transfer]);
  assert.equal(requirements.find((item) => item.requirementName === "FSAR")?.courseId, "");
  assert.equal(requirements.find((item) => item.requirementName === "FSMA")?.transferCreditName, "AP Calculus");
});

test("prerequisites in another semester do not enable a conditional Gen Ed", async () => {
  const requirements = await calculateGenEds([
    course(1, "CMSC131", [], "SPRING"), course(2, "TEST300", [["DVUP|CMSC131"]]),
  ]);
  assert.equal(requirements.find((item) => item.requirementName === "DVUP")?.courseId, "");
});

test("removing a prerequisite clears a stale stored assignment", async () => {
  const dependent = course(1, "TEST300", [["DVUP|CMSC131"]]);
  dependent.selectedGenEds = ["DVUP|CMSC131"];
  const writes: unknown[][] = [];
  const client: DatabaseClient = { query: async (_sql, values) => { writes.push(values ?? []); return { rows: [], rowCount: 1, command: "UPDATE", oid: 0, fields: [] }; } };
  await calculateGenEds([dependent], client);
  assert.deepEqual(writes, [[1, null]]);
});

test("200-course batch stress: deterministic assignments and sequential persistence", async (context) => {
  const courses = Array.from({ length: 200 }, (_, index) => course(index + 1, `TEST${100 + index}`, [
    ["DSHU", "DVUP"], ["FSAW"], ["FSMA"],
  ]));
  let writes = 0;
  const client: DatabaseClient = { query: async () => { writes += 1; return { rows: [], rowCount: 1, command: "UPDATE", oid: 0, fields: [] }; } };
  const started = performance.now();
  const first = await calculateGenEds(courses, client);
  assert.equal(writes, 200);
  assert.equal(first.filter((item) => item.courseId).length, 6);
  assert.deepEqual(await calculateGenEds(courses), first);
  context.diagnostic(`Two 200-course calculations: ${Math.round(performance.now() - started)} ms`);
});
