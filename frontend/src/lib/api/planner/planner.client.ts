'use server';
export const getCourseInfo = async (courseId: string) => {
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
      message: `HTTP error! status: ${response.status}`,
      data: null,
    }
  }
  const data = await response.json();
  return {
    ok: response.ok,
    message: "Successfully fetched course data",
    data: data,
  }
}