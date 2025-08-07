"use client";
import { Course, Term } from "@/lib/utils/types";
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { useRequirements } from "../context/requirements-context";

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

interface SemesterProviderProps {
  term: Term;
  year: number;
  initialCourses: Course[];
  children: ReactNode;
}

export const SemesterProvider = ({ 
  children, 
  term, 
  year, 
  initialCourses, 
}: SemesterProviderProps) => {
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
    const courseToRemove = prevCourses.find(c => c.courseId === courseId);
    if (!courseToRemove) return prevCourses;
    
    // Remove the course with the given courseId
    const filteredCourses = prevCourses.filter(c => c.courseId !== courseId);

    // Then check if this course is a dependency for any other courses AND that dependency is selected
    // If it is, update the selectedGenEds of those courses to the non dependent ones
    const updatedCourses = filteredCourses.map((c) => {
      if(c.selectedGenEds 
        && c.selectedGenEds.length > 0 
        && c.selectedGenEds.some(genEd => genEd.includes("|") && genEd.split("|")[1] === courseId)
      ) {
        // Find the first non-dependent gen ed group
        const nonDependentGenEds = c.genEds.find(genEdGroup => 
          !genEdGroup.some(genEd => genEd.includes("|"))
        ) || c.genEds[0];
        
        return {
          ...c,
          selectedGenEds: nonDependentGenEds
        };
      } else {
        return c;
      }
    });
    
    return updatedCourses;
  });
  
  // Update total credits when removing a course
  const courseToRemove = courses.find(c => c.courseId === courseId);
  if (courseToRemove) {
    updateTotalCredits(courseToRemove.credits || 0, true);
  }
}, [courses, updateTotalCredits]);

  const hasCourse = useCallback((courseId: string) => {
    return courses.some(c => c.courseId === courseId);
  }, [courses]);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    courses,
    term,
    year,
    addCourse,
    removeCourse,
    hasCourse,
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