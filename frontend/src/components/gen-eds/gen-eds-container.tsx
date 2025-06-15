'use client';
import { termYearToString } from '@/lib/utils'
import React, { useMemo } from 'react'
import { useRequirements } from '../planner/requirements-context';
import { GenEdList } from '@/lib/utils/schemas';
import SatisfiedCheck from '../ui/satisfied-check';

const GenEds = [
  'FSAW',
  'FSPW',
  'FSMA',
  'FSOC',
  'FSAR',

  'DSNL',
  'DSNS or DSNL',
  'DSHS',
  'DSHS',
  'DSHU',
  'DSHU',
  'DSSP',
  'DSSP',

  'SCIS',
  'SCIS',

  'DVUP',
  'DVUP or DVCC',
]

const GenEdsContainer = () => {

  const { genEds } = useRequirements();

  // Create a local copy of genEds to work with when filtering and rendering
  const localGenEds = useMemo(() => [...genEds], [genEds]);

  // Create a mapping of GenEds to their courses
  const assignGenEdsToRequirements = useMemo(() => {
    const assignments: GenEdList = [];
    const usedCourses = new Set(); // Track which courses have been used for each requirement
    
    // For each course, check if it satisfies any of the GenEd requirements
    GenEds.forEach(requiredGenEd => {
      let availableCourse: GenEdList[number] | undefined = undefined;
      if(requiredGenEd.includes('or')) {
        const [firstGenEd, secondGenEd] = requiredGenEd.split(' or ');
        availableCourse = localGenEds.find(genEdCourse => 
          (genEdCourse.genEd === firstGenEd || genEdCourse.genEd === secondGenEd) && 
          !usedCourses.has(`${genEdCourse.courseId}-${firstGenEd}`) &&
          !usedCourses.has(`${genEdCourse.courseId}-${secondGenEd}`)
        );
      } else {
        availableCourse = localGenEds.find(genEdCourse => 
          genEdCourse.genEd === requiredGenEd && 
          !usedCourses.has(`${genEdCourse.courseId}-${requiredGenEd}`)
        );  
      }      
      if (availableCourse) {
        // Mark this specific course-requirement pair as used
        usedCourses.add(`${availableCourse.courseId}-${requiredGenEd}`);
        assignments.push(availableCourse);
      } else {
        // No available course for this requirement
        assignments.push({ 
          genEd: requiredGenEd, 
          courseId: '', 
          semesterName: '' 
        });
      }
    });
    
    return assignments;
  }, [localGenEds]);

  const allGenEdsSatisfied = assignGenEdsToRequirements.every(
    ({ courseId }) => courseId && courseId.trim() !== ""
  );

  return (
    <div className='w-full rounded-lg border bg-card shadow-md h-full'>
      <div className='flex items-center gap-2 border-b p-2 px-3'>
        <SatisfiedCheck
          isSatisfied={allGenEdsSatisfied}
          message="You need to complete all Gen Eds to satisfy this requirement"
        />
        <p className="w-full font-semibold text-lg">
          Gen Eds
        </p>
      </div>
      <div className='flex flex-col'>
        <div className='grid grid-cols-[1fr,2fr,7rem] border-b'>
          <p className='text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
            Gen Ed
          </p>
          <p className='border-x text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
            Course
          </p>
          <p className='text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
            Semester
          </p>
        </div>

        <div className='grid grid-cols-[1fr,2fr,7rem]'>
          {GenEds.map((genEd, i) => {
            const { courseId, semesterName } = assignGenEdsToRequirements[i];
            return (
              <React.Fragment key={i}>
                <GenEdRow
                  genEd={genEd}
                  course={courseId}
                  semester={termYearToString(semesterName)}
                  isLast={i === GenEds.length - 1}
                />
                {/* Add empty row between gen-ed sections */}
                {/* {((GenEds[i+1]?.charAt(0) !== genEd.charAt(0)) && i !== GenEds.length - 1) && (
                    <div className='bg-border p-0 h-0.5'>
                    </div>
                )} */}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}


interface GenEdRowProps {
  genEd: string
  course?: string
  semester?: string
  alternateBg?: boolean
  isLast?: boolean
}

const GenEdRow = ({
  genEd,
  course,
  semester,
  isLast = false,
}: GenEdRowProps) => {
  return (
    <React.Fragment>
      <p className={`px-3 py-1 text-sm md:text-sm text-muted-foreground ${!isLast ? 'border-b' : ''}`}>
        {genEd}
      </p>
      <p className={`border-x px-3 py-1 text-sm md:text-sm text-muted-foreground bg-background ${!isLast ? 'border-b' : ''}`}>
        {course}
      </p>
      <p className={`px-3 py-1 text-sm md:text-sm text-muted-foreground bg-background ${!isLast ? 'border-b' : ''}`}>
        {semester}
      </p>
      </React.Fragment>
  )
}

export default GenEdsContainer