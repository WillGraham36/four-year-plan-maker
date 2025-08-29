'use client'
import { SemesterHeaderText } from '../planner/semester'
import CourseRow from './course-row'
import SatisfiedCheck from '../ui/satisfied-check'
import { useMajorRequirements } from '@/components/context/major-requirements-context'

const LowerLevelRequirements = () => {
  const { lowerLevel } = useMajorRequirements();

  return (
   <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5">
        <SatisfiedCheck
          isChecked={lowerLevel.allMet}
          uncheckedMessage="Your plan needs to include all lower-level courses"
          checkedMessage="You met the lower level requirements!"
        />
        <span className='font-semibold text-base md:text-lg'>
          Required Lower Level Courses
        </span>
      </SemesterHeaderText>
      <div className='grid grid-cols-[1fr_1fr]'>
        <CourseRow
          key={"MathHeader"}
          columns={[
            <span key={"math-courses"}>Required Math Courses</span>,
            <span key={"math-semester"}>Semester Completed</span>
          ]}
          headerRow={true}
        />
        {lowerLevel.math.map((requirement) => (
          <CourseRow
            key={requirement.id}
            columns={[
              <span key={`math-${requirement.id}`}>{requirement.displayName}</span>,
              <span key={`math-${requirement.id}-semester`}>{requirement.details || ''}</span>
            ]}
            completed={requirement.completed}
          />
        ))}
        <CourseRow
          key={"CourseHeader"}
          columns={[
            <span key={"cs-courses"}>Required CS Course</span>
          ]}
          headerRow={true}
        />
        {lowerLevel.cs.map((requirement, index) => (
          <CourseRow
          key={requirement.id}
          columns={[
            <span key={`cs-${requirement.id}`}>{requirement.displayName}</span>,
            <span key={`cs-${requirement.id}-semester`}>{requirement.details || ''}</span>
          ]}
          isLast={index === lowerLevel.cs.length - 1}
          completed={requirement.completed}
          />
        ))}
      </div>
    </div>
  )
};

export default LowerLevelRequirements;