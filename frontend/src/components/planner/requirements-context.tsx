'use client';
import { getAllGenEds, getAllULCourses } from "@/lib/api/planner/planner.server";
import { GenEdList, ULCoursesInfo } from "@/lib/utils/schemas";
import { CourseWithSemester, UserInfo } from "@/lib/utils/types";
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
}

const RequirementsContext = createContext<RequirementsContextProps | undefined>(undefined);

interface RequirementsProviderProps {
  children: React.ReactNode;
  initialGenEds: GenEdList;
  initialULCourses: ULCoursesInfo;
  initialTotalCredits?: number;
  userInfo: UserInfo | null;
}

export const RequirementsProvider = ({ children, initialGenEds, initialULCourses, initialTotalCredits, userInfo }: RequirementsProviderProps) => {
  const [genEds, setGenEds] = useState<GenEdList>(initialGenEds || []);
  const [ULCourses, setULCourses] = useState<ULCoursesInfo>(initialULCourses || []);
  const [totalCredits, setTotalCredits] = useState<number>(initialTotalCredits || 0);

  const router = useRouter();
  useEffect(() => {
    if(!userInfo || !userInfo.startSemester || !userInfo.endSemester) {
      toast("Please complete your account setup to view the planner");
      router.push("/account/setup");
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