"use client";
import { useEffect, useState } from "react";
import CourseInput from "./course-input";
import { SemesterProvider, useSemester } from "./semester-context";
import { Course, Term } from "@/lib/utils/types";
import { termYearToString } from "@/lib/utils";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "../ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import { deleteOffTerm } from "@/lib/api/planner/planner.server";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SemesterProps {
  term: Term;
  year: number;
  courses: Course[];
  disableCourseEditing?: boolean;
  isCore?: boolean; // Used to determine if this is a core semester, or a transfer semester
  minNumCourses?: number;
  title?: React.ReactNode;
  removable?: boolean;
}

const Semester = ({
  term,
  year,
  courses,
  disableCourseEditing,
  isCore = true,
  minNumCourses,
  title,
  removable = false,
}: SemesterProps) => {
  const semesterTerm = termYearToString(term, year);
  const router = useRouter();

  const onRemoveSemester = async () => {
    if(!removable) return;
    const res = await deleteOffTerm(term, year);
    if (!res.ok) {
      toast.error("Failed to remove semester. Please try again");
      return;
    }
    router.refresh();
  }
  
  return (
    <SemesterProvider term={term} year={year} initialCourses={courses}>
      <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md relative">
        {title ? title : (
          <p className="w-full border-b p-1 px-3 text-sm md:text-base">
            {semesterTerm}
          </p>
        )}

        <div className="grid grid-cols-[1fr,2fr,3.5rem] border-b text-xs md:text-sm text-muted-foreground">
          <p className="w-full px-3 py-1">Course</p>
          <p className="border-x w-full px-3 py-1">GenEd</p>
          <p className="w-full text-center py-1">Credits</p>
        </div>

        <SemesterCourseList 
          initialCourses={courses} 
          disableCourseEditing={disableCourseEditing} 
          isCore={isCore}
          minNumCourses={minNumCourses}
        />

        {removable && (
          <Dialog>
            <DialogTrigger>
              <Tooltip delayDuration={750}>
                <TooltipTrigger 
                className="rounded-full w-4 h-4 flex items-center justify-center absolute top-2 right-2 bg-secondary hover:bg-red-600 transition-colors opacity-80 p-0.5"
                asChild
                >
                  <X className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent className="text-sm text-muted-foreground p-1 px-2">
                  Remove semester | This will delete all courses in this semester
                </TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to remove this semester?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All courses in this semester will be deleted
                </DialogDescription>
                <div className="flex items-center justify-end gap-2">
                    <DialogClose asChild>
                      <Button
                        size={"sm"}
                        variant={"outline"}
                        className="mt-4 py-1"
                      >
                        Cancel
                      </Button>
                    </DialogClose>

                    <DialogClose asChild>
                      <Button
                        size={"sm"}
                        variant="destructive"
                        className="mt-4"
                        onClick={onRemoveSemester}
                      >
                        Remove Semester
                      </Button>
                    </DialogClose>
                  </div>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </SemesterProvider>
  )
}

/**
 * Keeps track of the number of courses and adds additional CourseInput components as needed
 * Shows total credits as well
 */
interface SemesterCourseListProps {
  initialCourses?: Course[];
  disableCourseEditing?: boolean;
  isCore?: boolean;
  minNumCourses?: number;
}
const SemesterCourseList = ({ initialCourses, disableCourseEditing, isCore, minNumCourses = 5 }: SemesterCourseListProps) => {
  const initialLength = initialCourses?.length ?? 0;
  const { courses } = useSemester();
  const [numCourseInputs, setNumCourseInputs] = useState<number>(Math.max(initialLength, minNumCourses));

  useEffect(() => {
    if (isCore && courses.length === numCourseInputs && numCourseInputs < 8) {
      setNumCourseInputs((prevNum) => prevNum + 1);
    }
  }, [courses, numCourseInputs, isCore]);

  if (!isCore) {
    if (initialLength === 0) {
      return (
        <div className="p-3 text-muted-foreground text-sm text-center">
          No transfer courses available
        </div>
      );
    }
    return (
      <>
        {initialCourses?.map((course) => (
          <CourseInput key={course.courseId} initialCourse={course} disabled={disableCourseEditing} />
        ))}
        <div className="h-8 w-full grid grid-cols-[3fr,3.5rem] text-xs md:text-sm">
          <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
          <p className="w-full flex items-center justify-center">
            {courses.reduce((total, course) => total + (course.credits || 0), 0)}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {initialCourses?.map((course) => (
        <CourseInput key={course.courseId} initialCourse={course} disabled={disableCourseEditing} />
      ))}
      {[...Array(numCourseInputs - initialLength)].map((_, i) => (
        <CourseInput key={i} disabled={disableCourseEditing} />
      ))}
      <div className="h-8 w-full grid grid-cols-[3fr,3.5rem] text-xs md:text-sm">
        <p className="w-full flex items-center px-3 text-muted-foreground">Total Credits</p>
        <p className="w-full flex items-center justify-center">
          {courses.reduce((total, course) => total + (course.credits || 0), 0)}
        </p>
      </div>
    </>
  );
}

const SemesterHeaderText = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="w-full border-b p-1 px-3 text-sm md:text-base">
      {children}
    </p>
  )
}


export { Semester, SemesterHeaderText };