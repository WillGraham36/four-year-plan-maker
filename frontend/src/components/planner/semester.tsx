import CourseInput from "./course-input";
import { SemesterProvider } from "./semester-context";

const Semester = () => {


  return (
    <SemesterProvider>
      <div className="flex flex-col">
        <div className="flex justify-around">
          <p>Course</p>
          <p>GenEd</p>
          <p>Credits</p>
        </div>
        <CourseInput />
        <CourseInput />
        <CourseInput />
      </div>
    </SemesterProvider>
  )
}

export default Semester