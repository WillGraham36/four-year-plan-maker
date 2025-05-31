'use client';
import { Course, Term } from "@/lib/utils/types";
import { ULCCombobox } from "./concentration-combobox";
import { useState } from "react";


interface ULCProps {
  concentration: string;
  courses: (Course & Term)[];
}

const UpperLevelConcentrationContainer = () => {
  const [concentration, setConcentration] = useState<string>("");


  return (
    <div className="flex flex-col rounded-lg border w-full h-min overflow-hidden bg-card shadow-md">
      <div className="flex items-center justify-between w-full border-b p-2 px-3">
        <p className="text-sm md:text-base">
          Upper Level Concentration
        </p>
        <ULCCombobox value={concentration} setValueStateAction={setConcentration}/>
      </div>

      <div className="grid grid-cols-[1fr,2fr,3.5rem] border-b text-xs md:text-sm text-muted-foreground">
        <p className="w-full px-3 py-1">Course</p>
        <p className="border-x w-full px-3 py-1">Term Completed</p>
        <p className="w-full text-center py-1">Credits</p>
      </div>

        
      </div>
  )
}

export default UpperLevelConcentrationContainer