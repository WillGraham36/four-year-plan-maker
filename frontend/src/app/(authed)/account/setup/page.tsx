import MultiStageOnboardingForm from "@/components/onboarding/multi-onboarding-form";
import SessionRecovery from "@/components/layout/session-recovery";
import { getCurrentSession } from "@/lib/api/auth/session.server";
import { getOnboardingFormValues } from "@/lib/api/forms/onboarding-form.server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TerpPlanner | Account Setup",
};

const OnboardingPage = async () => {
  const currentSession = await getCurrentSession();
  if (!currentSession.authenticated) {
    return (
      <SessionRecovery
        title="Set up your planner"
        description="Start as a guest or sign in before uploading a transcript and saving your academic plan."
      />
    );
  }

  const initialValues = await getOnboardingFormValues();

  return (
    <MultiStageOnboardingForm formInputs={initialValues} />
  )
}

export default OnboardingPage
