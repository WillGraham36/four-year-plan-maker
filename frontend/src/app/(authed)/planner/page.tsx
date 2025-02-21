import Semester from '@/components/planner/semester'
import React from 'react'

const PlannerPage = () => {
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