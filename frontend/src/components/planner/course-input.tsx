"use client";
import { Course } from '@/lib/utils/types';
import React, { useState } from 'react'
import { Input } from '../ui/input';
import { getCourseInfo } from '@/lib/api/planner/planner.server';

const CourseInput = () => {
  const [course, setCourse] = useState<Course>({
    courseId: "",
    name: "",
    description: "",
    credits: -1,
    genEds: ["NONE"],
    preReqs: [],
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const resetCourseFields = (courseId: string = "") => {
    setCourse({
      courseId: courseId,
      name: "",
      description: "",
      credits: -1,
      genEds: ["NONE"],
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

  return (
    <div
      className="bg-neutral-500 flex flex-col gap-1 p-2"
    >
      <div className='flex items-center gap-2'>
        <Input value={course.courseId} onChange={handleInputChange} />
        <Input 
          className="disabled:cursor-default" 
          disabled 
          value={course.genEds[0] === "NONE" 
            ? "" 
            : course.genEds.length > 0
            ? course.genEds.join(", ")
            : "-"
          } 
        />
        <Input 
          className="disabled:cursor-default" 
          disabled 
          value={course.credits === -1 ? "" : course.credits}
        />
      </div>
      {errorMessage.length > 0 && <p className="text-red-700 text-sm font-medium pl-1">{errorMessage}</p>}
    </div>
  );
};

export default CourseInput