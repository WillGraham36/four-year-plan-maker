"use client";
import { Course, GenEd } from '@/lib/utils/types';
import React, { useEffect, useRef, useState } from 'react'
import { Input } from '../ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { CircleAlert, Info } from 'lucide-react';
import SelectGenEdButton from './select-gened-button';
import { arraysEqual } from '@/lib/utils';
import { useRequirements } from '../context/requirements-context';
import { useSemester } from '../context/semester-context';
import { useCourseApi } from '@/lib/api/planner/planner.client';


type CourseInputProps = {
  initialCourse?: Course;
  disabled?: boolean;
  isCore?: boolean;
  index: number;
};

const CourseInput = ({
  initialCourse,
  disabled,
  isCore = true,
  index,
}: CourseInputProps) => {
  const { courses, addCourse, removeCourse, hasCourse, term, year } = useSemester();
  const { refreshGenEds, refreshAllRequirements } = useRequirements();
  const { saveCourse, updateCourseSelectedGenEds, deleteSemesterCourses, getCourseInfo } = useCourseApi();

  const [course, setCourse] = useState<Course>(initialCourse || {
    courseId: "",
    name: "",
    credits: -1,
    genEds: [["NONE"]],
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const verifiedCourseId = useRef<string>(initialCourse?.courseId || "");

  useEffect(() => {
    const updatedCourse = courses.find(c => c.courseId === verifiedCourseId.current);
    if (updatedCourse) {
      setCourse(prev => {
        // Check if the course data has actually changed
        const genEdsChanged = JSON.stringify(prev.genEds) !== JSON.stringify(updatedCourse.genEds);
        const selectedGenEdsChanged = JSON.stringify(prev.selectedGenEds) !== JSON.stringify(updatedCourse.selectedGenEds);
        const nameChanged = prev.name !== updatedCourse.name;
        const creditsChanged = prev.credits !== updatedCourse.credits;
        
        // If anything changed, return the updated course
        if (genEdsChanged || selectedGenEdsChanged || nameChanged || creditsChanged) {
          return {
            ...updatedCourse,
            // Ensure selectedGenEds is properly set
            selectedGenEds: updatedCourse.selectedGenEds || 
              (updatedCourse.genEds[0].some(genEd => genEd.includes("|"))
                ? updatedCourse.genEds[1] || updatedCourse.genEds[0]
                : updatedCourse.genEds[0])
          };
        }
        
        return prev;
      });
    }
  }, [courses]);

  // If courseId is provided, courseId field will NOT be reset
  const resetCourseFields = async (courseId: string = "") => {
    setCourse({
      courseId: courseId,
      name: "",
      credits: -1,
      genEds: [["NONE"]],
    });

    if(verifiedCourseId.current === "") return;
    
    // Make use of fact that course state has not updated yet to check 
    // if the course was added and validated to remove it from backend
    if(hasCourse(verifiedCourseId.current)) {
      removeCourse(verifiedCourseId.current);

      await deleteSemesterCourses([verifiedCourseId.current], term, year);
      await refreshAllRequirements();

      verifiedCourseId.current = "";
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const courseId = e.target.value.toUpperCase();
    setCourse(prevCourse => ({
      ...prevCourse,
      courseId,
    }));
    setErrorMessage("");
    
    if(courseId.length < 7) {
      await resetCourseFields(courseId);
      return;
    }

    if (courses.some(c => c.courseId === courseId)) {
      setErrorMessage("Course already added");
      return;
    }

    if (courseId.match(/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/)) {
      try {
        const courseInfo = await getCourseInfo(courseId);
        if(!courseInfo.ok) {
          setErrorMessage(courseInfo.message);
          await resetCourseFields(courseId);
          return;
        }
        setCourse({
          ...courseInfo.data,
          // Default to first gen ed group, or second if the first has a dependent gen ed
          selectedGenEds: courseInfo.data.genEds[0].some(genEd => genEd.includes("|"))
            ? courseInfo.data.genEds[1]
            : courseInfo.data.genEds[0]
        });
        addCourse(courseInfo.data);

        // Avoid extra call to update ULConcentration if courseId is not 3 or 400 level
        if(courseInfo.data.courseId.charAt(4) === "3" || courseInfo.data.courseId.charAt(4) === "4") {
          await saveCourse(courseInfo.data, term, year, index);
          await refreshAllRequirements();
        } else {
          await saveCourse({...courseInfo.data }, term, year, index);
          await refreshGenEds();
        }

        verifiedCourseId.current = courseId;
      } catch (e) {
        setErrorMessage("Error fetching course information");
      }
    }
  };

  const displayGenEds = () => {
    if (course.genEds[0][0] === "NONE") {
      return null;
    }

    if (course.genEds[0].length > 0) {
      return (        
        <span className='flex items-center gap-1'>
          {course.genEds.map((genEdGroup, groupIndex) => {
            const hasDependentGenEds = genEdGroup.some(genEd => 
              genEd.length > 4 && !courses.some(course => course.courseId === genEd.slice(5))
            );

            const genEdContent = (
              <React.Fragment>
                {genEdGroup.map((genEd, genEdIndex) => (
                  <React.Fragment key={`${groupIndex}-${genEdIndex}`}>
                    {genEdIndex > 0 && ", "}
                    {genEd.length > 4 ? (
                      (!courses.some(course => course.courseId === genEd.slice(5))) ? (
                        <Tooltip>
                          <TooltipTrigger className='text-orange-500 flex items-center gap-1 cursor-pointer'>
                            <Info size={16} className='inline' />
                            {genEd.slice(0, 4)}
                          </TooltipTrigger>
                          <TooltipContent className='text-center'>
                            Must be taken with <span className='font-bold'>{genEd.slice(5)}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        genEd.slice(0, 4)
                      )
                    ) : (
                      genEd
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );

            return (
              <React.Fragment key={groupIndex}>
                {hasDependentGenEds || course.genEds.length === 1 ? (
                  genEdContent
                ) : (
                  <SelectGenEdButton
                    genEds={genEdGroup}
                    onSelect={async () => {
                      setCourse(prevCourse => ({
                        ...prevCourse,
                        selectedGenEds: genEdGroup,
                      }));

                      await updateCourseSelectedGenEds(course.courseId, genEdGroup);
                      await refreshGenEds();
                    }}
                    selected={arraysEqual(genEdGroup, course.selectedGenEds || [])}
                    isFirstInGroup={groupIndex === 0}
                  >
                    {genEdContent}
                  </SelectGenEdButton>
                )}
                {groupIndex < course.genEds.length - 1 && <span>or</span>}
              </React.Fragment>
            );
          })}
        </span>
      );
    }

    return "-";
  };

  return (
    <div className="flex flex-col">
      <div className={`grid ${isCore ? 'grid-cols-[1fr_2fr_3.5rem]' : 'grid-cols-[1fr_2fr_7rem]'} relative`}>
        <div className='flex flex-row items-center'>
          {errorMessage.length > 0 && (
            <Tooltip>
              <TooltipTrigger className="text-red-500 flex items-center cursor-pointer h-full border-b pl-1.5">
                <CircleAlert size={16} className='inline' />
              </TooltipTrigger>
              <TooltipContent className='text-center'>
                {errorMessage}
              </TooltipContent>
            </Tooltip>
          )}
          <Input 
            className='p-0 px-3 h-8 rounded-none w-full focus-visible:ring-0 focus-visible:ring-offset-0 border-x-0 border-t-0 border-b text-xs md:text-sm !bg-card !border-border disabled:cursor-default disabled:opacity-100 disabled:text-muted-foreground'
            value={course.courseId} 
            onChange={handleInputChange} 
            disabled={disabled}
          />
        </div>

        <div 
          className='flex items-center h-8 w-full border-b border-x bg-background text-xs md:text-sm cursor-default px-3 border-t-0'
        >
          {displayGenEds()}
        </div>

        <div
          className='flex items-center justify-center h-8 w-full border-b bg-background text-xs md:text-sm cursor-default'
        >
          {course.credits === -1 ? "" : course.credits}
        </div>
      </div>
    </div>
  );
};

export default CourseInput