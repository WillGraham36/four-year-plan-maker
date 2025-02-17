"use client"

import { useState } from "react";
import { Input } from "@/components/ui/input"
import { Course, GenEd } from "@/lib/utils/types";
import { getCourseInfo } from "@/lib/api/planner/planner.client";

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
    courseID: "",
    name: "",
    description: "",
    credits: 0,
    genEds: [],
  });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const courseId = e.target.value.toUpperCase();
    setCourse({
      ...course,
      courseID: courseId,
    });
    if(courseId.length === 0) {
      setCourse({
        courseID: "",
        name: "",
        description: "",
        credits: 0,
        genEds: [],
      });
    }
    if (courseId.match(/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/)) {
      const res = await getCourseInfo(courseId);
      if(!res.ok) {
        console.log(res.message);
        return;
      }
      const courseInfo = res.data;


  
      const genEds = courseInfo[0].gen_ed.length !== 0 ? courseInfo[0].gen_ed[0].map((genEds: string) => genEds as GenEd) : [];
      setCourse({
        courseID: courseInfo[0].course_id,
        name: courseInfo[0].name,
        description: courseInfo[0].description,
        credits: courseInfo[0].credits,
        genEds: genEds,
      });
    }
  };

  return (
    <form
      className="bg-neutral-500 flex gap-2 items-center p-2"

    >
      <Input value={course.courseID} onChange={handleInputChange} />
      <Input className="disabled:cursor-default" disabled value={course.genEds.length > 0 ? course.genEds : "-"} />
      <Input className="disabled:cursor-default" disabled value={course.credits}/>
    </form>
  );
};

export default Semester