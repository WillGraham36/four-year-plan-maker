'use client'
import { useState } from "react";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle
} from "@/components/ui/stepper"
import { Button } from "../ui/button";
import TranscriptUpload from "./transcript-upload";
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

const MultiStageOnboardingForm = ({ formInputs }: {formInputs?: OnboardingFormValues | null}) => {
  const [step, setStep] = useState<number>(formInputs ? 2 : 1);
  const [transcriptValues, setTranscriptValues] = useState<OnboardingFormValues | undefined>(formInputs || undefined);

  return (
    <main className="max-w-3xl mx-auto py-5 px-4 min-h-[calc(100vh-8.75rem)]">
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