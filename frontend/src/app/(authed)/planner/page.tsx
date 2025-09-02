import { RequirementsProvider } from '@/components/context/requirements-context';
import PageError from '@/components/layout/page-error';
import TabbedPlanner from '@/components/planner/tabbed-planner';
import { getAllAcademicInfo } from '@/lib/api/planner/planner.server';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "TerpPlanner | Planner",
};

const PlannerPage = async () => {
  const { data: academicInfo } = await getAllAcademicInfo();
  if (!academicInfo) {
    return <PageError />;
  }
  const { semesters, genEds, ULCourses: courses, userInfo } = academicInfo;
  const concentration = courses?.concentration;
  
  const totalCredits = Object.values(semesters)
    .flat()
    .reduce((sum, course) => sum + course.credits, 0);

  return (
    <main className='mx-4 mt-2 min-h-[calc(100vh-9.25rem)]'>
      <RequirementsProvider
        initialGenEds={genEds}
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
  )
}

export default PlannerPage;