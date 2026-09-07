import "server-only";

import { DEPARTMENT_CODE_SET, normalizeCourseQuery } from "@/lib/courses/departments";
import type { Course } from "@/lib/utils/types";
import type { DatabaseClient } from "@/server/db/client";
import { query } from "@/server/db/client";
import type { CourseRecord } from "@/server/dto/domain";
import { ApiError } from "@/server/http/api-response";

type CourseRow = {
  course_id: string;
  name: string | null;
  dept_id: string | null;
  credits: number | null;
  gen_eds: string | string[][] | null;
  last_synced_at: Date | null;
};

type UmdCourse = {
  course_id?: string;
  name?: string;
  dept_id?: string;
  credits?: string | number;
  gen_ed?: Array<string | string[]>;
};

function parseJsonGroups(value: string | string[][] | null): string[][] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fromRow(row: CourseRow): CourseRecord {
  return {
    courseId: row.course_id,
    name: row.name,
    deptId: row.dept_id,
    credits: row.credits,
    genEds: parseJsonGroups(row.gen_eds),
    lastSyncedAt: row.last_synced_at,
  };
}

function toCourseDto(course: CourseRecord): Course {
  return {
    courseId: course.courseId,
    name: course.name ?? "",
    credits: course.credits ?? 0,
    genEds: course.genEds,
  };
}

function normalizeGenEds(value: UmdCourse["gen_ed"]): string[][] {
  if (!Array.isArray(value)) return [];
  return value.map((group) =>
    Array.isArray(group) ? group.map(String) : [String(group)],
  );
}

function parseUmdCourse(value: UmdCourse): CourseRecord | null {
  const courseId = normalizeCourseQuery(value.course_id || "");
  if (courseId.length < 5) return null;
  const credits = Number(value.credits);

  return {
    courseId,
    name: value.name?.trim() || null,
    deptId: value.dept_id?.trim() || courseId.slice(0, 4),
    credits: Number.isFinite(credits) ? credits : null,
    genEds: normalizeGenEds(value.gen_ed),
    lastSyncedAt: new Date(),
  };
}

async function fetchUmdCourse(courseId: string) {
  try {
    const response = await fetch(`https://api.umd.io/v1/courses/${encodeURIComponent(courseId)}`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as UmdCourse | UmdCourse[];
    return parseUmdCourse(Array.isArray(body) ? body[0] || {} : body);
  } catch {
    return null;
  }
}

async function upsertCourseRecord(client: DatabaseClient, course: CourseRecord) {
  const result = await client.query<CourseRow>(
    `INSERT INTO courses (course_id, name, dept_id, credits, gen_eds, last_synced_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (course_id) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name, ''), courses.name),
       dept_id = COALESCE(NULLIF(EXCLUDED.dept_id, ''), courses.dept_id),
       credits = COALESCE(EXCLUDED.credits, courses.credits),
       gen_eds = COALESCE(EXCLUDED.gen_eds, courses.gen_eds),
       last_synced_at = COALESCE(EXCLUDED.last_synced_at, courses.last_synced_at)
     RETURNING *`,
    [
      course.courseId,
      course.name,
      course.deptId,
      course.credits,
      JSON.stringify(course.genEds),
      course.lastSyncedAt,
    ],
  );
  return fromRow(result.rows[0]);
}

export async function findOrCreateCourse(
  input: Course,
  client: DatabaseClient,
) {
  const courseId = normalizeCourseQuery(input.courseId);
  // Planner payloads must never replace metadata shared by every user.
  // Only catalog synchronization and umd.io lookups may update existing rows.
  const inserted = await client.query<CourseRow>(
    `INSERT INTO courses (course_id, name, dept_id, credits, gen_eds, last_synced_at)
     VALUES ($1, $2, $3, $4, $5, NULL)
     ON CONFLICT (course_id) DO NOTHING RETURNING *`,
    [courseId, input.name || null, courseId.slice(0, 4), input.credits, JSON.stringify(input.genEds || [])],
  );
  const row = inserted.rows[0] ?? (await client.query<CourseRow>(
    "SELECT * FROM courses WHERE course_id = $1", [courseId],
  )).rows[0];
  if (!row) throw new ApiError(409, "COURSE_NOT_SAVED", "Could not save course");
  return fromRow(row);
}

export async function findOrFetchCourse(rawCourseId: string) {
  const courseId = normalizeCourseQuery(rawCourseId);
  const valid = /^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/.test(courseId);
  if (!valid || !DEPARTMENT_CODE_SET.has(courseId.slice(0, 4))) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  const local = await query<CourseRow>(
    "SELECT * FROM courses WHERE UPPER(course_id) = $1 LIMIT 1",
    [courseId],
  );
  if (local.rows[0]) {
    const course = fromRow(local.rows[0]);
    if (course.name && course.credits !== null && local.rows[0].gen_eds !== null) {
      return toCourseDto(course);
    }
  }

  const remote = await fetchUmdCourse(courseId);
  if (!remote) {
    if (local.rows[0]) return toCourseDto(fromRow(local.rows[0]));
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  return toCourseDto(await upsertCourseRecord({ query }, remote));
}

export async function findOrFetchCourses(rawCourseIds: string[]) {
  const ids = [...new Set(rawCourseIds.map(normalizeCourseQuery))];
  const courses = new Map<string, Course>();
  if (!ids.length) return courses;
  const local = await query<CourseRow>(
    "SELECT * FROM courses WHERE UPPER(course_id) = ANY($1::text[])",
    [ids],
  );
  for (const row of local.rows) {
    if (row.name && row.credits !== null && row.gen_eds !== null) {
      courses.set(row.course_id.toUpperCase(), toCourseDto(fromRow(row)));
    }
  }
  for (const id of ids) {
    if (courses.has(id)) continue;
    try {
      courses.set(id, await findOrFetchCourse(id));
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }
  return courses;
}

export async function autocompleteCourses(rawQuery: string) {
  const normalized = normalizeCourseQuery(rawQuery);
  if (!/^[A-Z]{4}[0-9A-Z]*$/.test(normalized) || normalized.length < 4) return [];
  if (!DEPARTMENT_CODE_SET.has(normalized.slice(0, 4))) return [];

  let result = await query<CourseRow>(
    `SELECT * FROM courses
     WHERE course_id LIKE $1
     ORDER BY course_id ASC LIMIT 10`,
    [`${normalized}%`],
  );

  if (/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/.test(normalized)
      && !result.rows.some((row) => row.course_id.toUpperCase() === normalized)) {
    const remote = await fetchUmdCourse(normalized);
    if (remote) {
      await upsertCourseRecord({ query }, remote);
      result = await query<CourseRow>(
        `SELECT * FROM courses WHERE course_id LIKE $1 ORDER BY course_id ASC LIMIT 10`,
        [`${normalized}%`],
      );
    }
  }

  return result.rows.map((row) => ({
    courseId: row.course_id,
    name: row.name,
    credits: row.credits,
  }));
}

export async function fetchDepartmentCourses(department: string) {
  const courses: CourseRecord[] = [];
  for (let page = 1; ; page += 1) {
    const url = new URL("https://api.umd.io/v1/courses");
    url.searchParams.set("dept_id", department);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "100");
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`umd.io returned ${response.status}`);
    const body = (await response.json()) as UmdCourse[];
    const parsed = body.map(parseUmdCourse).filter((value): value is CourseRecord => Boolean(value));
    courses.push(...parsed.filter((course) => course.courseId.startsWith(department)));
    if (body.length < 100) break;
  }
  return courses;
}

export async function syncDepartments(departments: string[]) {
  const syncedDepartments: string[] = [];
  const errors: string[] = [];
  let coursesInsertedOrUpdated = 0;

  for (const rawDepartment of departments) {
    const department = normalizeCourseQuery(rawDepartment);
    if (!DEPARTMENT_CODE_SET.has(department)) {
      errors.push(`${rawDepartment}: invalid department`);
      continue;
    }
    try {
      const courses = await fetchDepartmentCourses(department);
      for (const course of courses) await upsertCourseRecord({ query }, course);
      coursesInsertedOrUpdated += courses.length;
      syncedDepartments.push(department);
    } catch (error) {
      errors.push(`${department}: ${error instanceof Error ? error.message : "sync failed"}`);
    }
  }

  return { syncedDepartments, coursesInsertedOrUpdated, errors };
}

export async function getCourseCatalog() {
  const result = await query<CourseRow>("SELECT * FROM courses ORDER BY course_id ASC");
  return result.rows.map((row) => {
    const course = fromRow(row);
    return {
      courseId: course.courseId,
      deptId: course.deptId,
      credits: course.credits,
      genEds: course.genEds,
      name: course.name,
    };
  });
}
