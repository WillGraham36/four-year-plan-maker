'use client'
import { SemesterHeaderText } from '@/components/planner/semester'
import React from 'react'
import TotalsBarChart from './totals-bar-chart'
import DegreeChart from './degree-chart'

const ChartsContainer = () => {
  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5 md:text-lg font-bold">
        Total Completion Status
      </SemesterHeaderText>

      <div className='flex flex-row h-96 w-full'>
        <DegreeChart />
        <TotalsBarChart />
      </div>
    </div>
  )
}

export default ChartsContainer