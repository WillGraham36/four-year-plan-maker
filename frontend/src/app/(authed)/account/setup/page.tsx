import OnboardingForm from "@/components/onboarding/onboarding-form";
import { getOnboardingFormValues } from "@/lib/api/forms/onboarding-form.server";

const OnboardingPage = async () => {
  const initialValues = await getOnboardingFormValues();
  if(initialValues === null || initialValues === undefined) {
    return (
      <OnboardingForm />
    )
  }

  return (
    <OnboardingForm formInputs={initialValues} />
  )
}

export default OnboardingPage