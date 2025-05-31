"use client";
import { Course, GenEd } from '@/lib/utils/types';
import React, { useRef, useState } from 'react'
import { Input } from '../ui/input';
import { deleteSemesterCourses, getCourseInfo } from '@/lib/api/planner/planner.server';
import {
  Tooltip,
  TooltipContent,
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
      <div className='grid grid-cols-[1fr,2fr,3.5rem] relative'>
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
            className='p-0 px-3 h-8 rounded-none w-full focus-visible:ring-0 focus-visible:ring-offset-0 border-x-0 border-t-0 border-b text-xs md:text-sm !bg-card !border-border'
            value={course.courseId} 
            onChange={handleInputChange} 
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