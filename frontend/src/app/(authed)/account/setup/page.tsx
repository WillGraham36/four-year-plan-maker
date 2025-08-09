import MultiStageOnboardingForm from "@/components/onboarding/multi-onboarding-form";
import OnboardingForm from "@/components/onboarding/onboarding-form";
import { getOnboardingFormValues } from "@/lib/api/forms/onboarding-form.server";

const OnboardingPage = async () => {
  const initialValues = await getOnboardingFormValues();

  return (
    <MultiStageOnboardingForm formInputs={initialValues} />
  )
}

export default OnboardingPage