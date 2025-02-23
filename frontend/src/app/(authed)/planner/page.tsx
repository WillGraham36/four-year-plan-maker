import Semester from '@/components/planner/semester'
import { getSemesterCourses, saveSemester } from '@/lib/api/planner/planner.client'
import { fetchWithAuth } from '@/lib/api/server'
import React from 'react'

const PlannerPage = async () => {
  await saveSemester([
    {
      courseId: "CSCI101",
      name: "Introduction to Computer Science",
      description: "An introduction to the field of computer science.",
      credits: 4,
      genEds: [["FSAW"]],
      preReqs: [],
    },
    {
      courseId: "MATH101",
      name: "Calculus I",
      description: "An introduction to calculus.",
      credits: 4,
      genEds: [["FSAW"]],
      preReqs: [],
    },
  ]);
  await getSemesterCourses({ term: "FALL", year: 2026 });
  return (
    <main>
      <div className='grid grid-cols-2 w-max'>
        <Semester />
        <Semester />
        <Semester />
        <Semester />
        <Semester />
        <Semester />
        <Semester />
        <Semester />
      </div>
    </main>
  )
}

export default PlannerPage