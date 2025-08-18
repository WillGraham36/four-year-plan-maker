import { Course, CsSpecializations } from '@/lib/utils/types'
import React from 'react'
import { SemesterHeaderText } from '../planner/semester';
import SatisfiedCheck from '../ui/satisfied-check';
import CourseRow from './course-row';
import { courseAreas } from './course-areas';

interface AreaRequirementsProps {
  courses: (Course & { semester: string; })[];
}

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

const AreaRequirements = ({ courses }: AreaRequirementsProps) => {
  const upperLevelCSCourses = courses.filter(
    (course) =>
      (course.courseId.startsWith('CMSC3') || course.courseId.startsWith('CMSC4')) &&
      course.courseId !== 'CMSC351' &&
      course.courseId !== 'CMSC330'
  );

  // Allocate courses to the "best" area if multiple possible
  const areaAssignments: Record<number, (Course & { semester: string })[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 0: [] };

  upperLevelCSCourses.forEach((course) => {
    const areas = courseAreas[course.courseId] || [];
    if (areas.length === 0) {
      areaAssignments[0].push(course);
    } else {
      // choose area with the fewest courses so far
      let chosenArea = areas[0];
      let minCount = areaAssignments[chosenArea].length;
      areas.forEach((a) => {
        if (areaAssignments[a].length < minCount) {
          chosenArea = a;
          minCount = areaAssignments[a].length;
        }
      });
      areaAssignments[chosenArea].push(course);
    }
  });

  let areaCourseCount = 0;
  let areaSet = new Set<number>();
  let overflowToElectives: Course[] = [];

  Object.entries(areaAssignments).forEach(([areaNum, areaCourses]) => {
    const num = parseInt(areaNum);
    if (num === 0) return; // skip electives bucket

    const fourHundreds = areaCourses.filter(c => c.courseId.startsWith("CMSC4"));

    const valid = fourHundreds.slice(0, 3);
    const overflow = fourHundreds.slice(3);

    areaCourseCount += valid.length;
    if (valid.length > 0) areaSet.add(num);

    overflowToElectives.push(...overflow);
  });

  const hasThreeAreas = areaSet.size >= 3;

  const degreeReqsSatisfied = hasThreeAreas;

  let foundFirstArea = 0;

  return (
    <div className="flex flex-col rounded-lg border w-full h-min bg-card shadow-md overflow-hidden">
      <SemesterHeaderText className="flex items-center gap-2 py-1.5">
        <SatisfiedCheck
          isChecked={degreeReqsSatisfied}
          uncheckedMessage="You do not have courses from at least 3 areas (excluding electives)"
          checkedMessage="You have courses from at least 3 areas!"
        />
        <p className="font-semibold text-base md:text-lg">
          Area Requirements <span className="text-muted-foreground text-sm md:text-base ml-1">({areaCourseCount} / 3 areas satisfied)</span>
        </p>
      </SemesterHeaderText>

      <div className="grid grid-cols-[1fr_1fr]">
        {Object.entries(areaAssignments)
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
                    completed={degreeReqsSatisfied}
                    isLast={index === Object.keys(areaAssignments).length - 1 && coursesInArea.indexOf(course) === coursesInArea.length - 1}
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
