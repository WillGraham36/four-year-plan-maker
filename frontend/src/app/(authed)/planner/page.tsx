import Semester from '@/components/planner/semester'
import { getAllGenEds, getAllSemesters } from '@/lib/api/planner/planner.server';
import { extractSemester } from '@/lib/utils';
import React from 'react'

const PlannerPage = async () => {
  const semesters = await getAllSemesters();
  // const genEds = await getAllGenEds();
  // console.log(genEds);

  return (
    <main>
      <div className='grid lg:w-max grid-cols-1 lg:grid-cols-2 w-full max-lg:justify-items-center '>
        <Semester term='FALL' year={2024} courses={extractSemester(semesters, 'FALL', 2024)} />
        <Semester term='SPRING' year={2025} courses={extractSemester(semesters, 'SPRING', 2025)} />

        <Semester term='FALL' year={2025} courses={extractSemester(semesters, 'FALL', 2025)} />
        <Semester term='SPRING' year={2026} courses={extractSemester(semesters, 'SPRING', 2026)} />

        <Semester term='FALL' year={2026} courses={extractSemester(semesters, 'FALL', 2026)} />
        <Semester term='SPRING' year={2027} courses={extractSemester(semesters, 'SPRING', 2027)} />

        <Semester term='FALL' year={2027} courses={extractSemester(semesters, 'FALL', 2027)} />
        <Semester term='SPRING' year={2028} courses={extractSemester(semesters, 'SPRING', 2028)} />
      </div>
    </main>
  )
}

export default PlannerPage