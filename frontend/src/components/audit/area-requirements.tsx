'use client';
import React from 'react'
import { SemesterHeaderText } from '../planner/semester';
import SatisfiedCheck from '../ui/satisfied-check';
import CourseRow from './course-row';
import { useMajorRequirements } from '@/components/context/major-requirements-context';

const mapAreaNumToString = (areaNum: number): string => {
  switch (areaNum) {
    case 1:
      return 'Systems';
    case 2:
      return 'Information Processing';
    case 3:
      return 'Software Engineering and Programming Languages';
    case 4:
      return 'Theory';
    case 5:
      return 'Numerical Analysis';
    default:
      return 'Electives';
  }
};

const AreaRequirements = () => {
  const { areas } = useMajorRequirements();
  
  let foundFirstArea = 0;

  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5">
        <SatisfiedCheck
          isChecked={areas.satisfied}
          uncheckedMessage="You do not have courses from at least 3 areas (excluding electives)"
          checkedMessage="You have courses from at least 3 areas!"
        />
        <p className="font-semibold text-base md:text-lg">
          Area Requirements <span className="text-muted-foreground text-sm md:text-base ml-1">({areas.areaCourseCount} / 3 areas satisfied)</span>
        </p>
      </SemesterHeaderText>

      <div className="grid grid-cols-[1fr_1fr]">
        {Object.entries(areas.areaAssignments)
          .sort(([a], [b]) => {
            if (a === '0') return 1;   // push electives down
            if (b === '0') return -1;
            return Number(a) - Number(b);
          })
          .map(([areaNum, coursesInArea], index) => {
            if (coursesInArea.length === 0) return null;
            foundFirstArea++;
            const num = parseInt(areaNum);

            return (
              <React.Fragment key={areaNum}>
                <CourseRow
                  key={`header-${areaNum}`}
                  columns={[
                    <span>{num !== 0 ? `Area ${num} : ${mapAreaNumToString(num)}` : 'Electives'}</span>,
                    <span>{foundFirstArea === 1 ? 'Semester Planned' : ''}</span>
                  ]}
                  headerRow={true}
                />
                {coursesInArea.map((course) => (
                  <CourseRow
                    key={course.courseId}
                    columns={[
                      <span>{course.courseId}</span>,
                      <span>{course.semester || ''}</span>
                    ]}
                    completed={areas.satisfied}
                    isLast={index === Object.keys(areas.areaAssignments).length - 1 && coursesInArea.indexOf(course) === coursesInArea.length - 1}
                  />
                ))}
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};

export default AreaRequirements;