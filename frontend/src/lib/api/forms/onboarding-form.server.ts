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
  console.log("Response form data:", response.data.transferCredits[0].genEdOverrides);

  const parsed = OnboardingFormInitialValuesSchema.safeParse(sanitizedData);
  if(!parsed.success) {
    console.error("Failed to parse onboarding form data:", parsed.error);
    return null;
  }
  console.log({
    ...parsed.data,
    startTerm: parsed.data.startTerm.toLowerCase(),
    endTerm: parsed.data.endTerm.toLowerCase(),
    transferCredits: parsed.data.transferCredits?.map((tc) => ({
      ...tc,
      genEds: transformGenEdOverrides(tc.genEdOverrides),
    }))
  });
  return {
    ...parsed.data,
    startTerm: parsed.data.startTerm.toLowerCase(),
    endTerm: parsed.data.endTerm.toLowerCase(),
    transferCredits: parsed.data.transferCredits?.map((tc) => ({
      ...tc,
      genEds: transformGenEdOverrides(tc.genEdOverrides),
    }))
  } as OnboardingFormValues;
}

function transformGenEdOverrides(genEdOverrides: string[][] | undefined | null): string {
  if(!genEdOverrides || genEdOverrides.length === 0) {
    return "";
  }

  return genEdOverrides
    .map((group) => group.join(", "))
    .join(" or ");
}

function sanitizeTransferCredits(data: any) {
  return {
    ...data,
    transferCredits: data.transferCredits?.map((tc: any) => ({
      ...tc,
      courseId: tc.course?.courseId ?? "", // extract courseId from nested course object
    })),
  };
}