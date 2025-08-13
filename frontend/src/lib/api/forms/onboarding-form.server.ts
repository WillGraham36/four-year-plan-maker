'use server';
import { CsSpecializations, OnboardingFormValues } from "@/components/onboarding/onboarding-form"
import { Course, CustomServerResponse, Term } from "@/lib/utils/types";
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
  track: CsSpecializations | undefined;
};

export const submitOnboardingForm = async (formData: SubmitOnboardingFormProps): Promise<CustomServerResponse<string>> => {
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
    return {
      ok: false,
      message: "Failed to submit onboarding form",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Successfully submitted onboarding form",
    data: "Successfully submitted onboarding form",
  };
}

export const getOnboardingFormValues = async () => {
  const response = await fetchWithAuth("v1/onboarding");
  if(response.data === null || response.data === undefined || !response.ok) {
    return null;
  }
  const sanitizedData = sanitizeTransferCredits(response.data);
  
  const parsed = OnboardingFormInitialValuesSchema.safeParse({...sanitizedData, csSpecialization: sanitizedData.track});
  if(!parsed.success) {
    console.error("Failed to parse onboarding form data:", parsed.error);
    return null;
  }
  if(parsed.data.transferCredits?.length === 0) {
    parsed.data.transferCredits = [
        { name: "", courseId: "", genEdOverrides: undefined },
      ];
  }
  return {
    ...parsed.data,
    minor: parsed.data.minor ?? "",
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