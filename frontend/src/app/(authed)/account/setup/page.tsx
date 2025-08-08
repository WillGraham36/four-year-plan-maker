import MultiStageOnboardingForm from "@/components/onboarding/multi-onboarding-form";
import OnboardingForm from "@/components/onboarding/onboarding-form";
import { getOnboardingFormValues } from "@/lib/api/forms/onboarding-form.server";

const OnboardingPage = async () => {
  const initialValues = await getOnboardingFormValues();
  if(initialValues === null || initialValues === undefined) {
    return (
      <MultiStageOnboardingForm />
    )
  }

  // If user already has onboarding data, skip transcript upload
  return (
    <>
      <OnboardingForm formInputs={initialValues} />
    </>
  )
}

export default OnboardingPage