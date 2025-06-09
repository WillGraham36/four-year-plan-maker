'use client';
import { termYearToString } from '@/lib/utils'
import React, { useMemo } from 'react'
import { useGenEds } from '../planner/geneds-context';
import { GenEdList } from '@/lib/utils/schemas';

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

  const { genEds } = useGenEds();

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

  return (
    <div className='w-full rounded-lg border bg-card shadow-md h-full'>
      <p className="w-full border-b p-1.5 px-3 text-lg font-bold">
        Gen Eds
      </p>
      <table className="w-full">
        <thead className=''>
          <tr className='border-b-2'>
            <th className='text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
              Gen Ed
            </th>
            <th className='border-x text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
              Course
            </th>
            <th className='text-left px-3 py-1 font-normal text-sm md:text-sm text-muted-foreground'>
              Semester
            </th>
          </tr>
        </thead>
        <tbody>
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
                {((GenEds[i+1]?.charAt(0) !== genEd.charAt(0)) && i !== GenEds.length - 1) && (
                  <tr>
                    <td colSpan={3} className='bg-border p-0'>
                      <div className='h-0.5' />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
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
    <tr className={`${!isLast ? 'border-b' : ''}`}>
      <td className='px-3 py-1 text-sm md:text-sm text-muted-foreground'>
        {genEd}
      </td>
      <td className='border-x px-3 py-1 text-sm md:text-sm text-muted-foreground font-mono'>
        {course}
      </td>
      <td className='px-3 py-1 text-sm md:text-sm text-muted-foreground'>
        {semester}
      </td>
    </tr>
  )
}

export default GenEdsContainer