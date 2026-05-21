import { Course } from '@/lib/utils/types'
import React from 'react'
import { Semester, SemesterHeaderText } from './semester'

const TransferCreditsContainer = ({ courses }: {  courses: Course[]}) => {
  const sortedCourses = [...courses].sort((a, b) => {
    const indexA = a.index ?? Number.MAX_SAFE_INTEGER;
    const indexB = b.index ?? Number.MAX_SAFE_INTEGER;

    if (indexA !== indexB) {
      return indexA - indexB;
    }

    const idA = a.id ?? Number.MAX_SAFE_INTEGER;
    const idB = b.id ?? Number.MAX_SAFE_INTEGER;

    if (idA !== idB) {
      return idA - idB;
    }

    return `${a.courseId}-${a.name}`.localeCompare(`${b.courseId}-${b.name}`);
  });

  return (
    <Semester 
      term='TRANSFER' 
      year={-1} 
      courses={sortedCourses} 
      disableCourseEditing={true}
      isCore={false}
      title={
        <SemesterHeaderText key={'transfer-credits-header'}>
          Transfer Credits
        </SemesterHeaderText>
      }
    />
  )
}

export default TransferCreditsContainer
