'use client';
import { termYearToString } from "@/lib/utils";
import { useRequirements } from "../planner/requirements-context";
import { ULCCombobox } from "./concentration-combobox";
import { Fragment, useState } from "react";
import { updateULConcentration } from "@/lib/api/planner/planner.server";
import SatisfiedCheck from "../ui/satisfied-check";


interface ULCProps {
  concentration: string;
}

const UpperLevelConcentrationContainer = ({
  concentration: initialConcentration = "",
}: ULCProps) => {
  const [concentration, setConcentration] = useState<string>(initialConcentration);
  const { ULCourses, refreshULCourses, completedSemesters } = useRequirements();

  return (
    <div className="flex flex-col rounded-lg border w-full h-min overflow-hidden bg-card shadow-md">
      <div className="flex items-center justify-between w-full border-b p-2 px-3">
        <div className="flex items-center gap-2">
          <SatisfiedCheck
            isChecked={ULCourses.reduce((total, course) => total + course.credits, 0) >= 12}
            message="You need at least 12 credits of upper-level courses to satisfy this requirement"
          />
          <p className="font-semibold text-lg">
            Upper Level Concentration
          </p>
        </div>
        <ULCCombobox value={concentration} setValueStateAction={async (newConcentration) => {
          setConcentration(newConcentration);
          await Promise.all([
            refreshULCourses(),
            updateULConcentration(newConcentration.toString()),
          ]);
        }}/>
      </div>

      <div className="grid grid-cols-[1fr,2fr,7rem] border-b text-xs md:text-sm text-muted-foreground">
        <p className="w-full px-3 py-1">Course</p>
        <p className="border-x w-full px-3 py-1">Term Completed</p>
        <p className="w-full text-center py-1">Credits</p>
      </div>

      <div className="grid grid-cols-[1fr,2fr,7rem] text-xs md:text-sm text-muted-foreground items-center">
        {ULCourses.map((course, i) => {
          const isCompleted = completedSemesters.some(sem => sem.term === course.semester.term && sem.year === course.semester.year);
          return (
            <Fragment key={i}>
              <p className={`w-full px-3 py-1 ${i !== ULCourses.length - 1 ? "border-b" : ""} ${isCompleted ? "bg-green-500/15 dark:bg-green-800/15" : ""}`}>
                {course.courseId}
              </p>
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

      <div className="grid grid-cols-[3fr,7rem] border-t text-xs md:text-sm text-muted-foreground">
        <p className="w-full px-3 py-1">Total Credits</p>
        <p className="w-full text-center py-1 border-l">
          {ULCourses.reduce((total, course) => total + course.credits, 0)}
        </p>
      </div>

      </div>
  )
}

export default UpperLevelConcentrationContainer