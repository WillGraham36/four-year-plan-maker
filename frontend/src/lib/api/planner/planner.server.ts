'use server';

import { CourseInfoSchema } from "@/lib/utils/schemas";
import { Course, CustomServerResponse, GenEd } from "@/lib/utils/types";

export const getCourseInfo = async (courseId: string): Promise<CustomServerResponse<Course>> => {
  const response = await fetch(`https://api.umd.io/v1/courses/${courseId}`);
  if (response.status === 404) {
    return {
      ok: false,
      message: "Course not found",
      data: null,
    }
  }
  if (!response.ok) {
    return {
      ok: false,
      message: `Something went wrong: Error status ${response.status}`,
      data: null,
    }
  }

  const data = await response.json();
  try {
    const parsedData = CourseInfoSchema.parse(data[0]);
    const courseInfo: Course = {
      courseId: parsedData.course_id,
      name: parsedData.name,
      description: parsedData.description,
      credits: parsedData.credits,
      genEds: (parsedData.gen_ed ? parsedData.gen_ed.flat() : []) as GenEd[],
      preReqs: parsedData.relationships?.prereqs ? [parsedData.relationships.prereqs] : [],
    };
    return {
      ok: true,
      message: "Successfully fetched course data",
      data: courseInfo,
    }
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "Validation Error",
      data: null,
    }
  }
}