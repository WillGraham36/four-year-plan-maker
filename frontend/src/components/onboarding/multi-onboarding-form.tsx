'use client'
import { useState } from "react";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle
} from "@/components/ui/stepper"
import { AlertCircleIcon, Check, ImageUpIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { FileWithPreview, useFileUpload } from "@/hooks/use-file-upload"
import { ExtractedTextValues, parseTranscript } from "@/lib/api/forms/parse-transcript";
import Link from "next/link";
import { Button } from "../ui/button";
import TranscriptUpload, { ExtractedCompletedCourse } from "./transcript-upload";
import OnboardingForm, { OnboardingFormValues } from "./onboarding-form";

const steps = [
  {
    step: 1,
    title: "Upload Transcript",
  },
  {
    step: 2,
    title: "Verify Information",
  },
];

const MultiStageOnboardingForm = () => {
  const [step, setStep] = useState(1);
  const [transcriptValues, setTranscriptValues] = useState<OnboardingFormValues | undefined>(undefined);
  const [completedCourses, setCompletedCourses] = useState<ExtractedCompletedCourse[]>([]);

  return (
    <main className="max-w-3xl mx-auto py-5 px-4">
      <Stepper value={step}>
        {steps.map(({ step, title }) => (
          <StepperItem
            key={step}
            step={step}
            className="relative flex-1 flex-col! gap-1.5"
          >
            <StepperIndicator />
            <StepperTitle>{title}</StepperTitle>
            {step < steps.length && (
              <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
            )}
          </StepperItem>
        ))}
      </Stepper>

      {step === 1 && (
        <TranscriptUpload 
          incrementStep={() => setStep(step + 1)} 
          setTranscriptValues={setTranscriptValues}
          setCompletedCourses={setCompletedCourses}
        />
      )}
      {step == 2 && (
        <>
          <p className="text-center mb-4 space-y-2 mt-10">
            Double check any information and update any fields that are incorrect
          </p>
          <hr />
          <OnboardingForm
            formInputs={transcriptValues}
            backButton={<Button variant="outline" className="w-30" onClick={() => setStep(step - 1)}>Back</Button>}
          />
        </>
      )}

    </main>
  )
}

export default MultiStageOnboardingForm