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
  disableCourseEditing?: boolean;
  isCore?: boolean; // Used to determine if this is a core semester, or a transfer semester
  minNumCourses?: number;
  title?: React.ReactNode;
}

const Semester = ({
  term,
  year,
  courses,
  disableCourseEditing,
  isCore = true,
  minNumCourses,
  title,
}: SemesterProps) => {
  const semesterTerm = termYearToString(term, year);
  
  return (
    <SemesterProvider term={term} year={year} initialCourses={courses}>
      <div className="flex flex-col rounded-lg border w-full h-min overflow-hidden bg-card shadow-md">
        {title ? title : (
          <p className="w-full border-b p-1 px-3 text-sm md:text-base">
            {semesterTerm}
          </p>
        )}

        <div className="grid grid-cols-[1fr,2fr,3.5rem] border-b text-xs md:text-sm text-muted-foreground">
          <p className="w-full px-3 py-1">Course</p>
          <p className="border-x w-full px-3 py-1">GenEd</p>
          <p className="w-full text-center py-1">Credits</p>
        </div>

        <SemesterCourseList 
          initialCourses={courses} 
          disableCourseEditing={disableCourseEditing} 
          isCore={isCore}
          minNumCourses={minNumCourses}
        />
      </div>
    </SemesterProvider>
  )
}

/**
 * Keeps track of the number of courses and adds additional CourseInput components as needed
 * Shows total credits as well
 */
interface SemesterCourseListProps {
  initialCourses?: Course[];
  disableCourseEditing?: boolean;
  isCore?: boolean;
  minNumCourses?: number;
}
const SemesterCourseList = ({ initialCourses, disableCourseEditing, isCore, minNumCourses = 5 } : SemesterCourseListProps) => {
  const initialLength = initialCourses?.length ?? 0;
  const { courses } = useSemester();
  const [numCourseInputs, setNumCourseInputs] = useState<number>(Math.max(initialLength, minNumCourses));

  useEffect(() => {
    console.log("Courses updated:", courses);
    console.log("Current number of course inputs:", numCourseInputs);
    console.log(courses.length, numCourseInputs, isCore);
    if (isCore && courses.length === numCourseInputs && numCourseInputs < 8) {
      console.log("Adding new course input");
      setNumCourseInputs((prevNum) => prevNum + 1);
    }
  }, [courses, numCourseInputs, isCore]);

  if (!isCore) {
    if (initialLength === 0) {
      return (
        <div className="p-3 text-muted-foreground text-sm text-center">
          No transfer courses available
        </div>
      );
    }
    return (
      <>
        {initialCourses?.map((course) => (
          <CourseInput key={course.courseId} initialCourse={course} disabled={disableCourseEditing} />
        ))}
        <div className="h-8 w-full grid grid-cols-[3fr,3.5rem] text-xs md:text-sm">
          <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
          <p className="w-full flex items-center justify-center">
            {courses.reduce((total, course) => total + (course.credits || 0), 0)}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {initialCourses?.map((course) => (
        <CourseInput key={course.courseId} initialCourse={course} disabled={disableCourseEditing} />
      ))}
      {[...Array(numCourseInputs - initialLength)].map((_, i) => (
        <CourseInput key={i} disabled={disableCourseEditing} />
      ))}
      <div className="h-8 w-full grid grid-cols-[3fr,3.5rem] text-xs md:text-sm">
        <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
        <p className="w-full flex items-center justify-center">
          {courses.reduce((total, course) => total + (course.credits || 0), 0)}
        </p>
      </div>
    </>
  );
}

const SemesterHeaderText = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="w-full border-b p-1 px-3 text-sm md:text-base">
      {children}
    </p>
  )
}


export { Semester, SemesterHeaderText };