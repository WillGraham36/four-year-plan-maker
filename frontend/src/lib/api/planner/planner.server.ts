'use server';

import { SemesterSchema } from "@/lib/utils/schemas";
import { UserInfo } from "@/lib/utils/types";
import { requireUserId } from "@/server/auth/current-session";
import { getAcademicOverview } from "@/server/services/academic-overview-service";
import type { ULConcentration } from "@/server/dto/domain";


interface AcademicInfo {
  semesters: SemesterSchema;
  genEdRequirements: {
    requirementName: string;
    satisfiedByGenEd: string;
    courseId: string;
    semesterName: string;
    transferCreditName?: string | null | undefined;
  }[];
  ULCourses: ULConcentration;
  userInfo: UserInfo;
}

export const getAllAcademicInfo = async () => {
  try {
    const data = await getAcademicOverview(await requireUserId());
    return {
      ok: true,
      message: "Successfully fetched academic info",
      data: {
        semesters: data.allSemesters,
        genEdRequirements: data.genEdRequirements,
        ULCourses: data.upperLevelConcentrationCourses,
        userInfo: data.userInfo,
      } as AcademicInfo,
    };
  } catch (error) {
    console.error("Failed to fetch academic info", error);
    return {
      ok: false,
      message: "Failed to fetch academic info",
      data: null,
    };
  }
}
