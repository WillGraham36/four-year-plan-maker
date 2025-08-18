import { Course } from '@/lib/utils/types'
import React from 'react'
import { SemesterHeaderText } from '../planner/semester'
import CourseRow from './course-row'
import SatisfiedCheck from '../ui/satisfied-check'

const LowerLevelCSRequirements = [
  "CMSC131",
  "CMSC132",
  "CMSC216",
  "CMSC250",
  "CMSC330",
  "CMSC351"
];
const LowerLevelMathRequirements = [
  "MATH140",
  "MATH141",
  "STAT4XX",
  "MATH / STATXXX"
];

const LowerLevelRequirements = ({ courses } : { courses: (Course & { semester: string; })[] }) => {
const stat4xxCourses = courses.filter(course => course.courseId.startsWith("STAT4"));
  
  // Find MATH/STAT course that's not MATH140, MATH141, or any STAT4XX
  const mathStatCourses = courses.filter(course => 
    (course.courseId.startsWith("MATH") || course.courseId.startsWith("STAT")) &&
    course.courseId !== "MATH140" &&
    course.courseId !== "MATH141" &&
    !course.courseId.startsWith("STAT4")
  );

  const getRequirementStatus = (requirement: string) => {
    switch (requirement) {
      case "STAT4XX":
        return {
          found: stat4xxCourses.length > 0,
          course: stat4xxCourses[0],
          displayName: stat4xxCourses.length > 0 
            ? `STAT4XX : ${stat4xxCourses[0].courseId}`
            : "STAT4XX"
        };
      case "MATH / STATXXX":
        return {
          found: mathStatCourses.length > 0,
          course: mathStatCourses[0],
          displayName: mathStatCourses.length > 0 
            ? `MATH/STATXXX : ${mathStatCourses[0].courseId}`
            : "MATH / STATXXX"
        };
      default:
        const course = courses.find(c => c.courseId === requirement);
        return {
          found: !!course,
          course: course,
          displayName: requirement
        };
    }
  };

  const allRequirementsMet = LowerLevelMathRequirements.every(requirement => 
    getRequirementStatus(requirement).found
  );

  return (
   <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5">
        <SatisfiedCheck
          isChecked={allRequirementsMet}
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
            <span>Required Math Courses</span>,
            <span>Semester Planned</span>
          ]}
          headerRow={true}
        />
        {LowerLevelMathRequirements.map((courseName) => {
          const status = getRequirementStatus(courseName);
          return (
            <CourseRow
              key={courseName}
              columns={[
                <span>{status.displayName}</span>,
                <span>{status.course?.semester || ''}</span>
              ]}
              completed={status.found}
            />
          );
        })}
        <CourseRow
          key={"CourseHeader"}
          columns={[
            <span>Required CS Course</span>
          ]}
          headerRow={true}
        />
        {LowerLevelCSRequirements.map((courseName) => (
          <CourseRow
          key={courseName}
          columns={[
            <span>{courseName}</span>,
            <span>{courses.find(c => c.courseId === courseName)?.semester || ''}</span>
          ]}
          isLast={courseName === LowerLevelCSRequirements[LowerLevelCSRequirements.length - 1]}
          completed={courses.some(c => c.courseId === courseName) || false}
          />
        ))}
      </div>
    </div>
  )
};

export default LowerLevelRequirements