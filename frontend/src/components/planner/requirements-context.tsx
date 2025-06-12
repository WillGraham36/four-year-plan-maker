'use client';
import { getAllGenEds, getAllULCourses } from "@/lib/api/planner/planner.server";
import { GenEdList } from "@/lib/utils/schemas";
import { CourseWithSemester } from "@/lib/utils/types";
import { createContext, useContext, useState } from "react";

interface RequirementsContextProps {
  refreshGenEds: () => void;
  genEds: GenEdList;

  refreshULCourses: () => void;
  ULCourses: CourseWithSemester[];

  refreshAll: () => void;
}

const RequirementsContext = createContext<RequirementsContextProps | undefined>(undefined);

interface RequirementsProviderProps {
  children: React.ReactNode;
  initialGenEds: GenEdList;
  initialULCourses: CourseWithSemester[];
}

export const RequirementsProvider = ({ children, initialGenEds, initialULCourses }: RequirementsProviderProps) => {
  const [genEds, setGenEds] = useState<GenEdList>(initialGenEds || []);
  const [ULCourses, setULCourses] = useState<CourseWithSemester[]>(initialULCourses || []);

  const refreshGenEds = async () => {
    const genEds = await getAllGenEds();
    setGenEds(genEds);
  };

  const refreshULCourses = async () => {
    const ul = await getAllULCourses();
    setULCourses(ul.courses);
  }

  const refreshAll = async () => { await Promise.all([refreshGenEds(), refreshULCourses()]); }

  return (
    <RequirementsContext.Provider value={{ refreshGenEds, genEds, refreshULCourses, ULCourses, refreshAll }}>
      {children}
    </RequirementsContext.Provider>
  );
}

export const useRequirements = () => {
  const context = useContext(RequirementsContext);
  if (context === undefined) {
    throw new Error("useRequirements must be used within a RequirementsProvider");
  }
  return context;
}