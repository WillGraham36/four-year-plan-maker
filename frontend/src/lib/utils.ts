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

/**
 * Converts a term and year into a string representation
 * @example termYearToString('FALL', 2024) => 'Fall 2024'
 */
export function termYearToString(term: string, year: number | string): string;
export function termYearToString(termYear: string): string;
export function termYearToString(termOrTermYear: string, year?: number | string): string {
  if (year !== undefined) {
    return `${termOrTermYear.charAt(0).toUpperCase()}${termOrTermYear.slice(1).toLowerCase()} ${year}`;
  }
  if(termOrTermYear.length === 0) {
    return "";
  }
  // Assume input is like "FALL 2024"
  const [term, yr] = termOrTermYear.split(" ");
  return `${term.charAt(0).toUpperCase()}${term.slice(1).toLowerCase()} ${yr}`;
}


export function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
};

export function arrayEqualsNoOrdering<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const aSorted = [...a].sort();
  const bSorted = [...b].sort();
  return aSorted.every((val, idx) => val === bSorted[idx]);
}