'use client';
import { Course } from "@/lib/utils/types";
import { CsSpecializations } from "../onboarding/onboarding-form";
import { SemesterHeaderText } from "../planner/semester";
import SatisfiedCheck from "../ui/satisfied-check";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CybersecurityTrackRequirements, DataScienceTrackRequirements, GeneralTrackRequirements, MachineLearningTrackRequirements, QuantumTrackRequirements, tracks } from "./all-track-requirements";


interface TrackRequirementProps {
  track: CsSpecializations | undefined;
  courses: (Course & { semester: string; })[];
}

const TrackRequirements = ({ track, courses }: TrackRequirementProps) => {
  const [selectedTrack, setSelectedTrack] = useState<CsSpecializations | undefined>(track);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5">
        <SatisfiedCheck
          isChecked={isComplete}
          uncheckedMessage="You have not met all track requirements"
          checkedMessage="You meet all track requirements!"
        />
        <p className="font-semibold text-base md:text-lg">
          Track Course Requirements
        </p>
        <Select
          value={selectedTrack || ""}
          onValueChange={(value) => setSelectedTrack(value as CsSpecializations)}
          defaultValue={track}
        >
          <SelectTrigger className={cn(buttonVariants({ variant: "outline" }), "text-sm w-fit shadow-none ml-auto")}>
            {tracks.find((track) => track.value === selectedTrack)?.label}
          </SelectTrigger>
          <SelectContent>
            {tracks.map((track) => (
              <SelectItem key={track.value} value={track.value}>
                {track.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SemesterHeaderText>
      {selectedTrack === "GENERAL" && <GeneralTrackRequirements courses={courses} setIsComplete={setIsComplete} />}
      {selectedTrack === "CYBERSECURITY" && <CybersecurityTrackRequirements courses={courses} setIsComplete={setIsComplete} />}
      {selectedTrack === "DATA_SCIENCE" && <DataScienceTrackRequirements courses={courses} setIsComplete={setIsComplete} />}
      {selectedTrack === "QUANTUM" && <QuantumTrackRequirements courses={courses} setIsComplete={setIsComplete} />}
      {selectedTrack === "ML" && <MachineLearningTrackRequirements courses={courses} setIsComplete={setIsComplete} />}

    </div>
  )
}

export default TrackRequirements