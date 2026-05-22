import assert from "node:assert/strict";
import test from "node:test";
import { normalizeParsedTranscript } from "../schema";
import {
  looksLikeTranscript,
  parseComputerScienceSpecializationFromText,
  parseTransferCreditsFromText,
  prepareTranscriptText,
  toExtractedTextValues,
} from "../service";

const baseParsedTranscript = {
  startSemester: { term: "Fall", year: 2023 },
  graduationSemester: null,
  major: "Computer Science-Machine Learning",
  specialization: "Machine Learning",
  minor: null,
  transferCredits: [],
  completedCourses: [],
};

test("rejects empty or non-transcript text before the AI call", () => {
  assert.equal(looksLikeTranscript(""), false);
  assert.equal(looksLikeTranscript("invoice total due course fee"), false);
});

test("extracts Computer Science specialization from the major header", () => {
  assert.equal(
    parseComputerScienceSpecializationFromText(
      "Major: Computer Science-Machine Learning T Freshman - First Time Undergraduate Degree Seeking",
    ),
    "Machine Learning",
  );
});

test("keeps OCR-damaged transcript text usable", () => {
  const cleaned = prepareTranscriptText(`
    Header noise
    UNOFFICIAL TRANSCRIPT
    Historic Course Information is listed in the order: Course, Title, Grade
    Fall 2025 CMSC430 INTRO TO COMPILERS A 3.00 3.00 12.00
    5 / 2 0 / 2 6 , 6 : 3 4 P M Testudo - Unofficial Transcript https://app.testudo.umd.edu/#/main/uotrans?null 2 / 3
  `);

  assert.equal(looksLikeTranscript(cleaned), true);
  assert.match(cleaned, /CMSC430/);
});

test("validates transfer credits and completed courses separately", () => {
  const parsed = normalizeParsedTranscript({
    ...baseParsedTranscript,
    transferCredits: [
      {
        courseCode: "MATH 140",
        courseName: "Calculus I",
        credits: 4,
        sourceInstitution: "Advanced Placement Exam",
        genEds: "FSAR, FSMA",
      },
    ],
    completedCourses: [
      {
        courseCode: "CMSC131",
        semester: { term: "Fall", year: 2023 },
      },
    ],
  });

  const values = toExtractedTextValues(parsed);
  assert.equal(values.transferCredits[0].courseId, "MATH140");
  assert.equal(values.completedCourses[0].courseId, "CMSC131");
  assert.equal(values.endTerm, "SPRING");
  assert.equal(values.endYear, 2027);
});

test("dedupes repeated semester rows", () => {
  const parsed = normalizeParsedTranscript({
    ...baseParsedTranscript,
    completedCourses: [
      {
        courseCode: "CMSC216",
        semester: { term: "Spring", year: 2024 },
      },
      {
        courseCode: "CMSC216",
        semester: { term: "Spring", year: 2024 },
      },
    ],
  });

  assert.equal(parsed.completedCourses.length, 1);
});

test("accepts in-progress courses without grade or status fields", () => {
  const parsed = normalizeParsedTranscript({
    ...baseParsedTranscript,
    completedCourses: [
      {
        courseCode: "CMSC433",
        semester: { term: "Fall", year: 2026 },
      },
    ],
  });

  assert.equal(parsed.graduationSemester, null);
  assert.equal(parsed.completedCourses[0].courseCode, "CMSC433");
});

test("extracts AP and external transfer credits while skipping No Credit rows", () => {
  const transferCredits = parseTransferCreditsFromText(`
    Course Transcripts received from the following institutions:
    Advanced Placement Exam on 07/04/23 La Roche University on 06/16/23
    ** Transfer Credit Information ** ** Equivalences **
    Advanced Placement Exam
    2001 COMP SCI PRIN/SCR 5 NC 0.00 No Credit
    HUMAN GEOG/SCR 5 P 3.00 GEOG202 DSHS, DVCC
    2201 COMP SCI A/SCR 5 P 4.00 CMSC131
    2301 CALCULUS AB/SCR 5 P 4.00 MATH140 FSAR, FSMA
    PSYCHOLOGY/SCR 5 P 3.00 PSYC100 DSHS or DSNS
    Acceptable UG Inst. Credits: 14.00
    La Roche University
    2301 GENERAL PHYSICS I A 3.00 PHYS161 DSNS
    GENERAL PHYSICS I LAB P 0.00 No Credit
    Historic Course Information
  `);

  assert.deepEqual(
    transferCredits.map((credit) => [credit.courseName, credit.courseCode, credit.genEds]),
    [
      ["AP Human Geog", "GEOG202", "DSHS, DVCC"],
      ["AP Comp Sci A", "CMSC131", ""],
      ["AP Calculus AB", "MATH140", "FSAR, FSMA"],
      ["AP Psychology", "PSYC100", "DSHS or DSNS"],
      ["General Physics I", "PHYS161", "DSNS"],
    ],
  );
});
