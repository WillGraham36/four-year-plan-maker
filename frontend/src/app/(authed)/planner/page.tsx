import { RequirementsProvider } from '@/components/context/requirements-context';
import TabbedPlanner from '@/components/planner/tabbed-planner'; // Update import path as needed
import { getAllGenEds, getAllSemesters, getAllULCourses, getUserInfo } from '@/lib/api/planner/planner.server';

const PlannerPage = async () => {
  const [semesters, genEds, { concentration, courses }, { data: userInfo }] = await Promise.all([
    getAllSemesters(),
    getAllGenEds(),
    getAllULCourses(),
    getUserInfo()
  ]);

  const totalCredits = Object.values(semesters)
    .flat()
    .reduce((sum, course) => sum + course.credits, 0);

  return (
    <main className='mx-4 mt-2'>
      <RequirementsProvider
        initialGenEds={genEds}
        initialULCourses={courses}
        initialTotalCredits={totalCredits}
        userInfo={userInfo}
      >
        <TabbedPlanner
          userInfo={userInfo}
          semesters={semesters}
          genEds={genEds}
          concentration={concentration}
          ulCourses={courses}
          totalCredits={totalCredits}
        />
      </RequirementsProvider>
    </main>
  )
}

export default PlannerPage;