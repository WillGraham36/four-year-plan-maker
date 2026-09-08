import "server-only";

import type { z } from "zod";
import { withTransaction } from "@/server/db/transactions";
import { onboardingSchema } from "@/server/validation/domain";
import { ApiError } from "@/server/http/api-response";
import { findOrCreateCourse } from "./course-service";
import { getUser, trackFromDatabase, trackToDatabase } from "./user-service";
import type { CoursePlacement } from "@/server/dto/domain";
import { getUserCourses, saveCoursePlacementsInTransaction } from "./planner-service";

type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function saveOnboarding(userId: string, input: OnboardingInput, completedCourses: CoursePlacement[] = []) {
  if (input.major === "Computer Science" && !input.track) {
    throw new ApiError(400, "TRACK_REQUIRED", "CS students must select a track");
  }
  await withTransaction(async (client) => {
    // Create the parent row before inserting courses that reference it.
    await client.query(
      `INSERT INTO users
         (id, start_term, start_year, end_term, end_year, major, minor, track,
          ul_concentration, note, is_guest)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', '', FALSE)
       ON CONFLICT (id) DO UPDATE SET
         start_term = EXCLUDED.start_term,
         start_year = EXCLUDED.start_year,
         end_term = EXCLUDED.end_term,
         end_year = EXCLUDED.end_year,
         major = EXCLUDED.major,
         minor = EXCLUDED.minor,
         track = EXCLUDED.track`,
      [
        userId, input.startTerm, input.startYear, input.endTerm, input.endYear,
        input.major, input.minor, trackToDatabase(input.track),
      ],
    );
    await client.query(
      `DELETE FROM user_courses
       WHERE user_id = $1 AND (term = 'TRANSFER' OR transfer_credit_name IS NOT NULL)`,
      [userId],
    );
    for (const transfer of input.transferCredits) {
      const course = await findOrCreateCourse(transfer.course, client);
      await client.query(
        `INSERT INTO user_courses
           (user_id, course_id, term, year, transfer_credit_name,
            transfer_gen_eds_override, custom_ul_concentration)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
        [
          userId,
          course.courseId,
          transfer.semester.term,
          transfer.semester.year,
          transfer.name,
          JSON.stringify(transfer.genEdOverrides),
        ],
      );
    }
    await saveCoursePlacementsInTransaction(userId, completedCourses, client);
  });
}

export async function getOnboarding(userId: string) {
  let user;
  try { user = await getUser(userId); } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
  if (!user.start_term || user.start_year === null || !user.end_term
      || user.end_year === null || !user.major?.trim()) return null;

  const transferCredits = (await getUserCourses(userId))
    .filter((course) => course.semester.term === "TRANSFER" || course.transferCreditName !== null)
    .map((course) => ({
      name: course.transferCreditName || "",
      course: {
        courseId: course.courseId,
        name: course.course.name || "",
        deptId: course.course.deptId,
        credits: course.course.credits || 0,
        genEds: course.course.genEds,
        lastSyncedAt: course.course.lastSyncedAt,
      },
      semester: course.semester,
      genEdOverrides: course.transferGenEdsOverride || [],
    }));
  return {
    startTerm: user.start_term,
    startYear: user.start_year,
    endTerm: user.end_term,
    endYear: user.end_year,
    major: user.major,
    minor: user.minor || "",
    track: trackFromDatabase(user.track) || null,
    transferCredits,
  };
}
