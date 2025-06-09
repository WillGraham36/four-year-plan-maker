"use client";
import { useEffect, useState } from "react";
import CourseInput from "./course-input";
import { SemesterProvider, useSemester } from "./semester-context";
import { Course, Term } from "@/lib/utils/types";
import { termYearToString } from "@/lib/utils";

interface SemesterProps {
  term: Term;
  year: number;
  courses: Course[];
}

const Semester = ({
  term,
  year,
  courses,
}: SemesterProps) => {
  const semesterTerm = termYearToString(term, year);

  return (
    <SemesterProvider term={term} year={year} initialCourses={courses}>
      <div className="flex flex-col rounded-lg border w-full h-min overflow-hidden bg-card shadow-md">
        <p className="w-full border-b p-1 px-3 text-sm md:text-base">
          {semesterTerm}
        </p>

        <div className="grid grid-cols-[1fr,2fr,3.5rem] border-b text-xs md:text-sm text-muted-foreground">
          <p className="w-full px-3 py-1">Course</p>
          <p className="border-x w-full px-3 py-1">GenEd</p>
          <p className="w-full text-center py-1">Credits</p>
        </div>

        <SemesterCourseList initialCourses={courses}  />
      </div>
    </SemesterProvider>
  )
}

/**
 * Keeps track of the number of courses and adds additional CourseInput components as needed
 * Shows total credits as well
 */
const SemesterCourseList = ({ initialCourses } : { initialCourses?: Course[]}) => {
  const initialLength = initialCourses?.length ?? 0;
  const { courses } = useSemester();
  const [numCourseInputs, setNumCourseInputs] = useState<number>(Math.max(initialLength, 5));

  // Ensure that there is alwyas at least one empty CourseInput, with a max of 8
  useEffect(() => {
    if(courses.length === numCourseInputs && numCourseInputs < 8) {
      setNumCourseInputs((prevNum) => prevNum + 1);
    }
  }, [courses, numCourseInputs])

  return (
    <>
      {initialCourses?.map((course) => (
        <CourseInput key={course.courseId} initialCourse={course} />
      ))}
      {[...Array(numCourseInputs - initialLength)].map((_, i) => (
        <CourseInput key={i} />
      ))}
      <div className="h-8 w-full grid grid-cols-[3fr,3.5rem] text-xs md:text-sm">
        <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
        <p className="w-full flex items-center justify-center">
          {courses.reduce((total, course) => total + (course.credits || 0), 0)}
        </p>
      </div>
    </>
  )
}

export default Semester