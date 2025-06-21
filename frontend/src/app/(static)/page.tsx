import Navbar from '@/components/layout/navbar'
import OnboardingForm from '@/components/onboarding/onboarding-form'
import React from 'react'

const HomePage = async () => {
  const formInputs = {
    startTerm: "spring",
    startYear: "2023",
    endTerm: "summer",
    endYear: "2026",
    major: "Computer Science",
    minor: "African Studies Minor",
    transferCredits: [
      {
        name: "ap psych",
        courseId: "PSYC100"
      },
      {
        name: "at calc",
        courseId: "MATH140"
      }
    ]
  };

  return (
    <>
      <div>
        <OnboardingForm formInputs={formInputs} />
      </div>
    </>
  );
}

export default HomePage