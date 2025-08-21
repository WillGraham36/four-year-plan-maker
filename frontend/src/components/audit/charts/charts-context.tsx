'use client';
import { Course } from "@/lib/utils/types";
import { createContext, useContext, useMemo } from "react";
import { useRequirements } from "@/components/context/requirements-context";
import { assignGenEdsToRequirements, GenEdListForRendering } from "@/components/gen-eds/gen-eds-container";

interface ChartData {
  category: string;
  completed: number;
  planned: number;
  totalCount: number;
  rawCompleted: number;
  rawPlanned: number;
}

interface ChartsInfoContextProps {
  allCourses: (Course & { semester: string })[];
  // Chart-specific computed data
  chartData: ChartData[];
  totalCreditsData: {
    completed: number;
    planned: number;
    total: number;
    completedPercentage: number;
    plannedPercentage: number;
  };
  genEdsData: {
    completed: number;
    planned: number;
    total: number;
    completedPercentage: number;
    plannedPercentage: number;
  };
  upperLevelCreditsData: {
    completed: number;
    planned: number;
    total: number;
    completedPercentage: number;
    plannedPercentage: number;
  };
  majorRequirementsData: {
    completed: number;
    planned: number;
    total: number;
    completedPercentage: number;
    plannedPercentage: number;
  };
}

const ChartsInfoContext = createContext<ChartsInfoContextProps | undefined>(undefined);

interface ChartsInfoProviderProps {
  children: React.ReactNode;
  allCourses?: (Course & { semester: string })[];
}

export const ChartsInfoProvider = ({ children, allCourses = [] }: ChartsInfoProviderProps) => {
  
  const contextValue = useMemo(() => {
    // We'll compute this inside a child component that has access to useRequirements
    return { allCourses };
  }, [allCourses]);

  return (
    <ChartsInfoContext.Provider value={contextValue as ChartsInfoContextProps}>
      <ChartsComputationWrapper>
        {children}
      </ChartsComputationWrapper>
    </ChartsInfoContext.Provider>
  );
};

// Wrapper component that handles the computation logic
const ChartsComputationWrapper = ({ children }: { children: React.ReactNode }) => {
  const { completedSemesters, ULCourses, genEds } = useRequirements();
  const context = useContext(ChartsInfoContext);
  
  if (!context) {
    throw new Error("ChartsComputationWrapper must be used within ChartsInfoProvider");
  }

  const { allCourses } = context;

  const computedData = useMemo(() => {
    const completedSemesterNames = new Set(
      completedSemesters.map(sem => sem.term + ' ' + sem.year)
    );

    // Total credits computation
    let totalPlannedCredits = 0;
    let totalCompletedCredits = 0;
    
    allCourses.forEach(course => {
      const credits = course.credits || 0;
      const isCompleted = course.semester === "Transfer Credit" || 
        completedSemesterNames.has(course.semester.toUpperCase());
      
      if (isCompleted) {
        totalCompletedCredits += credits;
      } else {
        totalPlannedCredits += credits;
      }
    });

    const totalCreditsData = {
      completed: totalCompletedCredits,
      planned: totalPlannedCredits,
      total: 120,
      completedPercentage: Math.round((totalCompletedCredits / 120) * 100),
      plannedPercentage: Math.round((totalPlannedCredits / 120) * 100)
    };

    // UL Credits computation
    let totalPlannedULCredits = 0;
    let totalCompletedULCredits = 0;
    
    ULCourses.forEach(course => {
      const credits = course.credits || 0;
      const isCompleted = completedSemesterNames.has(
        course.semester.term + ' ' + course.semester.year
      );

      if (isCompleted) {
        totalCompletedULCredits += credits;
      } else {
        totalPlannedULCredits += credits;
      }
    });

    const upperLevelCreditsData = {
      completed: totalCompletedULCredits,
      planned: totalPlannedULCredits,
      total: 12,
      completedPercentage: Math.round((totalCompletedULCredits / 12) * 100),
      plannedPercentage: Math.round((totalPlannedULCredits / 12) * 100)
    };

    // Gen Eds computation
    const assignedGenEds = assignGenEdsToRequirements(genEds);
    let completedGenEds = 0;
    let plannedGenEds = 0;

    GenEdListForRendering.forEach((requiredGenEd, index) => {
      const assignment = assignedGenEds[index];
      
      if (assignment && assignment.courseId && assignment.courseId.trim() !== '') {
        const [term, year] = assignment.semesterName.split(' ');
        const isCompleted = assignment.semesterName === 'TRANSFER -1' || 
          completedSemesters.some(sem => 
            sem.term === term && sem.year === parseInt(year)
          );
        
        if (isCompleted) {
          completedGenEds++;
        } else {
          plannedGenEds++;
        }
      }
    });

    const genEdsData = {
      completed: completedGenEds,
      planned: plannedGenEds,
      total: GenEdListForRendering.length,
      completedPercentage: Math.round((completedGenEds / GenEdListForRendering.length) * 100),
      plannedPercentage: Math.round((plannedGenEds / GenEdListForRendering.length) * 100)
    };

    // Major Requirements computation (you might want to make this dynamic)
    const majorRequirementsData = {
      completed: 6,
      planned: 6,
      total: 15,
      completedPercentage: Math.round((6 / 15) * 100),
      plannedPercentage: Math.round((6 / 15) * 100)
    };

    // Combined chart data for the bar chart
    const chartData: ChartData[] = [
      { 
        category: "Total Credits", 
        completed: totalCreditsData.completedPercentage,
        planned: totalCreditsData.plannedPercentage,
        totalCount: totalCreditsData.total,
        rawCompleted: totalCreditsData.completed,
        rawPlanned: totalCreditsData.planned
      },
      { 
        category: "Gen Eds", 
        completed: genEdsData.completedPercentage,
        planned: genEdsData.plannedPercentage,
        totalCount: genEdsData.total,
        rawCompleted: genEdsData.completed,
        rawPlanned: genEdsData.planned
      },
      { 
        category: "Major Requirements", 
        completed: majorRequirementsData.completedPercentage,
        planned: majorRequirementsData.plannedPercentage,
        totalCount: majorRequirementsData.total,
        rawCompleted: majorRequirementsData.completed,
        rawPlanned: majorRequirementsData.planned
      },
      { 
        category: "Upper Level Concentration", 
        completed: upperLevelCreditsData.completedPercentage,
        planned: upperLevelCreditsData.plannedPercentage,
        totalCount: upperLevelCreditsData.total,
        rawCompleted: upperLevelCreditsData.completed,
        rawPlanned: upperLevelCreditsData.planned
      },
    ];

    return {
      allCourses,
      chartData,
      totalCreditsData,
      genEdsData,
      upperLevelCreditsData,
      majorRequirementsData
    };
  }, [allCourses, completedSemesters, ULCourses, genEds]);

  return (
    <ChartsInfoContext.Provider value={computedData}>
      {children}
    </ChartsInfoContext.Provider>
  );
};

export const useChartsInfo = () => {
  const context = useContext(ChartsInfoContext);
  if (context === undefined) {
    throw new Error("useChartsInfo must be used within a ChartsInfoProvider");
  }
  return context;
};