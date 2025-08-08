import OnboardingForm from "@/components/onboarding/onboarding-form";
import TranscriptInput from "@/components/onboarding/transcript-input";
import { getOnboardingFormValues } from "@/lib/api/forms/onboarding-form.server";

const OnboardingPage = async () => {
  const initialValues = await getOnboardingFormValues();
  if(initialValues === null || initialValues === undefined) {
    return (
      <>
        <TranscriptInput />
        <OnboardingForm />
      </>
    )
  }

  return (
    <>
      <TranscriptInput />
      <OnboardingForm formInputs={initialValues} />
    </>
  )
}

export default OnboardingPage