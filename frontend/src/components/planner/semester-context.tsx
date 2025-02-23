"use client";
import { Course, Term } from "@/lib/utils/types";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SemesterContextProps {
  term: Term;
  year: number;
  courses: Course[];
  addCourse: (course: Course) => void;
  removeCourse: (course: Course) => void;
}

const SemesterContext = createContext<SemesterContextProps | undefined>(undefined);

export const SemesterProvider = ({ children, term, year }: { children: ReactNode, term: Term, year: number }) => {
  const [courses, setCourses] = useState<Course[]>([]);

  const addCourse = (course: Course) => {
    setCourses([...courses, course]);
    console.log(courses);
  }

  const removeCourse = (course: Course) => {
    setCourses((prevCourses) => prevCourses.filter((c) => c.courseId !== course.courseId));
  }

  return (
    <SemesterContext.Provider value={{ courses, addCourse, removeCourse, term, year }}>
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