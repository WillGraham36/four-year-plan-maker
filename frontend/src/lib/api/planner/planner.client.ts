// lib/api/courses.ts
"use client";

import { useFetchWithAuth } from "@/hooks/useFetchWithAuthClient";
import { courseAndSemesterToDto } from "@/lib/utils";
import { CourseAutocompleteSuggestionListSchema, CourseSchema, CourseSyncSummarySchema, GenEdRequirementList, GenEdRequirementListSchema, SemesterSchema, SemestersSchema, ULConcentrationSchema, ULCoursesInfo } from "@/lib/utils/schemas";
import { Course, CourseAutocompleteSuggestion, CourseSyncSummary, CourseWithSemester, CsSpecializations, CustomServerResponse, Term, UserInfo } from "@/lib/utils/types";

// Save a course
export function useCourseApi() {
  const { fetchWithAuth } = useFetchWithAuth();

  const saveCourse = async (course: Course, term: Term, year: number, index: number) => {
    const body = JSON.stringify([{
      course: {
        courseId: course.courseId,
        name: course.name,
        credits: course.credits,
        genEds: course.genEds,
      },
      semester: { term, year },
      index,
    }]);

    return await fetchWithAuth("v1/usercourses", new URLSearchParams(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  };

  interface ReturnUpdatedResponse {
    savedCourses: CourseWithSemester[];
    updatedGenEdRequirements: GenEdRequirementList;
    updatedULConcentration: {
      concentration: string;
      courses: ULCoursesInfo;
    }
  }
  const saveCourseAndReturnUpdated = async (course: Course, term: Term, year: number, index: number): Promise<CustomServerResponse<ReturnUpdatedResponse>>  => {
    const body = JSON.stringify([{
      course: {
        courseId: course.courseId,
        name: course.name,
        credits: course.credits,
        genEds: course.genEds,
      },
      semester: { term, year },
      index,
    }]);

    return await fetchWithAuth("v1/usercourses/with-updates", new URLSearchParams(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }

  const saveSemester = async (courses: (Course & { index?: number })[], term: Term, year: number) => {
    const body = JSON.stringify(
      courses.map((course, idx) => courseAndSemesterToDto(course, term, year, idx))
    );
  
    return await fetchWithAuth("v1/usercourses", new URLSearchParams(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      }
    );
  };

  const saveCoursePlacements = async (
    placements: { course: Course; term: Term; year: number; index: number }[]
  ) => {
    const body = JSON.stringify(
      placements.map(({ course, term, year, index }) =>
        courseAndSemesterToDto(course, term, year, index)
      )
    );

    return await fetchWithAuth("v1/usercourses", new URLSearchParams(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }
    );
  };

  const deleteSemesterCourses = async (courseIds: string[], term: Term, year: number) => {
    const body = JSON.stringify(
      courseIds.map((courseId) => ({
        courseId: courseId,
        semester: {
          term: term,
          year: year
        }
      }))
    );
  
    return await fetchWithAuth("v1/usercourses", new URLSearchParams(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      }
    );
  };

  const deleteSemesterCoursesAndReturnUpdated = async (courseIds: string[], term: Term, year: number): Promise<CustomServerResponse<ReturnUpdatedResponse>> => {
    const body = JSON.stringify(
      courseIds.map((courseId) => ({
        courseId: courseId,
        semester: {
          term: term,
          year: year
        }
      }))
    );
  
    return await fetchWithAuth("v1/usercourses/with-updates", new URLSearchParams(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      }
    );
  }

  const getAllSemesters = async (): Promise<SemesterSchema> => {
    const res = await fetchWithAuth("v1/usercourses");
    const courses = SemestersSchema.safeParse(res.data);
    return courses.data || {} as SemesterSchema;
  };
  
  const getAllGenEdRequirements = async () => {
    const res = await fetchWithAuth("v1/geneds");
    const genEdRequirements = GenEdRequirementListSchema.safeParse(res.data);
    return genEdRequirements.data || [];
  };
  
  const getAllULCourses = async () => {
    const res = await fetchWithAuth('v1/ulconcentration');
    const ULCourses = ULConcentrationSchema.safeParse(res.data);
    return ULCourses.data || {
      concentration: "",
      courses: [],
    }
  };

  const getUserInfo = async (): Promise<CustomServerResponse<UserInfo>> => {
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
  };

  const updateULConcentration = async (concentration: string) => {
    const res = await fetchWithAuth('v1/ulconcentration', new URLSearchParams(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ concentration }),
      }
    );
    
    if (!res.ok) {
      throw new Error("Failed to update upper level concentration");
    }
    return res;
  };

  const addCustomULCourse = async (courseId: string, term: Term, year: number) => {
    const res = await fetchWithAuth('v1/ulconcentration/custom-courses', new URLSearchParams(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          semester: { term, year },
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to add custom upper level concentration course");
    }

    const ULCourses = ULConcentrationSchema.safeParse(res.data);
    return ULCourses.data || {
      concentration: "",
      courses: [],
    };
  };

  const removeCustomULCourse = async (courseId: string, term: Term, year: number) => {
    const res = await fetchWithAuth('v1/ulconcentration/custom-courses', new URLSearchParams(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          semester: { term, year },
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to remove custom upper level concentration course");
    }

    const ULCourses = ULConcentrationSchema.safeParse(res.data);
    return ULCourses.data || {
      concentration: "",
      courses: [],
    };
  };

  const getCourseInfo = async (courseId: string): Promise<CustomServerResponse<Course>> => {
    const response = await fetchWithAuth(`courses/${encodeURIComponent(courseId)}`);
    if (!response.ok) {
      return {
        ok: false,
        message: response.message || "Course not found",
        data: null,
      }
    }
  
    try {
      const parsedCourse = CourseSchema.parse(response.data);
      const courseInfo: Course = {
        ...parsedCourse,
        index: parsedCourse.index ?? undefined,
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
  };

  /**
   * Fetches multiple course information based on an array of course IDs.
   * @returns List of successfully fetched courses or an error message if ALL course IDs are invalid
   */
  const getMultipleCourseInfos = async (
    courseIds: string[]
  ): Promise<CustomServerResponse<Course[]>> => {
    if (courseIds.length === 0) {
      return {
        ok: true,
        message: "No course IDs provided",
        data: [],
      };
    }

    try {
      const results = await Promise.all(courseIds.map((courseId) => getCourseInfo(courseId)));
      const parsedCourses = results
        .filter((result): result is CustomServerResponse<Course> & { ok: true } => result.ok)
        .map((result) => result.data);

      if (parsedCourses.length === 0) {
        return {
          ok: false,
          message: "No valid courses found",
          data: null,
        };
      }

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

  const createOffTerm = async (term: Term, year: number): Promise<CustomServerResponse<void>> => {
    const res = await fetchWithAuth("v1/userinfo/offterms", new URLSearchParams(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ term, year }),
      }
    )
  
    if (!res.ok) {
      throw new Error("Failed to create off-term");
    }
    return {
      ok: true,
      message: "Successfully created off-term",
      data: undefined,
    };
  };

  const deleteOffTerm = async (term: Term, year: number): Promise<CustomServerResponse<void>> => {
    const params = new URLSearchParams({
      term: term,
      year: year.toString()
    });
    
    const res = await fetchWithAuth(`v1/userinfo/offterms`, params, {
      method: "DELETE",
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

  const updateSemesterCompletion = async (term: Term, year: number, completed: boolean): Promise<CustomServerResponse<string>> => {
    const res = await fetchWithAuth(`v1/userinfo/semesters/${term}/${year}/completion`, new URLSearchParams(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      }
    );
  
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
  };

  const updateUserNote = async (note: string): Promise<CustomServerResponse<string>> => {
    const res = await fetchWithAuth("v1/userinfo/notes", new URLSearchParams(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      }
    );
  
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
  };

  const updateUserTrack = async (track: CsSpecializations): Promise<CustomServerResponse<string>> => {
    const res = await fetchWithAuth("v1/userinfo/track", new URLSearchParams(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ track }),
      }
    );
  
    if (!res.ok) {
      return {
        ok: false,
        message: "Failed to update user track",
        data: null,
      };
    }
    return {
      ok: true,
      message: "Successfully updated user track",
      data: "User track updated successfully",
    };
  }

  const autocompleteCourses = async (query: string): Promise<CustomServerResponse<CourseAutocompleteSuggestion[]>> => {
    const params = new URLSearchParams({ q: query });
    const res = await fetchWithAuth("courses/autocomplete", params);

    if (!res.ok) {
      return {
        ok: false,
        message: res.message,
        data: null,
      };
    }

    const parsedSuggestions = CourseAutocompleteSuggestionListSchema.safeParse(res.data);
    return {
      ok: true,
      message: "Successfully fetched course suggestions",
      data: parsedSuggestions.success ? parsedSuggestions.data : [],
    };
  };

  const syncCourseDepartments = async (departments: string[]): Promise<CustomServerResponse<CourseSyncSummary>> => {
    const res = await fetchWithAuth("admin/courses/sync", new URLSearchParams(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ departments }),
    });

    if (!res.ok) {
      return {
        ok: false,
        message: res.message || "Failed to sync courses",
        data: null,
      };
    }

    const parsedSummary = CourseSyncSummarySchema.safeParse(res.data);
    if (!parsedSummary.success) {
      return {
        ok: false,
        message: "Unexpected sync response",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Successfully synced courses",
      data: parsedSummary.data,
    };
  };
  

  return {
    saveCourse,
    saveCourseAndReturnUpdated,
    saveSemester,
    saveCoursePlacements,
    deleteSemesterCoursesAndReturnUpdated,
    deleteSemesterCourses,
    getAllSemesters,
    getAllGenEdRequirements,
    getAllULCourses,
    getUserInfo,
    updateULConcentration,
    addCustomULCourse,
    removeCustomULCourse,
    getCourseInfo,
    getMultipleCourseInfos,
    createOffTerm,
    deleteOffTerm,
    updateSemesterCompletion,
    updateUserNote,
    updateUserTrack,
    autocompleteCourses,
    syncCourseDepartments
  };
}
