import React from 'react'
import { Skeleton } from '@/components/ui/skeleton';
import { SemesterHeaderText } from '@/components/planner/semester';

const AuditLoadingPage = () => {
  return (
    <div className='min-h-[calc(100vh-8.75rem)] flex flex-col mx-4 mt-4 gap-4'>
      <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
        <SemesterHeaderText className="flex items-center gap-2 py-1.5 md:text-lg font-bold">
          Total Completion Status
        </SemesterHeaderText>
        <Skeleton className='w-full aspect-[612/576] max-h-[576px] md:max-h-[384px] md:aspect-[1346/378]' />
      </div>
      <div className='flex flex-row gap-4'>
        <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden flex-1">
          <SemesterHeaderText className="flex items-center gap-2 py-1.5 md:text-lg font-semibold pl-9">
            Required Lower Level Courses
          </SemesterHeaderText>
          <Skeleton className='w-full h-[347px]' />
        </div>
        <div className='w-full flex-1 flex flex-col gap-4'>
          <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
            <SemesterHeaderText className="flex items-center gap-2 h-[53px] md:text-lg font-semibold pl-9">
              Major Requirements
            </SemesterHeaderText>
            <Skeleton className='w-full h-[145px]' />
          </div>
          <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
            <SemesterHeaderText className="flex items-center gap-2 h-[53px] md:text-lg font-semibold pl-9">
              Upper Level Concentration
            </SemesterHeaderText>
            <Skeleton className='w-full h-[119px]' />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditLoadingPage