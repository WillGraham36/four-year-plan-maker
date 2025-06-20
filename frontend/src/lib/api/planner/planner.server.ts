'use server';

import { CourseInfoSchema, GenEdListSchema, SemestersSchema, ULConcentrationSchema } from "@/lib/utils/schemas";
import { Course, CustomServerResponse, GenEd, Term, ACCEPTABLE_ULC_AREAS } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";
import { courseAndSemesterToDto } from "@/lib/utils";

export const saveCourse = async (course: Course, term: Term, year: number) => {
  const body = JSON.stringify([{
    course: {
      courseId: course.courseId,
      name: course.name,
      credits: course.credits,
      genEds: course.genEds,
    },
    semester: {
      term: term,
      year: year,
    }
  }]);
  const res = await fetchWithAuth("v1/usercourses", {
    init: { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    }
  });

  return res;
}


export const saveSemester = async (courses: Course[], term: Term, year: number) => {
  const body = JSON.stringify(
    courses.map((course) => courseAndSemesterToDto(course, term, year))
  );

  const res = await fetchWithAuth("v1/usercourses", {
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    }
  });

  return res;
}

export const updateCourseSelectedGenEds = async (courseId: string, selectedGenEds: GenEd[]) => {
  const body = JSON.stringify({
    courseId: courseId,
    selectedGenEds: selectedGenEds,
  });

  const res = await fetchWithAuth("v1/usercourses", {
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    }
  });

  return res;
}

export const deleteSemesterCourses = async (courseIds: string[], term: Term, year: number) => {
  const body = JSON.stringify(
    courseIds.map((courseId) => ({
      courseId: courseId,
      semester: {
        term: term,
        year: year
      }
    }))
  );

  const res = await fetchWithAuth("v1/usercourses", {
    init: {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    }
  });

  return res;
}


interface GetSemesterCoursesProps {
  term: Term;
  year: number;
}

export const getSemesterCourses = async (props: GetSemesterCoursesProps) => {
  const courses = await fetchWithAuth("v1/usercourses");
  console.log(courses.data);
}

export const getAllSemesters = async () => {
  const res = await fetchWithAuth("v1/usercourses");
  const courses = SemestersSchema.safeParse(res.data);
  return courses.data || {};
}

export const getAllGenEds = async () => {
  const res = await fetchWithAuth("v1/geneds");
  const genEdList = GenEdListSchema.safeParse(res.data);
  return genEdList.data || [];
}

export const getAllULCourses = async () => {
  const res = await fetchWithAuth('v1/ulconcentration');
  const ULCourses = ULConcentrationSchema.safeParse(res.data);
  return ULCourses.data || {
    concentration: "",
    courses: [],
  }
}

export const updateULConcentration = async (concentration: string) => {
  console.log("Updating upper level concentration to:", concentration);
  const res = await fetchWithAuth('v1/ulconcentration', {
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ concentration }),
    }
  })
  
  if (!res.ok) {
    throw new Error("Failed to update upper level concentration");
  }
}

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
      credits: parsedData.credits,
      genEds: (parsedData.gen_ed?.length !== 0 ? parsedData.gen_ed : [[]]) as GenEd[][],
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


/**
 * Fetches multiple course information based on an array of course IDs.
 * @returns List of successfully fetched courses or an error message if ALL course IDs are invalid
 */
export const getMultipleCourseInfos = async (
  courseIds: string[]
): Promise<CustomServerResponse<Course[]>> => {
  if (courseIds.length === 0) {
    return {
      ok: true,
      message: "No course IDs provided",
      data: [],
    };
  }

  const joinedIds = courseIds.map(encodeURIComponent).join(",");
  const response = await fetch(`https://api.umd.io/v1/courses/${joinedIds}`);

  if (!response.ok) {
    return {
      ok: false,
      message: `Something went wrong: Error status ${response.status}`,
      data: null,
    };
  }

  try {
    const data = await response.json();
    const parsedCourses = data.map((raw: any) => {
      const parsedData = CourseInfoSchema.parse(raw);
      return {
        courseId: parsedData.course_id,
        name: parsedData.name,
        credits: parsedData.credits,
        genEds: (parsedData.gen_ed?.length !== 0 ? parsedData.gen_ed : [[]]) as GenEd[][],
      } satisfies Course;
    });

    return {
      ok: true,
      message: "Successfully fetched all courses",
      data: parsedCourses,
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      ok: false,
      message: "Validation failed for one or more courses",
      data: null,
    };
  }
};