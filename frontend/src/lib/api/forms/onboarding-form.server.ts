'use server';
import { ZodError } from "zod";
import type { OnboardingFormValues } from "@/components/onboarding/onboarding-form"
import type { CustomServerResponse } from "@/lib/utils/types";
import { clearPendingGuestMarker } from "../auth/guest-session";
import { OnboardingFormInitialValuesSchema } from "@/lib/utils/schemas";
import { requireUserId } from "@/server/auth/current-session";
import { getOnboarding, saveOnboarding } from "@/server/services/onboarding-service";
import { findOrFetchCourses } from "@/server/services/course-service";
import { onboardingSchema, onboardingSubmissionSchema, coursePlacementsSchema } from "@/server/validation/domain";

type FieldError = {
  path: `transferCredits.${number}.courseId` | `transferCredits.${number}.genEds` | `completedCourses.${number}.courseId`;
  message: string;
};

type SubmitResult = CustomServerResponse<string> & { fieldErrors?: FieldError[] };

export const submitOnboardingForm = async (formData: OnboardingFormValues): Promise<SubmitResult> => {
  try {
    const userId = await requireUserId();
    const input = onboardingSubmissionSchema.parse(formData);
    const courses = await findOrFetchCourses([
      ...input.transferCredits.map((credit) => credit.courseId),
      ...input.completedCourses.map((course) => course.courseId),
    ]);
    const fieldErrors: FieldError[] = [];
    const transfers = input.transferCredits.map((credit, index) => {
      const course = courses.get(credit.courseId);
      const genEdOverrides = credit.genEds
        .split("OR")
        .map((group) => group.split(",").map((token) => token.trim()).filter(Boolean))
        .filter((group) => group.length > 0);
      if (!course) {
        fieldErrors.push({ path: `transferCredits.${index}.courseId`, message: "Course could not be found" });
      } else if (!genEdOverrides.every((group) => course.genEds.some((option) => group.every((token) => option.includes(token))))) {
        fieldErrors.push({ path: `transferCredits.${index}.genEds`, message: "Gen Eds do not match any available options for this course" });
      }
      return { name: credit.name, course, semester: { term: "TRANSFER", year: -1 }, genEdOverrides };
    });
    const semesterIndexes = new Map<string, number>();
    const placements = input.completedCourses.map((entry, index) => {
      const course = courses.get(entry.courseId);
      if (!course) fieldErrors.push({ path: `completedCourses.${index}.courseId`, message: "Course could not be found" });
      const key = `${entry.term}-${entry.year}`;
      const placementIndex = semesterIndexes.get(key) ?? 0;
      semesterIndexes.set(key, placementIndex + 1);
      return { course, semester: { term: entry.term, year: entry.year }, index: placementIndex };
    });
    if (fieldErrors.length) return { ok: false, message: "Please check the highlighted courses", data: null, fieldErrors };
    await saveOnboarding(userId, onboardingSchema.parse({
      ...input,
      track: input.csSpecialization,
      transferCredits: transfers,
    }), coursePlacementsSchema.parse(placements));
    await clearPendingGuestMarker();
    return { ok: true, message: "Successfully submitted onboarding form", data: "Successfully submitted onboarding form" };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: FieldError[] = [];
      for (const issue of error.issues) {
        const [collection, index, field] = issue.path;
        if (typeof index !== "number") continue;
        if (collection === "transferCredits" && (field === "courseId" || field === "genEds")) {
          fieldErrors.push({ path: `transferCredits.${index}.${field}`, message: issue.message });
        } else if (collection === "completedCourses" && field === "courseId") {
          fieldErrors.push({ path: `completedCourses.${index}.courseId`, message: issue.message });
        }
      }
      return { ok: false, message: "Please check your onboarding information", data: null, fieldErrors };
    }
    console.error("Failed to submit onboarding form", error);
    return { ok: false, message: "Failed to submit onboarding form", data: null };
  }
};

export const getOnboardingFormValues = async () => {
  let data;
  try {
    data = await getOnboarding(await requireUserId());
  } catch (error) {
    console.error("Failed to fetch onboarding form data", error);
    return null;
  }
  if(data === null || data === undefined) {
    return null;
  }
  const sanitizedData = sanitizeTransferCredits(data);
  
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
