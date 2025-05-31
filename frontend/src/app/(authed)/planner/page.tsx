import GenEdsContainer from '@/components/gen-eds/gen-eds-container';
import Semester from '@/components/planner/semester'
import Year from '@/components/planner/year';
import { getAllGenEds, getAllSemesters } from '@/lib/api/planner/planner.server';
import { extractSemester } from '@/lib/utils';

const PlannerPage = async () => {
  const semesters = await getAllSemesters();
  const genEds = await getAllGenEds();
  console.log(genEds);

  return (
    <main className='flex flex-col xl:flex-row items-center xl:items-start justify-between gap-4 mx-4'>
      <div className='flex flex-col w-full mt-2 xl:w-[60%]'>
        <Year year={1}>
          <Semester term='FALL' year={2024} courses={extractSemester(semesters, 'FALL', 2024)} />
          <Semester term='SPRING' year={2025} courses={extractSemester(semesters, 'SPRING', 2025)} />
        </Year>

        <Year year={2}>
          <Semester term='FALL' year={2025} courses={extractSemester(semesters, 'FALL', 2025)} />
          <Semester term='SPRING' year={2026} courses={extractSemester(semesters, 'SPRING', 2026)} />
        </Year>

        <Year year={3}>
          <Semester term='FALL' year={2026} courses={extractSemester(semesters, 'FALL', 2026)} />
          <Semester term='SPRING' year={2027} courses={extractSemester(semesters, 'SPRING', 2027)} />
        </Year>

        <Year year={4}>
          <Semester term='FALL' year={2027} courses={extractSemester(semesters, 'FALL', 2027)} />
          <Semester term='SPRING' year={2028} courses={extractSemester(semesters, 'SPRING', 2028)} />
        </Year>
      </div>
      
      <div className='flex flex-col w-full mt-2 xl:w-[40%]'>
        <GenEdsContainer />
      </div>
    </main>
  )
}

export default PlannerPage