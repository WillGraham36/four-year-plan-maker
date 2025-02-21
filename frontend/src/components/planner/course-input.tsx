"use client";
import { Course } from '@/lib/utils/types';
import React, { useState } from 'react'
import { Input } from '../ui/input';
import { getCourseInfo } from '@/lib/api/planner/planner.server';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Info } from 'lucide-react';


const CourseInput = () => {
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
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const courseId = e.target.value.toUpperCase();
    setCourse({
      ...course,
      courseId: courseId,
    });
    if(courseId.length === 0) {
      resetCourseFields("");
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
    }
  };

  const displayGenEds = () => {
    if (course.genEds[0][0] === "NONE") {
      return null;
    }

    // TODO: Add a context so this knows the other courses in the semester and dont show the hoverCard if the dependant course is met
    if (course.genEds.length > 0) {
      return (
        <span className='flex items-center gap-1'>
          {course.genEds.map((genEdGroups, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {genEdGroups.map((genEd, genEdIndex) => (
                <React.Fragment key={`${groupIndex}-${genEdIndex}`}>
                  {genEdIndex > 0 && ", "}
                  {genEd.length > 4 ? (
                    <HoverCard>
                      <HoverCardTrigger className='text-orange-600 flex items-center gap-1 cursor-pointer'>
                        <Info size={16} className='inline' />
                        {genEd.slice(0, 4)}
                      </HoverCardTrigger>
                      <HoverCardContent className='p-3 text-center'>
                        Must be taken with <span className='font-bold'>{genEd.slice(5)}</span>
                      </HoverCardContent>
                    </HoverCard>
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
    <div className="bg-neutral-500 flex flex-col gap-1 p-2">
      <div className='flex items-center gap-2'>
        <Input value={course.courseId} onChange={handleInputChange} />
        <div 
          className="flex items-center h-10 w-full rounded-md border border-neutral-400 bg-white/50 px-3 py-2 text-base ring-offset-white text-neutral-500 cursor-default md:text-sm dark:border-neutral-500 dark:bg-neutral-950/50 dark:ring-offset-neutral-950 dark:text-neutral-400"
        >
          {displayGenEds()}
        </div>
        <div
          className="flex items-center h-10 w-full rounded-md border border-neutral-400 bg-white/50 px-3 py-2 text-base ring-offset-white text-neutral-500 cursor-default md:text-sm dark:border-neutral-500 dark:bg-neutral-950/50 dark:ring-offset-neutral-950 dark:text-neutral-400"
        >
          {course.credits === -1 ? "" : course.credits}
        </div>
      </div>
      {errorMessage.length > 0 && <p className="text-red-700 text-sm font-medium pl-1">{errorMessage}</p>}
    </div>
  );
};

export default CourseInput