import { RequirementsProvider } from "@/components/context/requirements-context";
import PageError from "@/components/layout/page-error";
import SessionRecovery from "@/components/layout/session-recovery";
import TabbedPlanner from "@/components/planner/tabbed-planner";
import { getCurrentSession } from "@/lib/api/auth/session.server";
import { getAllAcademicInfo } from "@/lib/api/planner/planner.server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "TerpPlanner | Planner",
};

const PlannerPage = async () => {
  const currentSession = await getCurrentSession();
  if (!currentSession.authenticated) {
    return <SessionRecovery title="Start or restore your planner" />;
  }

  if (!currentSession.onboarded) {
    redirect("/account/setup");
  }

  const { data: academicInfo } = await getAllAcademicInfo();
  if (!academicInfo) {
    return <PageError error={"Failed to load page"} />;
  }
  const {
    semesters,
    genEdRequirements,
    ULCourses: courses,
    userInfo,
  } = academicInfo;
  const concentration = courses?.concentration;

  const totalCredits = Object.values(semesters)
    .flat()
    .reduce((sum, course) => sum + course.credits, 0);

  return (
    <main className="mx-4 mt-2 min-h-[calc(100vh-9.25rem)] pb-24">
      <RequirementsProvider
        initialGenEdRequirements={genEdRequirements}
        initialULCourses={courses.courses}
        initialTotalCredits={totalCredits}
        userInfo={userInfo}
      >
        <TabbedPlanner
          userInfo={userInfo}
          semesters={semesters}
          concentration={concentration}
        />
      </RequirementsProvider>
    </main>
  );
};

export default PlannerPage;
