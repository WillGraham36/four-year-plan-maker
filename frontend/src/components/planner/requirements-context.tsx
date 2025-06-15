'use client';
import { getAllGenEds, getAllULCourses } from "@/lib/api/planner/planner.server";
import { GenEdList, ULCoursesInfo } from "@/lib/utils/schemas";
import { CourseWithSemester } from "@/lib/utils/types";
import { createContext, useContext, useState } from "react";

interface RequirementsContextProps {
  refreshGenEds: () => Promise<void>;
  genEds: GenEdList;

  refreshULCourses: () => Promise<void>;
  ULCourses: ULCoursesInfo;

  refreshAllRequirements: () => Promise<void>;

  totalCredits: number;
  updateTotalCredits: (credits: number, isRemoval?: boolean) => void;
}

const RequirementsContext = createContext<RequirementsContextProps | undefined>(undefined);

interface RequirementsProviderProps {
  children: React.ReactNode;
  initialGenEds: GenEdList;
  initialULCourses: ULCoursesInfo;
  initialTotalCredits?: number;
}

export const RequirementsProvider = ({ children, initialGenEds, initialULCourses, initialTotalCredits }: RequirementsProviderProps) => {
  const [genEds, setGenEds] = useState<GenEdList>(initialGenEds || []);
  const [ULCourses, setULCourses] = useState<ULCoursesInfo>(initialULCourses || []);
  const [totalCredits, setTotalCredits] = useState<number>(initialTotalCredits || 0);

  const refreshGenEds = async () => {
    const genEds = await getAllGenEds();
    setGenEds(genEds);
  };

  const refreshULCourses = async () => {
    const ul = await getAllULCourses();
    setULCourses(ul.courses);
  }

  const updateTotalCredits = (credits: number, isRemoval?: boolean) => {
    setTotalCredits(prev => isRemoval ? prev - credits : prev + credits);
  }

  const refreshAllRequirements = async () => { await Promise.all([refreshGenEds(), refreshULCourses()]); }

  return (
    <RequirementsContext.Provider 
      value={{ refreshGenEds, genEds, refreshULCourses, ULCourses, refreshAllRequirements, totalCredits, updateTotalCredits }}
    >
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