import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Semesters } from "./utils/schemas"
import { Course, Term } from "./utils/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Safely extract the courses from a semester
 * @param semesters 
 * @param term 
 * @param year 
 * @returns Array of courses for the given semester
 */
export function extractSemester(semesters: Semesters, term: Term, year: number): Course[] {
  const courses = semesters[`Semester(term=${term}, year=${year})`] as Course[]

  if (courses === undefined) {
    return []
  }
  return courses;
}

export function courseAndSemesterToDto(course: Course, term: Term, year: number) {
  return {
    course: {
      courseId: course.courseId,
      name: course.name,
      credits: course.credits,
      genEds: course.genEds,
    },
    semester: {
      term: { term },
      year: { year },
    },
  };
}
