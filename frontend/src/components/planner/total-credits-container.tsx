'use client'
import React from 'react'
import SatisfiedCheck from '../ui/satisfied-check'
import { useRequirements } from './requirements-context'

const TotalCreditsContainer = () => {
  const { totalCredits } = useRequirements();

  return (
    <div className='w-full rounded-lg border bg-card shadow-md h-full flex items-center gap-2 p-2 px-3'>
      <SatisfiedCheck
          isChecked={totalCredits >= 120}
          message="You need at least 120 credits"
      />
      <p className="w-full font-semibold text-lg flex items-center">
        Total Credits: <span className='pl-2'> {totalCredits}</span>
      </p>
    </div>
  )
}

export default TotalCreditsContainer