"use client";
import { Course, Term } from "@/lib/utils/types";
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { useRequirements } from "./requirements-context";

interface SemesterContextProps {
  term: Term;
  year: number;
  courses: Course[];
  addCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  hasCourse: (courseId: string) => boolean;
  getTotalCredits: () => number;
}

const SemesterContext = createContext<SemesterContextProps | undefined>(undefined);

export const SemesterProvider = ({ children, term, year, initialCourses }: { children: ReactNode, term: Term, year: number, initialCourses: Course[] }) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const { updateTotalCredits } = useRequirements();

  const addCourse = useCallback((course: Course) => {
    setCourses(prevCourses => {
      // Double-check for duplicates before adding
      if (prevCourses.some(c => c.courseId === course.courseId)) {
        return prevCourses;
      }
      return [...prevCourses, course];
    });
    updateTotalCredits(course.credits); // Update total credits when adding a course
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    setCourses(prevCourses => {
      // Remove the course with the given courseId
      const filteredCourses = prevCourses.filter(c => c.courseId !== courseId);

      // Then check if this course is a dependency for any other courses AND that dependency is selected
      // If it is, update the selectedGenEds of those courses to the non dependent ones
      const updatedCourses = filteredCourses.map((c) => {
        if(c.selectedGenEds 
          && c.selectedGenEds.length > 0 
          && c.selectedGenEds.some(genEd => genEd.includes("|") && genEd.split("|")[1] === courseId
        )) {
          return {
            ...c,
            selectedGenEds: c.genEds[1] || c.genEds[0] // Fallback to first gen ed group if second is not available
          }
        } else {
          return c;
        }
      })
      return (updatedCourses);
    });
    updateTotalCredits(courses.find(c => c.courseId === courseId)?.credits || 0, true); // Update total credits when removing a course
  }, []);

  const hasCourse = useCallback((courseId: string) => {
    return courses.some(c => c.courseId === courseId);
  }, [courses]);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    courses,
    addCourse,
    removeCourse,
    hasCourse,
    term,
    year,
    getTotalCredits: () => courses.reduce((total, course) => total + (course.credits || 0), 0)
  }), [courses, addCourse, removeCourse, hasCourse, term, year]);

  return (
    <SemesterContext.Provider value={contextValue}>
      {children}
    </SemesterContext.Provider>
  )
}

export const useSemester = () => {
  const context = useContext(SemesterContext);
  if (context === undefined) {
    throw new Error("useSemester must be used within a SemesterProvider");
  }
  return context;
}