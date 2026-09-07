import type {
  Course,
  CsSpecializations,
  CurrentUserSession,
  Term,
  UserInfo,
} from "@/lib/utils/types";
import type { GenEdRequirementList } from "@/lib/utils/schemas";

export type { Course, CsSpecializations, CurrentUserSession, Term, UserInfo };

export type Semester = { term: Term; year: number };

export type CourseRecord = {
  courseId: string;
  name: string | null;
  deptId: string | null;
  credits: number | null;
  genEds: string[][];
  lastSyncedAt: Date | null;
};

export type UserCourseRecord = {
  id: number;
  userId: string;
  courseId: string;
  semester: Semester;
  selectedGenEds: string[] | null;
  transferCreditName: string | null;
  customUlConcentration: boolean;
  transferGenEdsOverride: string[][] | null;
  index: number | null;
  course: CourseRecord;
};

export type CoursePlacement = {
  course: Course;
  semester: Semester;
  index: number;
};

export type CourseIdentifier = {
  courseId: string;
  semester: Semester;
};

export type ULCourse = {
  courseId: string;
  semester: Semester;
  credits: number;
  custom: boolean;
};

export type ULConcentration = {
  concentration: string;
  courses: ULCourse[];
};

export type PlannerMutationResult = {
  savedCourses?: Array<{ id: number; courseId: string; semester: Semester }>;
  deletedCount?: number;
  updatedGenEdRequirements: GenEdRequirementList;
  updatedULConcentration: ULConcentration;
};

export type AcademicOverview = {
  allSemesters: Record<string, Course[]>;
  genEdRequirements: GenEdRequirementList;
  upperLevelConcentrationCourses: ULConcentration;
  userInfo: UserInfo;
};

