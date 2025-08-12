'use server';

import { CourseInfoSchema, GenEdListSchema, SemesterSchema, SemestersSchema, ULConcentrationSchema } from "@/lib/utils/schemas";
import { Course, CustomServerResponse, GenEd, Term, ACCEPTABLE_ULC_AREAS, UserInfo } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";
import { courseAndSemesterToDto } from "@/lib/utils";

export const saveCourse = async (course: Course, term: Term, year: number, index: number) => {
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
    },
    index: index,
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


export const saveSemester = async (courses: (Course & { index?: number })[], term: Term, year: number) => {
  const body = JSON.stringify(
    courses.map((course, idx) => courseAndSemesterToDto(course, term, year, idx))
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
}

export const getAllSemesters = async (): Promise<SemesterSchema> => {
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
        selectedGenEds: parsedData.gen_ed?.length ? parsedData.gen_ed[0] as GenEd[] : [],
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

export const getUserInfo = async (): Promise<CustomServerResponse<UserInfo>> => {
  const res = await fetchWithAuth("v1/userinfo");
  if (!res.ok) {
    return {
      ok: false,
      message: `Failed to fetch user info`,
      data: null,
    }
  }
  const data = await res.data;
  return {
    ok: true,
    message: "Successfully fetched user info",
    data: data as UserInfo
  };
}

export const createOffTerm = async (term: Term, year: number): Promise<CustomServerResponse<void>> => {
  const res = await fetchWithAuth("v1/userinfo/offterms", {
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ term, year }),
    }
  })

  if (!res.ok) {
    throw new Error("Failed to create off-term");
  }
  return {
    ok: true,
    message: "Successfully created off-term",
    data: undefined,
  };
};

export const deleteOffTerm = async (term: Term, year: number): Promise<CustomServerResponse<void>> => {
  const params = new URLSearchParams({
    term: term,
    year: year.toString()
  });
  
  const res = await fetchWithAuth(`v1/userinfo/offterms`, {
    params,
    init: {
      method: "DELETE",
    }
  })

  if (!res.ok) {
    return {
      ok: false,
      message: "Failed to delete off-term",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Successfully deleted off-term",
    data: undefined,
  };
};

export const updateSemesterCompletion = async (term: Term, year: number, completed: boolean): Promise<CustomServerResponse<string>> => {
  const res = await fetchWithAuth(`v1/userinfo/semesters/${term}/${year}/completion`, {
    init: {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
    }
  });

  if (!res.ok) {
    return {
      ok: false,
      message: "Failed to update semester completion",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Successfully updated semester completion",
    data: "Semester completion updated successfully",
  };
}


export const updateUserNote = async (note: string): Promise<CustomServerResponse<string>> => {
  const res = await fetchWithAuth("v1/userinfo/notes", {
    init: {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note }),
    }
  });

  if (!res.ok) {
    return {
      ok: false,
      message: "Failed to update user note",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Successfully updated user note",
    data: "User note updated successfully",
  };
}