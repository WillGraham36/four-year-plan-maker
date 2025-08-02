import GenEdsContainer from '@/components/gen-eds/gen-eds-container';
import { RequirementsProvider } from '@/components/planner/requirements-context';
import { Semester } from '@/components/planner/semester'
import TotalCreditsContainer from '@/components/planner/total-credits-container';
import TransferCreditsContainer from '@/components/planner/transfer-credits-container';
import Year from '@/components/planner/year';
import YearsContainer from '@/components/planner/years-container';
import UpperLevelConcentrationContainer from '@/components/ul-concentration/ul-concentration';
import { getAllGenEds, getAllSemesters, getAllULCourses, getUserInfo } from '@/lib/api/planner/planner.server';
import { extractSemester } from '@/lib/utils';

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
    <main className='flex flex-col xl:flex-row items-center xl:items-start justify-between gap-4 mx-4'>
      <RequirementsProvider 
        initialGenEds={genEds} 
        initialULCourses={courses} 
        initialTotalCredits={totalCredits}
        userInfo={userInfo}
      >
        <div className='flex flex-col w-full mt-2 xl:w-[60%]'>
          <YearsContainer userInfo={userInfo} semesters={semesters} />
        </div>
        
        <div className='flex flex-col w-full gap-4 mt-2 xl:w-[40%]'>
          <TotalCreditsContainer />
          <GenEdsContainer />
          <UpperLevelConcentrationContainer concentration={concentration} />
          <TransferCreditsContainer courses={extractSemester(semesters, 'TRANSFER', -1)} />
        </div>
      </RequirementsProvider>
    </main>
  )
}

export default PlannerPage