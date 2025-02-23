"use server";
import { Course, Term } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";

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
  const res = await fetchWithAuth("v1/usercourses", new URLSearchParams(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  return res;
}

export const saveSemester = async (courses: Course[]) => {

  const body = JSON.stringify(
    courses.map((course) => {
      return {
        course: {
          courseId: course.courseId,
          name: course.name,
          credits: course.credits,
          genEds: course.genEds,
        },
        semester: {
          term: "SPRING",
          year: 2026,
        },
      };
    })
  );
  console.log(body);

  const res = await fetchWithAuth("v1/usercourses", new URLSearchParams(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
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