'use client';
import { useCourseApi } from "@/lib/api/planner/planner.client";
import { GenEd, GenEdList, ULCoursesInfo } from "@/lib/utils/schemas";
import { Course, GenEd as GenEdListType, SemesterDateDescriptor, Term, UserInfo } from "@/lib/utils/types";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface RequirementsContextProps {
  saveNewCourseAndRefreshGenEdsAndULCourses: (course: Course, term: Term, year: number, index: number) => Promise<void>;
  updateCourseSelectedGenEdsAndRefreshGenEds: (courseId: string, selectedGenEds: GenEdListType[]) => Promise<void>;
  deleteSemesterCoursesAndRefreshGenEdsAndULCourses: (courseIds: string[], term: Term, year: number) => Promise<void>;
  genEds: GenEdList;

  refreshULCourses: () => Promise<void>;
  ULCourses: ULCoursesInfo;

  refreshAllRequirements: () => Promise<void>;

  totalCredits: number;
  updateTotalCredits: (credits: number, isRemoval?: boolean) => void;

  completedSemesters: SemesterDateDescriptor[];
  updateCompletedSemesters: (semesters: SemesterDateDescriptor, isRemoval?: boolean) => void;

  updateGenEdsOptimistic: (updatedGenEds: GenEd[]) => void;
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
  const { getAllGenEds, getAllULCourses, saveCourseAndReturnUpdated, updateCourseSelectedGenEdsAndReturnUpdated, deleteSemesterCoursesAndReturnUpdated } = useCourseApi();

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

  const saveNewCourseAndRefreshGenEdsAndULCourses = async (course: Course, term: Term, year: number, index: number) => {
    const res = await saveCourseAndReturnUpdated(course, term, year, index);
    if(!res.ok) {
      toast.error("Failed to save course. Please try again.");
      return;
    }
    const { savedCourses, updatedGenEds, updatedULConcentration } = res.data;
    setGenEds(updatedGenEds);
    setULCourses(updatedULConcentration.courses);
  }

  const updateCourseSelectedGenEdsAndRefreshGenEds = async (courseId: string, selectedGenEds: GenEdListType[]) => {
    const res = await updateCourseSelectedGenEdsAndReturnUpdated(courseId, selectedGenEds);
    if(!res.ok) {
      toast.error("Failed to save course. Please try again.");
      return;
    }
    const { savedCourses, updatedGenEds, updatedULConcentration } = res.data;
    setGenEds(updatedGenEds);
    setULCourses(updatedULConcentration.courses);
  }

  const refreshGenEds = async () => {
    const newGenEds = await getAllGenEds();
    setGenEds(newGenEds);
  };

  const updateGenEdsOptimistic = (updatedGenEds: GenEd[]) => {
    setGenEds(prev => {
      return [...prev, ...updatedGenEds.filter(ug => !prev.some(g => g.courseId === ug.courseId))];
    });
  };

  const refreshULCourses = async () => {
    const ul = await getAllULCourses();
    setULCourses(ul.courses);
  }

  const updateTotalCredits = (credits: number, isRemoval?: boolean) => {
    setTotalCredits(prev => isRemoval ? prev - credits : prev + credits);
  }

  const deleteSemesterCoursesAndRefreshGenEdsAndULCourses = async (courseIds: string[], term: Term, year: number) => {
    const res = await deleteSemesterCoursesAndReturnUpdated(courseIds, term, year);
    if(!res.ok) {
      toast.error("Failed to delete courses. Please try again.");
      return;
    }
    const { updatedGenEds, updatedULConcentration } = res.data;
    setGenEds(updatedGenEds);
    setULCourses(updatedULConcentration.courses);
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
        saveNewCourseAndRefreshGenEdsAndULCourses,
        updateCourseSelectedGenEdsAndRefreshGenEds,
        deleteSemesterCoursesAndRefreshGenEdsAndULCourses,
        genEds, 
        refreshULCourses, 
        ULCourses, 
        refreshAllRequirements, 
        totalCredits, 
        updateTotalCredits, 
        completedSemesters,
        updateCompletedSemesters,

        updateGenEdsOptimistic,
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