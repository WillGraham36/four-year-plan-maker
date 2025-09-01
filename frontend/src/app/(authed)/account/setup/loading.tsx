import React from 'react'
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle
} from "@/components/ui/stepper"
import { Skeleton } from "@/components/ui/skeleton";

const OnboardingLoadingPage = () => {
    return (
    <div className="max-w-3xl mx-auto py-5 px-4 min-h-[calc(100vh-8.75rem)] flex flex-col gap-3.5">
      <Stepper value={1}>
        <StepperItem
          step={1}
          className="relative flex-1 flex-col! gap-1.5"
        >
          <StepperIndicator />
          <StepperTitle>Upload Transcript</StepperTitle>
          <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
        </StepperItem>
        <StepperItem
          step={2}
          className="relative flex-1 flex-col! gap-1.5"
        >
          <StepperIndicator />
          <StepperTitle>Verify Information</StepperTitle>
        </StepperItem>
      </Stepper>

      <Skeleton className="w-full h-20 mt-6" />
      <Skeleton className="w-full h-52" />
      <Skeleton className="w-full h-10" />
    </div>
  )
}

export default OnboardingLoadingPage