'use server';

import { SemesterSchema, ULConcentrationSchema } from "@/lib/utils/schemas";
import { UserInfo } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";

const getAllULCourses = async () => {
  const res = await fetchWithAuth('v1/ulconcentration');
  const ULCourses = ULConcentrationSchema.safeParse(res.data);
  return ULCourses.data || {
    concentration: "",
    courses: [],
  }
}


interface AcademicInfo {
  semesters: SemesterSchema;
  genEds: {
    courseId: string;
    genEd: string;
    semesterName: string;
    transferCreditName?: string | null | undefined;
  }[];
  ULCourses:  Awaited<ReturnType<typeof getAllULCourses>>;
  userInfo: UserInfo;
}

export const getAllAcademicInfo = async () => {
  const res = await fetchWithAuth("v1/academic/overview");
  if (!res.ok) {
    return {
      ok: false,
      message: "Failed to fetch academic info",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Successfully fetched academic info",
    data: {
      semesters: res.data.allSemesters,
      genEds: res.data.genEds,
      ULCourses: res.data.upperLevelConcentrationCourses,
      userInfo: res.data.userInfo,
    } as AcademicInfo,
  };
}