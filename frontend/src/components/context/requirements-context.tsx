'use client';
import { useCourseApi } from "@/lib/api/planner/planner.client";
import { GenEdList, ULCoursesInfo } from "@/lib/utils/schemas";
import { CourseWithSemester, SemesterDateDescriptor, UserInfo } from "@/lib/utils/types";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface RequirementsContextProps {
  refreshGenEds: () => Promise<void>;
  genEds: GenEdList;

  refreshULCourses: () => Promise<void>;
  ULCourses: ULCoursesInfo;

  refreshAllRequirements: () => Promise<void>;

  totalCredits: number;
  updateTotalCredits: (credits: number, isRemoval?: boolean) => void;

  completedSemesters: SemesterDateDescriptor[];
  updateCompletedSemesters: (semesters: SemesterDateDescriptor, isRemoval?: boolean) => void;
}

const RequirementsContext = createContext<RequirementsContextProps | undefined>(undefined);

interface RequirementsProviderProps {
  children: React.ReactNode;
  initialGenEds: GenEdList;
  initialULCourses: ULCoursesInfo;
  initialTotalCredits?: number;
  userInfo: UserInfo | null;
  redirectIfNotCS?: boolean;
}

export const RequirementsProvider = ({ children, initialGenEds, initialULCourses, initialTotalCredits, userInfo, redirectIfNotCS }: RequirementsProviderProps) => {
  const [completedSemesters, setCompletedSemesters] = useState<SemesterDateDescriptor[]>(userInfo?.completedSemesters || []);
  const [genEds, setGenEds] = useState<GenEdList>(initialGenEds || []);
  const [ULCourses, setULCourses] = useState<ULCoursesInfo>(initialULCourses || []);
  const [totalCredits, setTotalCredits] = useState<number>(initialTotalCredits || 0);
  const { getAllGenEds, getAllULCourses } = useCourseApi();

  const router = useRouter();
  useEffect(() => {
    if(!userInfo || !userInfo.startSemester || !userInfo.endSemester) {
      toast.info("Please complete your account setup first");
      router.push("/account/setup");
    }

    if(redirectIfNotCS && userInfo?.major !== "Computer Science") {
      toast.info("Sorry, this feature is only available for Computer Science majors for right now");
      router.push("/planner");
    }
  }, [userInfo, router]);

  // prevent flicker of this page if user info is not available
  if (!userInfo || !userInfo.startSemester || !userInfo.endSemester) {
    return null; 
  }

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

  const updateCompletedSemesters = (semester: SemesterDateDescriptor, isRemoval?: boolean) => {
    setCompletedSemesters(prev => {
      const existingIndex = prev.findIndex(s => s.term === semester.term && s.year === semester.year);
      if (existingIndex !== -1 || isRemoval) {
        // If it exists, remove it
        return prev.filter((_, idx) => idx !== existingIndex);
      }
      // Otherwise, add it
      return [...prev, semester];
    });
  }

  const refreshAllRequirements = async () => { await Promise.all([refreshGenEds(), refreshULCourses()]); }

  return (
    <RequirementsContext.Provider
      value={{ 
        refreshGenEds, 
        genEds, 
        refreshULCourses, 
        ULCourses, 
        refreshAllRequirements, 
        totalCredits, 
        updateTotalCredits, 
        completedSemesters,
        updateCompletedSemesters
      }}
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