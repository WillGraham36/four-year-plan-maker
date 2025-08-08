'use client';

import { FileWithPreview, useFileUpload } from "@/hooks/use-file-upload";
import { parseTranscript } from "@/lib/api/forms/parse-transcript";
import { useState } from "react";
import { Button } from "../ui/button";
import { AlertCircleIcon, Check, ImageUpIcon, LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { OnboardingFormValues } from "./onboarding-form";
import { Term } from "@/lib/utils/types";

const maxSizeMB = 10
const maxSize = maxSizeMB * 1024 * 1024 // 5MB default

export type ExtractedCompletedCourse = {
  term: Term;
  year: number;
  courseId: string;
}

interface TranscriptUploadProps {
  incrementStep: () => void;
  setTranscriptValues: (values: OnboardingFormValues | undefined) => void;
  setCompletedCourses: (courses: ExtractedCompletedCourse[]) => void;
}

const TranscriptUpload = ({ incrementStep, setTranscriptValues, setCompletedCourses }: TranscriptUploadProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (files: FileWithPreview[]) => {
    setLoading(true);
    setError(null);
    const values = await parseTranscript(files[0].file as File);
    if(values.error) {
      setError(values.error);
      removeFile(files[0].id);
    }
    console.log(values);

    const completedCourses = values.parsed?.completedCourses.map(course => ({
      term: course.term.toUpperCase() as Term,
      year: course.year,
      courseId: course.courseId,
    }));
    setCompletedCourses(completedCourses || []);

    // Helper to transform names like "AP HUMAN GEOG" to "AP Human Geog"
    function formatCourseName(name: string): string {
      return name
      .split(" ")
      .map(word =>
        word.length <= 2
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");
    }

    const transcriptValues: OnboardingFormValues = {
      startTerm: (values.parsed?.startTerm?.toLowerCase() as Term) || "",
      endTerm: (values.parsed?.endTerm?.toLowerCase() as Term) || "",
      startYear: values.parsed?.startYear?.toString() || "",
      endYear: values.parsed?.endYear?.toString() || "",
      major: values.parsed?.major || "",
      minor: "",
      transferCredits: values.parsed?.transferCredits.map(credit => ({
      name: formatCourseName(credit.name),
      courseId: credit.courseId,
      genEds: credit.genEds,
      })) || [{ name: "", courseId: "", genEds: "" }]
    };
    setTranscriptValues(transcriptValues);


    setLoading(false);
  }

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: "application/pdf",
    maxSize,
    multiple: false,
    onFilesAdded: handleFileUpload,
  })

  
  return (
    <section className="mt-10">
        <div className="text-center mb-8 space-y-2">
          <p>Upload the PDF version of your unofficial transcript to autofill values or click next to skip this step</p>
          <p>You can find your transcript <Link href={"https://app.testudo.umd.edu/main/uotrans"} target="_blank" className="underline">here</Link>, click <span className="font-semibold bg-card p-1 px-1.5 rounded-lg">Print this Document</span> in the top right corner</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative">
            {/* Drop area */}
            <div
              role="button"
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-dragging={isDragging || undefined}
              className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none has-[input:focus]:ring-[3px]"
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload file"
              />
              {loading ? (
                <LoaderCircleIcon
                  className="animate-spin text-primary"
                  size={24}
                  aria-hidden="true"
                />
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                  <div
                    className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    {files.length > 0 ? <Check className="size-5 text-green-500"/> : <ImageUpIcon className="size-4 opacity-60" />}
                  </div>
                  <p className="mb-1.5 text-sm font-medium">
                    {files.length > 0 ? files[0].file.name : "Drag and drop your transcript PDF here or click to select"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Max size: {maxSizeMB}MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {errors.length > 0 && (
            <div
              className="text-destructive flex items-center gap-1 text-xs"
              role="alert"
            >
              <AlertCircleIcon className="size-3 shrink-0" />
              <span>{errors[0]}</span>
            </div>
          )}
          {error && (
            <div
              className="text-destructive flex items-center gap-1 text-xs"
              role="alert"
            >
              <AlertCircleIcon className="size-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button 
            onClick={incrementStep}
            disabled={loading}
            className="mt-2"
          >
            Next
          </Button>
        </div>
      </section>
  )
}

export default TranscriptUpload