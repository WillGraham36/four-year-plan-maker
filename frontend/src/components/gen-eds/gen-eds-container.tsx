'use client';
import { termYearToString } from '@/lib/utils'
import React, { useMemo } from 'react'
import { useRequirements } from '../context/requirements-context';
import { GenEdList } from '@/lib/utils/schemas';
import SatisfiedCheck from '../ui/satisfied-check';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import DefaultOpenAccordion from '../ui/default-open-accordion';

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

  const { genEds, completedSemesters } = useRequirements();

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
    <aside className='w-full rounded-lg border bg-card shadow-md h-full'>
      <DefaultOpenAccordion
        triggerClassName='flex items-center gap-2 data-[state=open]:border-b p-2 px-3 border-b-1'
        trigger={
            <div className='flex items-center gap-2'>
              <SatisfiedCheck
                isChecked={allGenEdsSatisfied}
                message="You need to complete all Gen Eds to satisfy this requirement"
              />
              <p className="w-full font-semibold text-lg">
                Gen Eds
              </p>
            </div>
        }
        contentClassName='pb-0 rounded-lg overflow-hidden'
        content={
            <div className='flex flex-col'>
              <div className='grid grid-cols-[1fr_2fr_7rem] border-b'>
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

              <div className='grid grid-cols-[1fr_2fr_7rem]'>
                {GenEds.map((genEd, i) => {
                  const { courseId, semesterName, transferCreditName } = assignGenEdsToRequirements[i];
                  const [term, year] = semesterName.split(' ');
                  return (
                    <React.Fragment key={i}>
                      <GenEdRow
                        genEd={genEd}
                        course={transferCreditName ? `${courseId} | ${transferCreditName}` : courseId}
                        semester={termYearToString(semesterName)}
                        isLast={i === GenEds.length - 1}
                        completed={completedSemesters.some(sem => sem.term === term && sem.year === parseInt(year))}
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
        }
        accordion={
          <Accordion type="single" collapsible defaultValue='gen-eds'>
            <AccordionItem value={`gen-eds`} className='border-b-0'>
            </AccordionItem>
          </Accordion>
        }
      />
    </aside>
  )
}


const getSharedClasses = (isLast: boolean, completed: boolean) => 
  `px-3 py-1 text-sm md:text-sm text-muted-foreground bg-background transition-all duration-200 ${!isLast ? 'border-b' : ''} ${completed ? 'bg-green-500/15 dark:bg-green-800/15' : ''}`;
interface GenEdRowProps {
  genEd: string
  course?: string
  semester?: string
  alternateBg?: boolean
  isLast?: boolean
  completed?: boolean;
}

const GenEdRow = ({
  genEd,
  course,
  semester,
  isLast = false,
  completed = false
}: GenEdRowProps) => {
  return (
    <React.Fragment>
      <p className={getSharedClasses(isLast, (completed || semester === "Transfer"))}>
        {genEd}
      </p>
      <p className={`${getSharedClasses(isLast, (completed || semester === "Transfer"))} border-x break-all`}>
        {course?.includes("|") ? (
          <>
            <span className="w-20 inline-block">{course.split("|")[0]}</span>
            <span className='pr-2'>|</span>
            {course.slice(course.indexOf("|") + 1)}
          </>
        ) : (
          <span className="font-normal">{course}</span>
        )}
      </p>
      <p className={getSharedClasses(isLast, (completed || semester === "Transfer"))}>
        {semester}
      </p>
    </React.Fragment>
  )
}

export default GenEdsContainer