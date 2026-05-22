'use client';
import { cn, termYearToString } from "@/lib/utils";
import { useRequirements } from "../context/requirements-context";
import { ULCCombobox } from "./concentration-combobox";
import { Fragment, useMemo, useState } from "react";
import SatisfiedCheck from "../ui/satisfied-check";
import { useCourseApi } from "@/lib/api/planner/planner.client";
import { Semesters } from "@/lib/utils/schemas";
import { Term } from "@/lib/utils/types";
import { Button, buttonVariants } from "../ui/button";
import { Plus, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { toast } from "sonner";


interface ULCProps {
  concentration: string;
  semesters: Semesters;
}

const UpperLevelConcentrationContainer = ({
  concentration: initialConcentration = "",
  semesters,
}: ULCProps) => {
  const [concentration, setConcentration] = useState<string>(initialConcentration);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [updatingCourseKey, setUpdatingCourseKey] = useState<string | null>(null);
  const { ULCourses, refreshULCourses, completedSemesters } = useRequirements();
  const { updateULConcentration, addCustomULCourse, removeCustomULCourse } = useCourseApi();
  const totalCredits = ULCourses.reduce((total, course) => total + course.credits, 0);
  const availableCustomCourses = useMemo(() => {
    const customCourseIds = new Set(ULCourses.filter(course => course.custom).map(course => course.courseId));

    return Object.entries(semesters)
      .flatMap(([semesterKey, courses]) => {
        const semester = parseSemesterKey(semesterKey);
        if (!semester) return [];

        return courses.map(course => ({
          course,
          term: semester.term,
          year: semester.year,
        }));
      })
      .filter(({ course }) => isUpperLevelCourse(course.courseId))
      .filter(({ course }) => !customCourseIds.has(course.courseId));
  }, [semesters, ULCourses]);

  const onAddCustomCourse = async (courseId: string, term: Term, year: number) => {
    const key = getCourseSemesterKey(courseId, term, year);
    setUpdatingCourseKey(key);
    try {
      await addCustomULCourse(courseId, term, year);
      await refreshULCourses();
      setCoursePickerOpen(false);
    } catch {
      toast.error("Failed to add course to upper level concentration");
    } finally {
      setUpdatingCourseKey(null);
    }
  };

  const onRemoveCustomCourse = async (courseId: string, term: Term, year: number) => {
    const key = getCourseSemesterKey(courseId, term, year);
    setUpdatingCourseKey(key);
    try {
      await removeCustomULCourse(courseId, term, year);
      await refreshULCourses();
    } catch {
      toast.error("Failed to remove course from upper level concentration");
    } finally {
      setUpdatingCourseKey(null);
    }
  };

  return (
    <div className="flex flex-col rounded-lg border w-full h-min overflow-hidden bg-card shadow-md">
      <div className="flex items-center justify-between w-full border-b py-1.5 px-3">
        <div className="flex items-center gap-2">
          <SatisfiedCheck
            isChecked={totalCredits >= 12}
            uncheckedMessage="You need at least 12 credits of upper-level courses to satisfy this requirement"
            checkedMessage="You met the upper-level concentration requirements!"
          />
          <p className="font-semibold text-lg">
            Upper Level Concentration <span className="text-muted-foreground text-sm md:text-base ml-1">({totalCredits} / 12 credits)</span>
          </p>
        </div>
        <ULCCombobox value={concentration} setValueStateAction={async (newConcentration) => {
          setConcentration(newConcentration);
          await updateULConcentration(newConcentration.toString()); 
          await refreshULCourses();
        }}/>
      </div>

      <div className="grid grid-cols-[1fr_2fr_7rem] border-b text-xs md:text-sm text-muted-foreground">
        <p className="w-full px-3 py-1">Course</p>
        <p className="border-x w-full px-3 py-1">Semester Completed</p>
        <p className="w-full text-center py-1">Credits</p>
      </div>

      <div className="grid grid-cols-[1fr_2fr_7rem] text-xs md:text-sm text-muted-foreground items-center">
        {ULCourses.map((course, i) => {
          const isCompleted = completedSemesters.some(sem => sem.term === course.semester.term && sem.year === course.semester.year);
          const courseKey = getCourseSemesterKey(course.courseId, course.semester.term as Term, course.semester.year);
          return (
            <Fragment key={courseKey}>
              <div className={`w-full px-3 py-1 flex items-center justify-between gap-2 ${i !== ULCourses.length - 1 ? "border-b" : ""} ${isCompleted ? "bg-green-500/15 dark:bg-green-800/15" : ""}`}>
                <span>{course.courseId}</span>
                {course.custom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveCustomCourse(course.courseId, course.semester.term as Term, course.semester.year)}
                    disabled={updatingCourseKey === courseKey}
                    aria-label={`Remove ${course.courseId} from upper level concentration`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className={`border-x w-full h-full flex items-center px-3 py-1 bg-background ${i !== ULCourses.length - 1 ? "border-b" : ""} ${isCompleted ? "bg-green-500/15 dark:bg-green-800/15" : ""}`}>
                {termYearToString(course.semester.term, course.semester.year)}
              </p>
              <p className={`w-full py-1 h-full flex items-center justify-center bg-background ${i !== ULCourses.length - 1 ? "border-b" : ""} ${isCompleted ? "bg-green-500/15 dark:bg-green-800/15" : ""}`}>
                {course.credits}
              </p>
            </Fragment>
          )
        })}

        {ULCourses.length === 0 && (
          <p className="col-span-3 text-center py-2">No courses found for this concentration</p>
        )}
      </div>

      <Tooltip delayDuration={1500}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              "h-5 py-1 group bg-transparent hover:bg-muted transition-all duration-300 ease-out overflow-hidden px-2 w-full rounded-none border-t"
            )}
            onClick={() => setCoursePickerOpen(true)}
          >
            <Plus className="h-4 w-4 text-muted-foreground/60 group-hover:text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-sm text-muted-foreground p-1 px-2">
          Add Custom Upper Level Course
        </TooltipContent>
      </Tooltip>

      <div className="grid grid-cols-[3fr_7rem] border-t text-xs md:text-sm text-muted-foreground">
        <p className="w-full px-3 py-1">Total Credits</p>
        <p className="w-full text-center py-1 border-l">
          {ULCourses.reduce((total, course) => total + course.credits, 0)}
        </p>
      </div>

      <CommandDialog open={coursePickerOpen} onOpenChange={setCoursePickerOpen}>
        <CommandInput placeholder="Search planned upper-level courses..." />
        <CommandList>
          <CommandEmpty>No available 300+ level planner courses found.</CommandEmpty>
          <CommandGroup heading="Planner Courses">
            {availableCustomCourses.map(({ course, term, year }) => {
              const key = getCourseSemesterKey(course.courseId, term, year);
              return (
                <CommandItem
                  key={key}
                  value={`${course.courseId} ${course.name} ${termYearToString(term, year)}`}
                  onSelect={() => onAddCustomCourse(course.courseId, term, year)}
                  disabled={updatingCourseKey === key}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">{course.courseId}</span>
                    <span className="truncate text-xs text-muted-foreground">{course.name}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {termYearToString(term, year)}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      </div>
  )
}

const parseSemesterKey = (key: string): { term: Term; year: number } | null => {
  const match = key.match(/Semester\(term=(\w+), year=(-?\d+)\)/);
  if (!match) return null;

  return {
    term: match[1] as Term,
    year: Number(match[2]),
  };
};

const isUpperLevelCourse = (courseId: string) => {
  const level = courseId.match(/\d/)?.[0];
  return level ? Number(level) >= 3 : false;
};

const getCourseSemesterKey = (courseId: string, term: Term, year: number) => `${courseId}-${term}-${year}`;

export default UpperLevelConcentrationContainer
