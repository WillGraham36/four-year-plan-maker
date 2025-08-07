import { Skeleton } from '@/components/ui/skeleton';
import { ChevronUp } from 'lucide-react';
import React from 'react'


const YearSkeleton = ({year}: {year: number}) => (
  <div>
    <span className='w-full flex items-center justify-between mb-3 mt-2'>
      <p>Year {year}</p>
      <ChevronUp className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </span>
    <div className='flex flex-row gap-3'>
      <Skeleton className='w-full h-64' />
      <Skeleton className='w-full h-64' />
    </div>
  </div>
);

const PlannerLoadingPage = () => {
  return (
    <div className='flex flex-col xl:flex-row items-center xl:items-start justify-between gap-4 mx-4'>
      <div className='flex flex-col w-full mt-2 xl:w-[60%] gap-[29px]'>
        <YearSkeleton year={1} />
        <YearSkeleton year={2} />
        <YearSkeleton year={3} />
      </div>
      
      <div className='flex flex-col w-full gap-4 mt-2 xl:w-[40%]'>
        <Skeleton className='w-full h-11' />
        <Skeleton className='w-full h-[560px]' />
        <Skeleton className='w-full h-44' />
        <Skeleton className='w-full h-44' />
      </div>
    </div>
  )
}

export default PlannerLoadingPage