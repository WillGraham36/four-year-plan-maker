import Semester from '@/components/planner/semester'
import React from 'react'

const PlannerPage = async () => {
  // await saveSemester([
  //   {
  //     courseId: "CSCI101",
  //     name: "Introduction to Computer Science",
  //     description: "An introduction to the field of computer science.",
  //     credits: 4,
  //     genEds: [["FSAW"]],
  //     preReqs: [],
  //   },
  //   {
  //     courseId: "MATH101",
  //     name: "Calculus I",
  //     description: "An introduction to calculus.",
  //     credits: 4,
  //     genEds: [["FSAW"]],
  //     preReqs: [],
  //   },
  // ]);
  // await getSemesterCourses({ term: "FALL", year: 2026 });
  return (
    <main>
      <div className='grid grid-cols-2 w-max'>
        <Semester term='FALL' year={2024} />
        <Semester term='SPRING' year={2025} />

        <Semester term='FALL' year={2025} />
        <Semester term='SPRING' year={2026} />

        <Semester term='FALL' year={2026} />
        <Semester term='SPRING' year={2027} />

        <Semester term='FALL' year={2027} />
        <Semester term='SPRING' year={2028} />
      </div>
    </main>
  )
}

export default PlannerPage