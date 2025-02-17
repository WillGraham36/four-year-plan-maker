"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input"
import { Course, GenEd } from "@/lib/utils/types";
import { getCourseInfo } from "@/lib/api/planner/planner.server";

const Semester = () => {

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Handle form submission and save the courseInfo
    console.log("Form submitted")
    console.log(e.target)
  };


  return (
    <div className="flex flex-col max-w-xl">
      <div className="flex justify-around">
        <p>Course</p>
        <p>GenEd</p>
        <p>Credits</p>
      </div>
      <Class />
      <Class />
      <Class />
    </div>
  )
}

const Class = () => {
  const [course, setCourse] = useState<Course>({
    courseId: "",
    name: "",
    description: "",
    credits: 0,
    genEds: [],
    preReqs: [],
  });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const courseId = e.target.value.toUpperCase();
    setCourse({
      ...course,
      courseId: courseId,
    });
    if(courseId.length === 0) {
      setCourse({
        courseId: "",
        name: "",
        description: "",
        credits: 0,
        genEds: [],
        preReqs: [],
      });
    }
    if (courseId.match(/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/)) {
      const res = await getCourseInfo(courseId);
      if(!res.ok) {
        console.log(res.message);
        return;
      }
      setCourse(res.data);
    }
  };

  return (
    <form
      className="bg-neutral-500 flex gap-2 items-center p-2"

    >
      <Input value={course.courseId} onChange={handleInputChange} />
      <Input className="disabled:cursor-default" disabled value={course.genEds.length > 0 ? course.genEds : "-"} />
      <Input className="disabled:cursor-default" disabled value={course.credits}/>
    </form>
  );
};

export default Semester