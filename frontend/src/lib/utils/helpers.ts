import { OnboardingFormValues } from "@/components/onboarding/onboarding-form";
import { SemesterDateDescriptor, Term } from "./types";

// Helper to check if onboarding form has all required fields filled out and if transfer credits are valid
export const isFormValid = (formData: OnboardingFormValues): boolean => {
  const requiredFields = ['startTerm', 'startYear', 'endTerm', 'endYear', 'major'] as const;
  
  // Check if all required fields have values
  const hasRequiredFields = requiredFields.every(field => 
    formData[field] && formData[field].trim().length > 0
  );
  
  // Check transfer credits validation
  const transferCredits = formData.transferCredits;
  let transferCreditsValid = true;
  
  if (transferCredits && transferCredits.length > 0) {
    transferCreditsValid = transferCredits.every((credit: any) => {
      const hasName = credit.name && credit.name.trim().length > 0;
      const hasCourseId = credit.courseId && credit.courseId.trim().length > 0;
      
      // If either field has content, both must have content
      if (hasName || hasCourseId) {
        return hasName && hasCourseId;
      }
      
      // If both are empty, that's fine
      return true;
    });
  }
  
  return hasRequiredFields && transferCreditsValid;
};