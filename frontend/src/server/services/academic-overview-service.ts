import "server-only";

import type { AcademicOverview } from "@/server/dto/domain";
import { calculateGenEds } from "./gen-ed-service";
import { getULConcentration, getUserCourses, groupCourses } from "./planner-service";
import { getUserInfo } from "./user-service";

export async function getAcademicOverview(userId: string): Promise<AcademicOverview> {
  const courses = await getUserCourses(userId);
  const [genEdRequirements, upperLevelConcentrationCourses, userInfo] = await Promise.all([
    calculateGenEds(courses),
    getULConcentration(userId, courses),
    getUserInfo(userId),
  ]);
  return {
    allSemesters: groupCourses(courses),
    genEdRequirements,
    upperLevelConcentrationCourses,
    userInfo,
  };
}

