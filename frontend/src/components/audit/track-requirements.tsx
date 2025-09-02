// TrackRequirements.tsx
'use client';
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
import { useState, useMemo } from "react";
import { useMajorRequirements } from '@/components/context/major-requirements-context';
import CourseRow from './course-row';
import { useCourseApi } from "@/lib/api/planner/planner.client";

export const tracks: { value: CsSpecializations; label: string }[] = [
  { value: "GENERAL", label: "General Track" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "QUANTUM", label: "Quantum Information" },
  { value: "CYBERSECURITY", label: "Cybersecurity" },
  { value: "ML", label: "Machine Learning" },
];

interface TrackRequirementProps {
  initialTrack: CsSpecializations | undefined;
}

const TrackRequirements = ({ initialTrack }: TrackRequirementProps) => {
  const { trackRequirements, currentTrack, updateTrack: updateContextTrack } = useMajorRequirements();
  const { updateUserTrack } = useCourseApi();

  const updateTrack = async (track: CsSpecializations) => {
    updateContextTrack(track); // Update context immediately
    const res = await updateUserTrack(track);
    if (!res.ok) {
      // Rollback if server update fails
      updateContextTrack(initialTrack);
    }
  };

  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5">
        <SatisfiedCheck
          isChecked={trackRequirements.allMet}
          uncheckedMessage="You have not met all track requirements"
          checkedMessage="You meet all track requirements!"
        />
        <p className="font-semibold text-base md:text-lg">
          Major Requirements
        </p>
        <Select
          value={currentTrack || ""}
          onValueChange={updateTrack}
        >
          <SelectTrigger className={cn(buttonVariants({ variant: "outline" }), "text-sm w-fit shadow-none ml-auto")}>
            {tracks.find((track) => track.value === currentTrack)?.label}
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
      
      {trackRequirements.requirements.length > 0 && (
        <div className="grid grid-cols-[3.5fr_1fr_1fr]">
          {trackRequirements.requirements.map((requirement) => (
            <CourseRow
              key={requirement.id}
              columns={[
                <span key={`track-${requirement.id}`}>{requirement.displayName}</span>,
                <span key={`track-${requirement.id}-progress`} className="text-center w-full">
                  {requirement.progress ? (
                    <><strong>{requirement.progress.current}</strong> / <strong>{requirement.progress.total}</strong></>
                  ) : (
                    requirement.completed ? "✓" : "✗"
                  )}
                </span>,
                <span key={`track-${requirement.id}-courses`} className="text-center w-full">
                  {requirement.courses?.join(", ") || requirement.details || (requirement.completed ? "Complete" : "Incomplete")}
                </span>
              ]}
              completed={requirement.completed}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TrackRequirements;