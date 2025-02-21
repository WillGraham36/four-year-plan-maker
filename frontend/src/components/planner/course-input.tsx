"use client";
import { Course, GenEd } from '@/lib/utils/types';
import React, { useState } from 'react'
import { Input } from '../ui/input';
import { getCourseInfo } from '@/lib/api/planner/planner.server';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { CircleAlert, Info } from 'lucide-react';
import { useSemester } from './semester-context';


const CourseInput = () => {
  const { courses, addCourse, removeCourse } = useSemester();

  const [course, setCourse] = useState<Course>({
    courseId: "",
    name: "",
    description: "",
    credits: -1,
    genEds: [["NONE"]],
    preReqs: [],
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const resetCourseFields = (courseId: string = "") => {
    setCourse({
      courseId: courseId,
      name: "",
      description: "",
      credits: -1,
      genEds: [["NONE"]],
      preReqs: [],
    });
    removeCourse(course);
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const courseId = e.target.value.toUpperCase();
    setCourse({
      ...course,
      courseId: courseId,
    });
    if(courseId.length < 7) {
      setErrorMessage("");
      resetCourseFields(courseId);
      return;
    }
    if (courseId.match(/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/)) {
      const res = await getCourseInfo(courseId);
      if(!res.ok) {
        setErrorMessage(res.message);
        resetCourseFields(courseId);
        return;
      }
      setCourse(res.data);
      setErrorMessage("");
      addCourse(res.data);
    }
  };

  const displayGenEds = () => {
    if (course.genEds[0][0] === "NONE") {
      return null;
    }

    if (course.genEds[0].length > 0) {
      return (
        <span className='flex items-center gap-1'>
          {course.genEds.map((genEdGroups, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {genEdGroups.map((genEd, genEdIndex) => (
                <React.Fragment key={`${groupIndex}-${genEdIndex}`}>
                  {genEdIndex > 0 && ", "}
                  {genEd.length > 4 ? (
                    !courses.some(course => course.courseId === genEd.slice(5)) ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className='text-orange-500 flex items-center gap-1 cursor-pointer'>
                            <Info size={16} className='inline' />
                            {genEd.slice(0, 4)}
                          </TooltipTrigger>
                          <TooltipContent className='p-3 text-center'>
                            Must be taken with <span className='font-bold'>{genEd.slice(5)}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      genEd.slice(0, 4)
                    )
                  ) : (
                  genEd
                  )}
                </React.Fragment>
              ))}
              {groupIndex < course.genEds.length - 1 ? " or " : ""}
            </React.Fragment>
          ))}
        </span>
      );
    }

    return "-";
  };

  return (
    <div className="flex flex-col">
      <div className='grid grid-cols-[1fr,2fr,4rem] relative'>
        <div className='flex flex-row items-center dark:bg-neutral-950 bg-white'>
          {errorMessage.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-red-500 flex items-center cursor-pointer h-full border-neutral-600 border-b pl-3">
                  <CircleAlert size={16} className='inline' />
                </TooltipTrigger>
                <TooltipContent className='text-center'>
                  {errorMessage}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Input className='p-0 px-3 rounded-none w-full focus-visible:ring-0 focus-visible:ring-offset-0 border-x-0 border-t-0 border-b border-neutral-600 dark:border-neutral-600 text-sm' value={course.courseId} onChange={handleInputChange} />
        </div>
        <div 
          className='flex items-center h-10 w-full border-b border-x border-neutral-600 bg-white/40 text-sm text-neutral-500 cursor-default dark:bg-neutral-950/40 dark:text-neutral-400 px-3 border-t-0'
        >
          {displayGenEds()}
        </div>
        <div
          className='flex items-center justify-center h-10 w-full border-b border-neutral-600 bg-white/40 text-sm text-neutral-500 cursor-default dark:bg-neutral-950/40 dark:text-neutral-400'
        >
          {course.credits === -1 ? "" : course.credits}
        </div>
      </div>
    </div>
  );
};

export default CourseInput