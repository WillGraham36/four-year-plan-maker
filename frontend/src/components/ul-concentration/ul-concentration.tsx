'use client';
import { useRequirements } from "../planner/requirements-context";
import { ULCCombobox } from "./concentration-combobox";
import { Fragment, useState } from "react";


interface ULCProps {
  concentration: string;
}

const UpperLevelConcentrationContainer = ({
  concentration: initialConcentration = "",
}: ULCProps) => {
  const [concentration, setConcentration] = useState<string>(initialConcentration);
  const { ULCourses, refreshULCourses } = useRequirements();


  return (
    <div className="flex flex-col rounded-lg border w-full h-min overflow-hidden bg-card shadow-md">
      <div className="flex items-center justify-between w-full border-b p-2 px-3">
        <p className="text-sm md:text-base">
          Upper Level Concentration
        </p>
        <ULCCombobox value={concentration} setValueStateAction={(newConcentration) => {
          setConcentration(newConcentration);
          refreshULCourses();
        }}/>
      </div>

      <div className="grid grid-cols-[1fr,2fr,5rem] border-b text-xs md:text-sm text-muted-foreground">
        <p className="w-full px-3 py-1">Course</p>
        <p className="border-x w-full px-3 py-1">Term Completed</p>
        <p className="w-full text-center py-1">Credits</p>
      </div>

      <div className="grid grid-cols-[1fr,2fr,5rem] text-xs md:text-sm text-muted-foreground items-center">
        {ULCourses.map((course, i) => (
          <Fragment key={i}>
            <p className={`w-full px-3 py-1 ${i !== ULCourses.length - 1 ? "border-b" : ""}`}>
              {course.course.name}
            </p>
            <p className={`border-x w-full h-full flex items-center px-3 py-1 ${i !== ULCourses.length - 1 ? "border-b" : ""}`}>
              {course.semester.term} {course.semester.year}
            </p>
            <p className={`w-full py-1 h-full flex items-center justify-center ${i !== ULCourses.length - 1 ? "border-b" : ""}`}>
              {course.course.credits}
            </p>
          </Fragment>
        ))}

        {ULCourses.length === 0 && (
          <p className="col-span-3 text-center py-2">No courses found for this concentration</p>
        )}
      </div>

      </div>
  )
}

export default UpperLevelConcentrationContainer