import assert from "node:assert/strict";
import test from "node:test";
import { onboardingSubmissionSchema } from "../../validation/domain";

const input = {
  startTerm: "fall", startYear: "2024", endTerm: "spring", endYear: "2028",
  major: "Computer Science", csSpecialization: "GENERAL",
  transferCredits: [{ name: "AP Calculus", courseId: " math140 ", genEds: "fsma" }],
  completedCourses: [{ courseId: " cmsc131 ", term: "FALL", year: "2024" }],
};

test("accepts one onboarding payload and normalizes imported courses", () => {
  const parsed = onboardingSubmissionSchema.parse(input);
  assert.equal(parsed.startTerm, "FALL");
  assert.equal(parsed.startYear, 2024);
  assert.equal(parsed.transferCredits[0].courseId, "MATH140");
  assert.equal(parsed.transferCredits[0].genEds, "FSMA");
  assert.deepEqual(parsed.completedCourses[0], { courseId: "CMSC131", term: "FALL", year: 2024 });
});

test("supports skipping transcript import", () => {
  const parsed = onboardingSubmissionSchema.parse({ ...input, transferCredits: undefined, completedCourses: undefined });
  assert.deepEqual(parsed.transferCredits, []);
  assert.deepEqual(parsed.completedCourses, []);
});

test("rejects invalid completed course IDs and transfer semesters", () => {
  assert.equal(onboardingSubmissionSchema.safeParse({ ...input,
    completedCourses: [{ courseId: "invalid", term: "TRANSFER", year: "2024" }],
  }).success, false);
});
