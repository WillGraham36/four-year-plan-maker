import CourseInput from "./course-input";

const Semester = () => {


  return (
    <div className="flex flex-col max-w-xl">
      <div className="flex justify-around">
        <p>Course</p>
        <p>GenEd</p>
        <p>Credits</p>
      </div>
      <CourseInput />
      <CourseInput />
      <CourseInput />
    </div>
  )
}

export default Semester