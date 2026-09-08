import "server-only";

import type { DatabaseClient } from "@/server/db/client";
import { query } from "@/server/db/client";
import { withTransaction } from "@/server/db/transactions";
import type { CsSpecializations, Semester, Term, UserInfo } from "@/server/dto/domain";
import { ApiError } from "@/server/http/api-response";

const TRACKS: CsSpecializations[] = [
  "GENERAL",
  "DATA_SCIENCE",
  "QUANTUM",
  "CYBERSECURITY",
  "ML",
];

export type UserRow = {
  id: string;
  ul_concentration: string | null;
  start_term: Term | null;
  start_year: number | null;
  end_term: Term | null;
  end_year: number | null;
  major: string | null;
  minor: string | null;
  note: string | null;
  track: number | string | null;
  is_guest: boolean;
};

function trackFromDatabase(value: UserRow["track"]): CsSpecializations | undefined {
  if (value == null || (typeof value === "string" && !value.trim())) return undefined;
  if (typeof value === "number") return TRACKS[value];
  if (typeof value === "string" && TRACKS.includes(value as CsSpecializations)) {
    return value as CsSpecializations;
  }
  const ordinal = Number(value);
  return Number.isInteger(ordinal) ? TRACKS[ordinal] : undefined;
}

function trackToDatabase(track: CsSpecializations | null | undefined) {
  return track == null ? null : TRACKS.indexOf(track);
}

export async function getUser(userId: string, client: DatabaseClient = { query }) {
  const result = await client.query<UserRow>("SELECT * FROM users WHERE id = $1", [userId]);
  if (!result.rows[0]) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  return result.rows[0];
}

async function getSemesters(table: string, userId: string, client: DatabaseClient) {
  const result = await client.query<{ term: Term; year: number }>(
    `SELECT term, year FROM ${table} WHERE user_id = $1 ORDER BY year, term`,
    [userId],
  );
  return result.rows.map(({ term, year }) => ({ term, year }));
}

export async function getUserInfo(
  userId: string,
  client: DatabaseClient = { query },
): Promise<UserInfo> {
  const user = await getUser(userId, client);
  const [offSemesters, completedSemesters] = await Promise.all([
    getSemesters("user_off_semesters", userId, client),
    getSemesters("user_completed_semesters", userId, client),
  ]);

  return {
    startSemester: user.start_term && user.start_year !== null
      ? { term: user.start_term, year: user.start_year }
      : (null as unknown as Semester),
    endSemester: user.end_term && user.end_year !== null
      ? { term: user.end_term, year: user.end_year }
      : (null as unknown as Semester),
    offSemesters,
    completedSemesters,
    note: user.note ?? "",
    track: trackFromDatabase(user.track),
    major: user.major ?? "",
    guest: user.is_guest,
  };
}

export async function updateConcentration(userId: string, concentration: string) {
  const result = await query(
    "UPDATE users SET ul_concentration = $2 WHERE id = $1",
    [userId, concentration],
  );
  if (!result.rowCount) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
}

export async function createOffTerm(userId: string, semester: Semester) {
  if (!(["SUMMER", "WINTER"] as Term[]).includes(semester.term)) {
    throw new ApiError(400, "INVALID_TERM", "Only SUMMER or WINTER terms are allowed");
  }
  await getUser(userId);
  const existing = await query(
    `SELECT 1 FROM user_off_semesters
     WHERE user_id = $1 AND term = $2 AND year = $3`,
    [userId, semester.term, semester.year],
  );
  if (existing.rowCount) {
    throw new ApiError(409, "OFF_TERM_EXISTS", `Off semester already exists for ${semester.term} ${semester.year}`);
  }
  await query(
    "INSERT INTO user_off_semesters (user_id, term, year) VALUES ($1, $2, $3)",
    [userId, semester.term, semester.year],
  );
}

export async function deleteOffTerm(userId: string, semester: Semester) {
  return withTransaction(async (client) => {
    const removed = await client.query(
      `DELETE FROM user_off_semesters
       WHERE user_id = $1 AND term = $2 AND year = $3`,
      [userId, semester.term, semester.year],
    );
    if (!removed.rowCount) {
      throw new ApiError(404, "OFF_TERM_NOT_FOUND", `No off semester exists for ${semester.term} ${semester.year}`);
    }
    await client.query(
      `DELETE FROM user_completed_semesters
       WHERE user_id = $1 AND term = $2 AND year = $3`,
      [userId, semester.term, semester.year],
    );
    await client.query(
      `DELETE FROM user_courses
       WHERE user_id = $1 AND term = $2 AND year = $3`,
      [userId, semester.term, semester.year],
    );
  });
}

export async function updateSemesterCompletion(
  userId: string,
  semester: Semester,
  completed: boolean,
) {
  await withTransaction(async (client) => {
    await getUser(userId, client);
    await client.query(
      `DELETE FROM user_completed_semesters
       WHERE user_id = $1 AND term = $2 AND year = $3`,
      [userId, semester.term, semester.year],
    );
    if (completed) {
      await client.query(
        "INSERT INTO user_completed_semesters (user_id, term, year) VALUES ($1, $2, $3)",
        [userId, semester.term, semester.year],
      );
    }
  });
}

export async function updateNote(userId: string, note: string) {
  const value = note.trim();
  if (value.length > 50_000) {
    throw new ApiError(400, "NOTE_TOO_LONG", "Note cannot be longer than 50000 characters");
  }
  const result = await query("UPDATE users SET note = $2 WHERE id = $1", [userId, value]);
  if (!result.rowCount) throw new ApiError(404, "USER_NOT_FOUND", "User not found");
}

export async function updateTrack(userId: string, track: CsSpecializations) {
  const user = await getUser(userId);
  if (user.major !== "Computer Science") {
    throw new ApiError(400, "INVALID_MAJOR", "User must be a Computer Science major to update their track");
  }
  await query("UPDATE users SET track = $2 WHERE id = $1", [userId, trackToDatabase(track)]);
}

export { trackFromDatabase, trackToDatabase };
