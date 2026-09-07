import type { GenEdRequirementList } from "@/lib/utils/schemas";
import type { DatabaseClient } from "@/server/db/client";
import type { UserCourseRecord } from "@/server/dto/domain";

const TRACKED = new Set([
  "FSAW", "FSPW", "FSMA", "FSOC", "FSAR", "DSNL", "DSNS",
  "DSHS", "DSHU", "DSSP", "SCIS", "DVUP", "DVCC",
]);

const SLOTS = [
  ["FSAW", ["FSAW"]], ["FSPW", ["FSPW"]], ["FSMA", ["FSMA"]],
  ["FSOC", ["FSOC"]], ["FSAR", ["FSAR"]], ["DSNL", ["DSNL"]],
  ["DSNS or DSNL", ["DSNS", "DSNL"]], ["DSHS", ["DSHS"]],
  ["DSHS", ["DSHS"]], ["DSHU", ["DSHU"]], ["DSHU", ["DSHU"]],
  ["DSSP", ["DSSP"]], ["DSSP", ["DSSP"]], ["SCIS", ["SCIS"]],
  ["SCIS", ["SCIS"]], ["DVUP", ["DVUP"]],
  ["DVUP or DVCC", ["DVUP", "DVCC"]],
] as const;

type AssignedSlot = { slotIndex: number; genEd: string };
type Choice = {
  branchIndex: number | null;
  branchTokens: string[];
  mask: number;
  assignedSlots: AssignedSlot[];
};
type State = { score: number; choices: Choice[] };

function semesterKey(course: UserCourseRecord) {
  return `${course.semester.term}:${course.semester.year}`;
}

function cleanBranch(raw: string[], semesterCourseIds: Set<string>) {
  const cleaned: string[] = [];
  for (const token of raw) {
    if (!token || token === "NONE") continue;
    const [genEd, requiredCourse] = token.split("|", 2);
    if (requiredCourse && !semesterCourseIds.has(requiredCourse)) return null;
    if (TRACKED.has(genEd)) cleaned.push(genEd);
  }
  return cleaned;
}

function enumerateAssignments(genEds: string[]) {
  const byMask = new Map<number, AssignedSlot[]>();
  function visit(index: number, mask: number, assigned: AssignedSlot[]) {
    if (index === genEds.length) {
      if (!byMask.has(mask)) byMask.set(mask, [...assigned]);
      return;
    }
    visit(index + 1, mask, assigned);
    SLOTS.forEach(([, accepted], slotIndex) => {
      const bit = 1 << slotIndex;
      if ((mask & bit) || !(accepted as readonly string[]).includes(genEds[index])) return;
      assigned.push({ slotIndex, genEd: genEds[index] });
      visit(index + 1, mask | bit, assigned);
      assigned.pop();
    });
  }
  visit(0, 0, []);
  return byMask;
}

function choicesForCourse(course: UserCourseRecord, semesterIds: Set<string>) {
  const choices: Choice[] = [{ branchIndex: null, branchTokens: [], mask: 0, assignedSlots: [] }];
  const groups = course.transferGenEdsOverride?.length
    ? course.transferGenEdsOverride
    : course.course.genEds;

  groups.forEach((branch, branchIndex) => {
    const cleaned = cleanBranch(branch, semesterIds);
    if (!cleaned) return;
    for (const [mask, assignedSlots] of enumerateAssignments(cleaned)) {
      choices.push({ branchIndex, branchTokens: branch, mask, assignedSlots });
    }
  });
  return choices;
}

function preferred(candidate: Choice, existing: Choice | undefined) {
  if (!existing) return true;
  if (candidate.branchIndex !== null && existing.branchIndex === null) return true;
  if (candidate.branchIndex === null && existing.branchIndex !== null) return false;
  if (candidate.branchIndex !== null && existing.branchIndex !== null
      && candidate.branchIndex !== existing.branchIndex) {
    return candidate.branchIndex < existing.branchIndex;
  }
  return candidate.branchTokens.join(",") < existing.branchTokens.join(",");
}

export async function calculateGenEds(
  courses: UserCourseRecord[],
  client?: DatabaseClient,
): Promise<GenEdRequirementList> {
  const idsBySemester = new Map<string, Set<string>>();
  courses.forEach((course) => {
    const key = semesterKey(course);
    const ids = idsBySemester.get(key) || new Set<string>();
    ids.add(course.courseId);
    idsBySemester.set(key, ids);
  });

  let states = new Map<number, State>([[0, { score: 0, choices: [] }]]);
  for (const course of courses) {
    const choices = choicesForCourse(course, idsBySemester.get(semesterKey(course)) || new Set());
    const next = new Map<number, State>();
    for (const [currentMask, state] of states) {
      for (const choice of choices) {
        if (currentMask & choice.mask) continue;
        const mask = currentMask | choice.mask;
        const score = state.score + choice.assignedSlots.length;
        const existing = next.get(mask);
        const existingChoice = existing?.choices[existing.choices.length - 1];
        if (!existing || score > existing.score || (score === existing.score && preferred(choice, existingChoice))) {
          next.set(mask, { score, choices: [...state.choices, choice] });
        }
      }
    }
    states = next;
  }

  let bestMask = 0;
  let best: State = { score: -1, choices: [] };
  for (const mask of [...states.keys()].sort((a, b) => a - b)) {
    const state = states.get(mask)!;
    if (state.score > best.score) {
      bestMask = mask;
      best = state;
    }
  }
  void bestMask;

  const requirements: GenEdRequirementList = SLOTS.map(([requirementName]) => ({
    requirementName,
    satisfiedByGenEd: "",
    courseId: "",
    semesterName: "",
    transferCreditName: "",
  }));

  best.choices.forEach((choice, courseIndex) => {
    const course = courses[courseIndex];
    choice.assignedSlots.forEach(({ slotIndex, genEd }) => {
      requirements[slotIndex] = {
        requirementName: SLOTS[slotIndex][0],
        satisfiedByGenEd: genEd,
        courseId: course.courseId,
        semesterName: `${course.semester.term} ${course.semester.year}`,
        transferCreditName: course.transferCreditName || "",
      };
    });
  });

  if (client) {
    for (const [index, course] of courses.entries()) {
      const assigned = best.choices[index]?.branchIndex === null
        ? null
        : best.choices[index]?.branchTokens || null;
      await client.query(
        "UPDATE user_courses SET selected_gen_eds = $2 WHERE id = $1",
        [course.id, assigned],
      );
    }
  }

  return requirements;
}
