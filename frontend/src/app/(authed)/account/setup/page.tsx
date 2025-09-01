import MultiStageOnboardingForm from "@/components/onboarding/multi-onboarding-form";
import { getOnboardingFormValues } from "@/lib/api/forms/onboarding-form.server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TerpPlanner | Account Setup",
};

const OnboardingPage = async () => {
  const initialValues = await getOnboardingFormValues();

  return (
    <MultiStageOnboardingForm formInputs={initialValues} />
  )
}

export default OnboardingPage