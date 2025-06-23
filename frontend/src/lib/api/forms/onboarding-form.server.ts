'use server';
import { OnboardingFormValues } from "@/components/onboarding/onboarding-form"
import { Course, Term } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";

type TransferCreditWithDetails = Omit<
  NonNullable<OnboardingFormValues["transferCredits"]>[number],
  "courseId"
> & {
  course: Course;
  semester: {
    term: Term | "TRANSFER";
    year: number;
  };
};

export type SubmitOnboardingFormProps = Omit<OnboardingFormValues, "transferCredits"> & {
  transferCredits: TransferCreditWithDetails[];
};

export const submitOnboardingForm = async (formData: SubmitOnboardingFormProps) => {
  const response = await fetchWithAuth("v1/onboarding", {
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    }
  })

  if (!response.ok) {
    return ("Failed to submit onboarding form");
  }

  return response.message;
}