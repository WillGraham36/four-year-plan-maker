import { Course } from '@/lib/utils/types'
import React from 'react'
import { Semester, SemesterHeaderText } from './semester'

const TransferCreditsContainer = ({ courses }: {  courses: Course[]}) => {
  return (
    <Semester term='TRANSFER' year={-1} courses={courses} disableCourseEditing={true}>
      <SemesterHeaderText>
        Transfer Credits
      </SemesterHeaderText>
    </Semester>
  )
}

export default TransferCreditsContainer