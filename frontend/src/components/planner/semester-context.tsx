"use client";
import { Course, Term } from "@/lib/utils/types";
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface SemesterContextProps {
  term: Term;
  year: number;
  courses: Course[];
  addCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  hasCourse: (courseId: string) => boolean;
}

const SemesterContext = createContext<SemesterContextProps | undefined>(undefined);

export const SemesterProvider = ({ children, term, year, initialCourses }: { children: ReactNode, term: Term, year: number, initialCourses: Course[] }) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  const addCourse = useCallback((course: Course) => {
    setCourses(prevCourses => {
      // Double-check for duplicates before adding
      if (prevCourses.some(c => c.courseId === course.courseId)) {
        return prevCourses;
      }
      return [...prevCourses, course];
    });
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    setCourses(prevCourses =>
      prevCourses.filter((c) => c.courseId !== courseId)
    );
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
    year
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