"use client";
import { useEffect, useState } from "react";
import CourseInput from "./course-input";
import { Course, Term } from "@/lib/utils/types";
import SemesterHeader from "./semester-header";
import { useRequirements } from "../context/requirements-context";
import { SemesterProvider, useSemester } from "../context/semester-context";
import { cn } from "@/lib/utils";

interface SemesterProps {
  term: Term;
  year: number;
  courses: Course[];
  disableCourseEditing?: boolean;
  isCore?: boolean; // Used to determine if this is a core semester, or a transfer semester
  minNumCourses?: number;
  title?: React.ReactNode;
  removable?: boolean;
  maxCourses?: number;
}

const Semester = ({
  term,
  year,
  courses,
  disableCourseEditing,
  isCore = true,
  minNumCourses,
  title,
  removable = false,
  maxCourses
}: SemesterProps) => {
  const { completedSemesters } = useRequirements();
  const [completed, setCompleted] = useState(completedSemesters.some(sem => sem.term === term && sem.year === year));
  
  return (
    <SemesterProvider term={term} year={year} initialCourses={courses}>
      <div className={`flex flex-col rounded-lg border w-full h-min bg-card shadow-md`}>
        {title ? title : (
          <SemesterHeader 
            term={term}
            year={year}
            removable={removable}
            completed={completed}
            setCompleted={setCompleted}
          />
        )}

        <div className="relative w-full">
          <div className={`grid ${isCore ? 'grid-cols-[1fr_2fr_3.5rem]' : 'grid-cols-[1fr_2fr_7rem]'} border-b text-xs md:text-sm text-muted-foreground`}>
            <p className="w-full px-3 py-1">Course</p>
            <p className="border-x w-full px-3 py-1">Gen Ed</p>
            <p className="w-full text-center py-1">Credits</p>
          </div>

          <SemesterCourseList 
            initialCourses={courses} 
            disableCourseEditing={disableCourseEditing || completed} 
            isCore={isCore}
            minNumCourses={minNumCourses}
            maxCourses={maxCourses}
          />

          <div className={`absolute inset-0 bg-muted/50 rounded-lg transition-opacity duration-200 z-40 ${completed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
        </div>
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
  maxCourses?: number;
}
const SemesterCourseList = ({ initialCourses, disableCourseEditing, isCore, minNumCourses = 5, maxCourses }: SemesterCourseListProps) => {
  const { courses } = useSemester();
  const maxNumCourses = maxCourses ?? 8;

  // Handle core semesters (with index-based ordering)
  const maxInitialIndex = (initialCourses?.length ?? 0) > 0 
    ? Math.max(...(initialCourses ?? []).map(course => course.index ?? 0))
    : -1;
  const minSlotsForIndices = maxInitialIndex + 1;
  const totalSlots = Math.max(minNumCourses, minSlotsForIndices);
  const [numCourseInputs, setNumCourseInputs] = useState<number>(totalSlots);
  useEffect(() => {
    if (isCore && (courses.length === numCourseInputs && numCourseInputs < maxNumCourses)) {
      setNumCourseInputs((prevNum) => courses.length + 1);
    }
  }, [courses, numCourseInputs]);


  if (isCore) {
    const coursesByIndex = new Map();
    initialCourses?.forEach(course => {
      const index = course.index ?? 0;
      coursesByIndex.set(index, course);
    });
    return (
      <>
        {Array.from({ length: numCourseInputs }, (_, index) => {
          const course = coursesByIndex.get(index);
          return course ? (
            <CourseInput 
              key={course.courseId}
              initialCourse={course} 
              disabled={disableCourseEditing} 
              index={index}
            />
          ) : (
            <CourseInput 
              key={`empty-${index}`}
              disabled={disableCourseEditing} 
              index={index}
            />
          );
        })}
        <div className="h-8 w-full grid grid-cols-[3fr_3.5rem] text-xs md:text-sm">
          <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
          <p className="w-full flex items-center justify-center">
            {courses.reduce((total, course) => total + (course.credits || 0), 0)}
          </p>
        </div>
      </>
    );
  }

  // Handle non-core semesters (transfer courses - no index ordering)
  if (initialCourses?.length === 0) {
    return (
      <div className="p-3 text-muted-foreground text-sm text-center">
        No transfer courses available
      </div>
    );
  }

  return (
    <>
      {(initialCourses ?? []).map((course, arrayIndex) => (
        <CourseInput 
          key={course.courseId}
          initialCourse={course} 
          disabled={disableCourseEditing} 
          isCore={isCore}
          index={arrayIndex} // Use array index instead of course.index for non-core
        />
      ))}
      <div className="h-8 w-full grid grid-cols-[3fr_7rem] text-xs md:text-sm">
        <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
        <p className="w-full flex items-center justify-center">
          {courses.reduce((total, course) => total + (course.credits || 0), 0)}
        </p>
      </div>
    </>
  );
}

const SemesterHeaderText = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <span className={cn("w-full border-b p-1 px-3 text-sm md:text-base", className)}>
      {children}
    </span>
  )
}

export { Semester, SemesterHeaderText };