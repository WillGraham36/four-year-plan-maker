export const getCourseInfo = async (courseId: string) => {
  const res = await fetch(`/api/courses/${courseId}`);
  if (!res.ok) {
    console.log("Failed to fetch course data");
    return {
      ok: false,
      message: "Failed to fetch course data",
      data: null,
    }
  }
  const data = await res.json();
  return {
    ok: res.ok,
    message: "Successfully fetched course data",
    data: data,
  }
}