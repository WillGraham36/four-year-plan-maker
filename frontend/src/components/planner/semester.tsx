"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import CourseInput from "./course-input";
import { SemesterProvider, useSemester } from "./semester-context";
import { Course, Term } from "@/lib/utils/types";

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

  return (
    <SemesterProvider term={term} year={year} initialCourses={courses}>
      <div className="flex flex-col rounded-lg border border-neutral-600 mt-5 ml-5 max-w-lg h-min overflow-hidden dark:text-neutral-300">
        <p className="w-full border-b border-neutral-600 p-2 px-3">
            {term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()} {year}
        </p>

        <div className="grid grid-cols-[1fr,2fr,4rem] border-b border-neutral-600 text-sm">
          <p className="w-full px-3 py-1">Course</p>
          <p className="border-x border-neutral-600 w-full px-3 py-1">GenEd</p>
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
  const [numCourseInputs, setNumCourseInputs] = useState<number>(Math.max(initialLength, 4));

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
      <div className="h-10 w-full grid grid-cols-[1fr,2fr,4rem] text-sm">
        <p className="w-full flex items-center justify-center">Total Credits</p>
        <div className="w-full border-r border-neutral-600"></div>
        <p className="w-full flex items-center justify-center">
          {courses.reduce((total, course) => total + (course.credits || 0), 0)}
        </p>
      </div>
    </>
  )
}

export default Semester