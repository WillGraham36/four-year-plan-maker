'use client';
import { Course } from "@/lib/utils/types";
import { createContext, useContext } from "react";

interface ChartsInfoContextProps {
  allCourses: (Course & { semester: string })[];
}

const ChartsInfoContext = createContext<ChartsInfoContextProps | undefined>(undefined);

interface ChartsInfoProviderProps {
  children: React.ReactNode;
  allCourses?: (Course & { semester: string })[];
}

export const ChartsInfoProvider = ({ children, allCourses }: ChartsInfoProviderProps) => {
  // Set the initial values here
  const internal_allCourses: (Course & { semester: string })[] = allCourses || [];

  return (
    <ChartsInfoContext.Provider
      value={{ allCourses: internal_allCourses }}
    >
      {children}
    </ChartsInfoContext.Provider>
  );
}

export const useChartsInfo = () => {
  const context = useContext(ChartsInfoContext);
  if (context === undefined) {
    throw new Error("useChartsInfo must be used within a ChartsInfoProvider");
  }
  return context;
}
