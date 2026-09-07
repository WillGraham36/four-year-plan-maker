import "server-only";

import type { Course } from "@/lib/utils/types";
import type { DatabaseClient } from "@/server/db/client";
import { query } from "@/server/db/client";
import { withTransaction } from "@/server/db/transactions";
import type {
  CourseIdentifier,
  CoursePlacement,
  ULConcentration,
  UserCourseRecord,
} from "@/server/dto/domain";
import { ApiError } from "@/server/http/api-response";
import { findOrCreateCourse } from "./course-service";
import { calculateGenEds } from "./gen-ed-service";
import { getUser } from "./user-service";

type UserCourseRow = {
  id: string;
  user_id: string;
  course_id: string;
  term: UserCourseRecord["semester"]["term"];
  year: number;
  selected_gen_eds: string[] | null;
  transfer_credit_name: string | null;
  custom_ul_concentration: boolean | null;
  transfer_gen_eds_override: string | string[][] | null;
  index: number | null;
  course_name: string | null;
  dept_id: string | null;
  credits: number | null;
  gen_eds: string | string[][] | null;
  last_synced_at: Date | null;
};

function groups(value: string | string[][] | null): string[][] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { return JSON.parse(value) as string[][]; } catch { return []; }
}

function fromRow(row: UserCourseRow): UserCourseRecord {
  return {
    id: Number(row.id),
    userId: row.user_id,
    courseId: row.course_id,
    semester: { term: row.term, year: row.year },
    selectedGenEds: row.selected_gen_eds,
    transferCreditName: row.transfer_credit_name,
    customUlConcentration: Boolean(row.custom_ul_concentration),
    transferGenEdsOverride: row.transfer_gen_eds_override
      ? groups(row.transfer_gen_eds_override)
      : null,
    index: row.index,
    course: {
      courseId: row.course_id,
      name: row.course_name,
      deptId: row.dept_id,
      credits: row.credits,
      genEds: groups(row.gen_eds),
      lastSyncedAt: row.last_synced_at,
    },
  };
}

export async function getUserCourses(
  userId: string,
  client: DatabaseClient = { query },
) {
  const result = await client.query<UserCourseRow>(
    `SELECT uc.*, c.name AS course_name, c.dept_id, c.credits, c.gen_eds, c.last_synced_at
     FROM user_courses uc
     LEFT JOIN courses c ON c.course_id = uc.course_id
     WHERE uc.user_id = $1
     ORDER BY uc.year ASC,
       CASE uc.term WHEN 'TRANSFER' THEN 0 WHEN 'SPRING' THEN 1
         WHEN 'SUMMER' THEN 2 WHEN 'FALL' THEN 3 WHEN 'WINTER' THEN 4 ELSE 5 END,
       uc.index ASC NULLS LAST, uc.id ASC`,
    [userId],
  );
  return result.rows.map(fromRow);
}

function toCourseDto(record: UserCourseRecord): Course {
  const genEds = record.transferGenEdsOverride?.length
    ? record.transferGenEdsOverride
    : record.course.genEds;
  const branchIndex = record.selectedGenEds
    ? genEds.findIndex((branch) => JSON.stringify(branch) === JSON.stringify(record.selectedGenEds))
    : -1;
  return {
    id: record.id,
    courseId: record.courseId,
    name: record.course.name || "",
    credits: record.course.credits || 0,
    genEds,
    assignedGenEds: record.selectedGenEds,
    assignedGenEdBranchIndex: branchIndex >= 0 ? branchIndex : null,
    index: record.index ?? undefined,
  };
}

export function groupCourses(courses: UserCourseRecord[]) {
  const grouped: Record<string, Course[]> = {};
  courses.forEach((course) => {
    const key = `Semester(term=${course.semester.term}, year=${course.semester.year})`;
    (grouped[key] ||= []).push(toCourseDto(course));
  });
  return grouped;
}

function isUpperLevel(courseId: string) {
  const firstDigit = courseId.match(/\d/)?.[0];
  return firstDigit !== undefined && Number(firstDigit) >= 3;
}

export async function getULConcentration(
  userId: string,
  courses?: UserCourseRecord[],
  client: DatabaseClient = { query },
): Promise<ULConcentration> {
  const user = await getUser(userId, client);
  const concentration = user.ul_concentration || "";
  const ordered = courses || await getUserCourses(userId, client);
  const matches = ordered.filter((course) =>
    isUpperLevel(course.courseId)
    && (course.customUlConcentration
      || (concentration.length > 0 && concentration.length <= 4 && course.courseId.startsWith(concentration))),
  );
  const unique = new Map<string, UserCourseRecord>();
  matches.forEach((course) => {
    const existing = unique.get(course.courseId);
    if (!existing || (!existing.customUlConcentration && course.customUlConcentration)) {
      unique.set(course.courseId, course);
    }
  });
  return {
    concentration,
    courses: [...unique.values()].map((course) => ({
      courseId: course.courseId,
      semester: course.semester,
      credits: course.course.credits || 0,
      custom: course.customUlConcentration,
    })),
  };
}

export async function saveCoursePlacements(userId: string, placements: CoursePlacement[]) {
  return withTransaction((client) => saveCoursePlacementsInTransaction(userId, placements, client));
}

export async function saveCoursePlacementsInTransaction(
  userId: string, placements: CoursePlacement[], client: DatabaseClient,
) {
  const savedCourses: Array<{ id: number; courseId: string; semester: CoursePlacement["semester"] }> = [];
  for (const placement of placements) {
    const course = await findOrCreateCourse(placement.course, client);
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM user_courses
       WHERE user_id = $1 AND course_id = $2 AND term = $3 AND year = $4
       LIMIT 1`,
      [userId, course.courseId, placement.semester.term, placement.semester.year],
    );
    let id = existing.rows[0]?.id;
    if (!id) {
      const inserted = await client.query<{ id: string }>(
         `INSERT INTO user_courses (user_id, course_id, term, year, index, custom_ul_concentration)
         VALUES ($1, $2, $3, $4, $5, FALSE)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [userId, course.courseId, placement.semester.term, placement.semester.year, placement.index],
      );
      id = inserted.rows[0]?.id;
      if (!id) {
        const concurrent = await client.query<{ id: string }>(
          `SELECT id FROM user_courses
           WHERE user_id = $1 AND course_id = $2 AND term = $3 AND year = $4
           LIMIT 1`,
          [userId, course.courseId, placement.semester.term, placement.semester.year],
        );
        id = concurrent.rows[0]?.id;
      }
    }
    if (!id) {
      throw new ApiError(409, "COURSE_PLACEMENT_NOT_SAVED", "Could not save the course placement");
    }
    savedCourses.push({ id: Number(id), courseId: course.courseId, semester: placement.semester });
  }
  const courses = await getUserCourses(userId, client);
  const updatedGenEdRequirements = await calculateGenEds(courses, client);
  const updatedULConcentration = await getULConcentration(userId, courses, client);
  return { savedCourses, updatedGenEdRequirements, updatedULConcentration };
}

export async function deleteCoursePlacements(userId: string, identifiers: CourseIdentifier[]) {
  return withTransaction(async (client) => {
    let deletedCount = 0;
    for (const identifier of identifiers) {
      const result = await client.query(
        `DELETE FROM user_courses
         WHERE user_id = $1 AND course_id = $2 AND term = $3 AND year = $4`,
        [userId, identifier.courseId, identifier.semester.term, identifier.semester.year],
      );
      deletedCount += result.rowCount || 0;
    }
    const courses = await getUserCourses(userId, client);
    const updatedGenEdRequirements = await calculateGenEds(courses, client);
    const updatedULConcentration = await getULConcentration(userId, courses, client);
    return { deletedCount, updatedGenEdRequirements, updatedULConcentration };
  });
}

export async function setCustomULCourse(
  userId: string,
  identifier: CourseIdentifier,
  custom: boolean,
) {
  const result = await query(
    `UPDATE user_courses SET custom_ul_concentration = $5
     WHERE user_id = $1 AND course_id = $2 AND term = $3 AND year = $4`,
    [userId, identifier.courseId, identifier.semester.term, identifier.semester.year, custom],
  );
  if (custom && !result.rowCount) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Planner course was not found");
  }
  if (custom && !isUpperLevel(identifier.courseId)) {
    await query(
      `UPDATE user_courses SET custom_ul_concentration = FALSE
       WHERE user_id = $1 AND course_id = $2 AND term = $3 AND year = $4`,
      [userId, identifier.courseId, identifier.semester.term, identifier.semester.year],
    );
    throw new ApiError(400, "NOT_UPPER_LEVEL", "Only planner courses at the 300 level or above can be added");
  }
  return getULConcentration(userId);
}
