"use client";
import { Course, GenEd } from '@/lib/utils/types';
import React, { useRef, useState } from 'react'
import { Input } from '../ui/input';
import { deleteSemesterCourses, getCourseInfo } from '@/lib/api/planner/planner.server';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { CircleAlert, Info } from 'lucide-react';
import { useSemester } from './semester-context';
import { saveCourse } from '@/lib/api/planner/planner.server';


const CourseInput = ({ initialCourse } : { initialCourse?: Course}) => {
  const { courses, addCourse, removeCourse, hasCourse, term, year } = useSemester();

  const [course, setCourse] = useState<Course>(initialCourse || {
    courseId: "",
    name: "",
    credits: -1,
    genEds: [["NONE"]],
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const verifiedCourseId = useRef<string>(initialCourse?.courseId || "");

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
        const res = await getCourseInfo(courseId);
        if(!res.ok) {
          setErrorMessage(res.message);
          await resetCourseFields(courseId);
          return;
        }
        setCourse(res.data);
        addCourse(res.data);
        await saveCourse(res.data, term, year);
        verifiedCourseId.current = courseId;
      } catch (e) {
        setErrorMessage("Error fetching course information");
        console.log(e);
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