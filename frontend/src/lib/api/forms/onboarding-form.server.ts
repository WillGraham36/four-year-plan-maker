'use server';
import { OnboardingFormValues } from "@/components/onboarding/onboarding-form"
import { Course, Term } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";
import { OnboardingFormInitialValuesSchema } from "@/lib/utils/schemas";

type TransferCreditWithDetails = Omit<
  NonNullable<OnboardingFormValues["transferCredits"]>[number],
  "courseId"
> & {
  course: Course;
  semester: {
    term: Term | "TRANSFER";
    year: number;
  };
  genEdOverrides: string[][];
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

export const getOnboardingFormValues = async () => {
  const response = await fetchWithAuth("v1/onboarding");
  if(response.data === null || response.data === undefined || !response.ok) {
    return null;
  }

  const sanitizedData = sanitizeTransferCredits(response.data);

  const parsed = OnboardingFormInitialValuesSchema.safeParse(sanitizedData);
  if(!parsed.success) {
    return null;
  }
  return {
    ...parsed.data,
    startTerm: parsed.data.startTerm.toLowerCase(),
    endTerm: parsed.data.endTerm.toLowerCase(),
  } as OnboardingFormValues;
}

function sanitizeTransferCredits(data: any) {
  return {
    ...data,
    transferCredits: data.transferCredits?.map((tc: any) => ({
      name: tc.name,
      courseId: tc.course?.courseId ?? "", // extract courseId from nested course object
    })),
  };
}