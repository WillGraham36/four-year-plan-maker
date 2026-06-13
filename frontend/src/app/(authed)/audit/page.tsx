import ChartsContainer from '@/components/audit/charts/charts-container';
import { ChartsInfoProvider } from '@/components/audit/charts/charts-context';
import { RequirementsProvider } from '@/components/context/requirements-context';
import { MajorRequirementsProvider } from '@/components/context/major-requirements-context';
import { getAllAcademicInfo } from '@/lib/api/planner/planner.server'
import { Course } from '@/lib/utils/types';
import React from 'react'
import ResponsiveAuditLayout from '@/components/audit/audit-tabs';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import PageError from '@/components/layout/page-error';
import GuestAuditLock from '@/components/audit/guest-audit-lock';
import SessionRecovery from '@/components/layout/session-recovery';
import { getCurrentSession } from '@/lib/api/auth/session.server';

export const metadata: Metadata = {
  title: "TerpPlanner | Audit",
};

const formatSemester = (semesterName: string): string => {
  // Extract term and year using regex
  const match = semesterName.match(/Semester\(term=(\w+), year=(-?\d+)\)/);
  if (!match) return semesterName; // fallback if format doesn't match
  
  const [, term, year] = match;
  
  if (term === 'TRANSFER') {
    return 'Transfer Credit';
  }
  
  // Capitalize first letter and lowercase the rest
  const formattedTerm = term.charAt(0) + term.slice(1).toLowerCase();
  return `${formattedTerm} ${year}`;
};

const AuditPage = async () => {
  const currentSession = await getCurrentSession();
  if (!currentSession.authenticated) {
    return <SessionRecovery title="Sign in or start a guest planner" />;
  }

  if (currentSession.guest) {
    return <GuestAuditLock />;
  }

  if (!currentSession.onboarded) {
    redirect("/account/setup");
  }

  const { data: academicInfo } = await getAllAcademicInfo();
  if (!academicInfo) {
    return <PageError error={"Failed to load page"} />;
  }
  const { semesters, genEdRequirements, ULCourses: courses, userInfo } = academicInfo;
  
  const allCourses = Object.entries(semesters)
    .flatMap(([semesterName, courses]) => 
      courses.map(course => ({ ...course, semester: formatSemester(semesterName) }))
    ) as (Course & { semester: string })[];

  const totalCredits = Object.values(semesters)
    .flat()
    .reduce((sum, course) => sum + course.credits, 0);
  return (
    <main className='mx-4 flex flex-col gap-4 mt-4 mb-8 min-h-[calc(100vh-8.75rem)]'>
      <RequirementsProvider 
        initialGenEdRequirements={genEdRequirements} 
        initialULCourses={courses.courses} 
        initialTotalCredits={totalCredits}
        userInfo={userInfo}
        redirectIfNotCS={true}
      >
        <MajorRequirementsProvider 
          courses={allCourses}
          userTrack={userInfo?.track}
          completedSemesters={userInfo?.completedSemesters || []}
        >
          <ChartsInfoProvider allCourses={allCourses}>
            <section>
              <ChartsContainer />
            </section>
            <ResponsiveAuditLayout
              concentration={courses.concentration}
              semesters={semesters}
              initialTrack={userInfo?.track}
            />
          </ChartsInfoProvider>
        </MajorRequirementsProvider>
      </RequirementsProvider>
    </main>
  )
}

export default AuditPage;
