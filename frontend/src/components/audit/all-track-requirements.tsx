import { Course } from "@/lib/utils/types";
import { CsSpecializations } from "../onboarding/onboarding-form";
import React, { useEffect } from "react";
import CourseRow from "./course-row";
import { courseAreas } from "./course-areas";

export const tracks: { value: CsSpecializations; label: string }[] = [
  { value: "GENERAL", label: "General Track" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "QUANTUM", label: "Quantum Information" },
  { value: "CYBERSECURITY", label: "Cybersecurity" },
  { value: "ML", label: "Machine Learning" },
];

export const GeneralTrackRequirements = ({
  courses, 
  setIsComplete
}: {
  courses: (Course & { semester: string; })[], 
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const coveredAreas = new Set<number>();
  
  courses.forEach((course) => {
    const areas = courseAreas[course.courseId];
    if (areas) {
      areas.forEach(area => coveredAreas.add(area));
    }
  });

  const total400LevelCourses = courses.filter(course => course.courseId.startsWith("CMSC4")).length;
  const electiveCourses = courses.filter(course => {
    const areas = courseAreas[course.courseId];
    return areas && areas.length === 0; // Empty array means it's an elective
  });

  const is400LevelComplete = total400LevelCourses >= 5 && coveredAreas.size >= 3;
  const isElectivesComplete = electiveCourses.length >= 2 && electiveCourses.reduce((sum, course) => sum + course.credits, 0) >= 6;
  const isTrackComplete = is400LevelComplete && isElectivesComplete;

  useEffect(() => {
    setIsComplete(isTrackComplete);
  }, [isTrackComplete, setIsComplete]);

  return (
    <div className="grid grid-cols-[3.5fr_1fr_1fr]">
      <CourseRow
        columns={[
          <span key={'description'}>Completed <strong>5</strong> CMSC 400 level courses from at least <strong>3</strong> different areas</span>,
          <span key={'total'} className="text-center w-full">
            <strong>{total400LevelCourses}</strong> / <strong>5</strong> courses
          </span>,
          <span key={'areas'} className="text-center w-full">
            <strong>{coveredAreas.size}</strong> / <strong>3</strong> areas
          </span>
        ]}
        completed={is400LevelComplete}
      />

      <CourseRow
        columns={[
          <span key={'description'}>Completed <strong>2</strong> CMSC electives totaling <strong>6</strong> credits</span>,
          <span key={'total'} className="text-center w-full">
            <strong>{electiveCourses.length}</strong> / <strong>2</strong> courses
          </span>,
          <span key={'credits'} className="text-center w-full">
            <strong>{electiveCourses.reduce((sum, course) => sum + course.credits, 0)}</strong> / <strong>6</strong> credits
          </span>
        ]}
        completed={isElectivesComplete}
      />
    </div>
  );
};

export const CybersecurityTrackRequirements = ({
  courses, 
  setIsComplete
}: {
  courses: (Course & { semester: string; })[], 
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  // Required courses
  const requiredCourses = ["CMSC414", "CMSC456"];
  const completedRequired = courses.filter(course => 
    requiredCourses.includes(course.courseId)
  );

  // Choose four from these courses
  const chooseFromCourses = ["CMSC411", "CMSC412", "CMSC417", "CMSC430", "CMSC433", "CMSC451"];
  const completedChooseFrom = courses.filter(course => 
    chooseFromCourses.includes(course.courseId)
  );

  // Upper Level Elective Courses (CMSC 300- or 400-level, excluding CMSC330, CMSC351, and courses already counted)
  const alreadyCountedCourses = new Set([
    ...requiredCourses,
    ...completedChooseFrom.map(c => c.courseId)
  ]);
  
  const ulecCourses = courses.filter(course => {
    const courseNum = parseInt(course.courseId.replace("CMSC", ""));
    return (
      course.courseId.startsWith("CMSC") &&
      courseNum >= 300 &&
      courseNum < 500 &&
      course.courseId !== "CMSC330" &&
      course.courseId !== "CMSC351" &&
      !alreadyCountedCourses.has(course.courseId)
    );
  });

  // Check completion status
  const isRequiredComplete = completedRequired.length >= 2;
  const isChooseFromComplete = completedChooseFrom.length >= 4;
  const isUlecComplete = ulecCourses.reduce((sum, course) => sum + course.credits, 0) >= 3;
  const isTrackComplete = isRequiredComplete && isChooseFromComplete && isUlecComplete;

  useEffect(() => {
    setIsComplete(isTrackComplete);
  }, [isTrackComplete, setIsComplete]);

  return (
    <div className="grid grid-cols-[3fr_1fr_1.5fr]">
      <CourseRow
        columns={[
          <span key={'required-courses'}>Completed required courses: <strong>CMSC 414</strong> and <strong>CMSC 456</strong></span>,
          <span key={'required-courses-count'} className="text-center w-full">
            <strong>{completedRequired.length}</strong> / <strong>2</strong> courses
          </span>,
          <span key={'required-courses-list'} className="text-center w-full">
            {completedRequired.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isRequiredComplete}
      />

      <CourseRow
        columns={[
          <span key={'choose-from-courses'}>Choose <strong>4</strong> courses from: CMSC 411, 412, 417, 430, 433, 451</span>,
          <span key={'choose-from-courses-count'} className="text-center w-full">
            <strong>{completedChooseFrom.length}</strong> / <strong>4</strong> courses
          </span>,
          <span key={'choose-from-courses-list'} className="text-center w-full">
            {completedChooseFrom.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isChooseFromComplete}
      />

      <CourseRow
        columns={[
          <span key={'ulec-courses'}>Upper Level Elective: <strong>3</strong> credits from CMSC 300-400 level</span>,
          <span key={'ulec-courses-count'} className="text-center w-full">
            <strong>{ulecCourses.reduce((sum, course) => sum + course.credits, 0)}</strong> / <strong>3</strong> credits
          </span>,
          <span key={'ulec-courses-list'} className="text-center w-full">
            {ulecCourses.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isUlecComplete}
      />
    </div>
  );
};

export const DataScienceTrackRequirements = ({
  courses, 
  setIsComplete
}: {
  courses: (Course & { semester: string; })[], 
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  // Required courses
  const mathOptions = ["MATH240", "MATH461", "MATH341"];
  const otherRequired = ["STAT400", "CMSC320", "CMSC422", "CMSC424"];
  
  const completedMath = courses.filter(course => 
    mathOptions.includes(course.courseId)
  );
  const completedOtherRequired = courses.filter(course => 
    otherRequired.includes(course.courseId)
  );

  // Choose one from first group
  const chooseOneGroup1 = ["CMSC420", "CMSC421", "CMSC423", "CMSC425", "CMSC426", "CMSC427", "CMSC470"];
  const completedChooseOne1 = courses.filter(course => 
    chooseOneGroup1.includes(course.courseId)
  );

  // Choose one from second group
  const chooseOneGroup2 = ["CMSC451", "CMSC454", "CMSC460"];
  const completedChooseOne2 = courses.filter(course => 
    chooseOneGroup2.includes(course.courseId)
  );

  // Choose two from third group
  const chooseTwoGroup = ["CMSC411", "CMSC412", "CMSC414", "CMSC417", "CMSC430", "CMSC433", "CMSC434", "CMSC435"];
  const completedChooseTwo = courses.filter(course => 
    chooseTwoGroup.includes(course.courseId)
  );

  // Check completion status
  const isMathComplete = completedMath.length >= 1;
  const isOtherRequiredComplete = completedOtherRequired.length >= 4;
  const isRequiredComplete = isMathComplete && isOtherRequiredComplete;
  const isChooseOne1Complete = completedChooseOne1.length >= 1;
  const isChooseOne2Complete = completedChooseOne2.length >= 1;
  const isChooseTwoComplete = completedChooseTwo.length >= 2;
  const isTrackComplete = isRequiredComplete && isChooseOne1Complete && isChooseOne2Complete && isChooseTwoComplete;

  useEffect(() => {
    setIsComplete(isTrackComplete);
  }, [isTrackComplete, setIsComplete]);

  return (
    <div className="grid grid-cols-[3.5fr_1fr_1fr]">
      <CourseRow
        columns={[
          <span key={'math-course'}>One math course: <strong>MATH240</strong> or <strong>MATH461</strong> or <strong>MATH341</strong></span>,
          <span key={'math-course-count'} className="text-center w-full">
            <strong>{completedMath.length}</strong> / <strong>1</strong> course
          </span>,
          <span key={'math-course-list'} className="text-center w-full">
            {completedMath.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isMathComplete}
      />

      <CourseRow
        columns={[
          <span key={'other-required-courses'}>Required: <strong>STAT400, CMSC320, CMSC422, CMSC424</strong></span>,
          <span key={'other-required-courses-count'} className="text-center w-full">
            <strong>{completedOtherRequired.length}</strong> / <strong>4</strong> courses
          </span>,
          <span key={'other-required-courses-list'} className="text-center w-full">
            {completedOtherRequired.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isOtherRequiredComplete}
      />

      <CourseRow
        columns={[
          <span key={'choose-from-courses'}>Choose <strong>1</strong> from: CMSC 420, 421, 423, 425, 426, 427, or 470</span>,
          <span key={'choose-from-courses-count'} className="text-center w-full">
            <strong>{completedChooseOne1.length}</strong> / <strong>1</strong> course
          </span>,
          <span key={'choose-from-courses-list'} className="text-center w-full">
            {completedChooseOne1.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isChooseOne1Complete}
      />

      <CourseRow
        columns={[
          <span key={'choose-from-courses'}>Choose <strong>1</strong> from: CMSC 451, 454, or 460</span>,
          <span key={'choose-from-courses-count'} className="text-center w-full">
            <strong>{completedChooseOne2.length}</strong> / <strong>1</strong> course
          </span>,
          <span key={'choose-from-courses-list'} className="text-center w-full">
            {completedChooseOne2.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isChooseOne2Complete}
      />

      <CourseRow
        columns={[
          <span key={'choose-from-courses'}>Choose <strong>2</strong> from: CMSC 411, 412, 414, 417, 430, 433, 434, or 435</span>,
          <span key={'choose-from-courses-count'} className="text-center w-full">
            <strong>{completedChooseTwo.length}</strong> / <strong>2</strong> courses
          </span>,
          <span key={'choose-from-courses-list'} className="text-center w-full">
            {completedChooseTwo.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isChooseTwoComplete}
      />
    </div>
  );
};

export const QuantumTrackRequirements = ({
  courses, 
  setIsComplete
}: {
  courses: (Course & { semester: string; })[], 
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  // Required courses
  const mathOptions = ["MATH240", "MATH461", "MATH341"];
  const otherRequired = ["CMSC457", "PHYS467"];
  
  const completedMath = courses.filter(course => 
    mathOptions.includes(course.courseId)
  );
  const completedOtherRequired = courses.filter(course => 
    otherRequired.includes(course.courseId)
  );

  // Find courses in each area using courseAreas object
  const completedAreaCourses = courses.filter(course => {
    const areas = courseAreas[course.courseId];
    return areas && areas.length > 0;
  });

  // Check if two courses fall in two separate areas outside of Area 4
  const nonArea4Courses = courses.filter(course => {
    const areas = courseAreas[course.courseId];
    return areas && areas.some(area => area !== 4);
  });
  
  const coveredNonArea4Areas = new Set<number>();
  nonArea4Courses.forEach(course => {
    const areas = courseAreas[course.courseId];
    if (areas) {
      areas.forEach(area => {
        if (area !== 4) {
          coveredNonArea4Areas.add(area);
        }
      });
    }
  });

  // Upper Level Elective Courses (CMSC 300-400 level, excluding CMSC330, CMSC351, and already counted courses)
  const alreadyCountedCourses = new Set([
    ...completedMath.map(c => c.courseId),
    ...completedOtherRequired.map(c => c.courseId),
    ...completedAreaCourses.map(c => c.courseId)
  ]);
  
  const ulecCourses = courses.filter(course => {
    const courseNum = parseInt(course.courseId.replace("CMSC", ""));
    const areas = courseAreas[course.courseId];
    return (
      course.courseId.startsWith("CMSC") &&
      courseNum >= 300 &&
      courseNum < 500 &&
      course.courseId !== "CMSC330" &&
      course.courseId !== "CMSC351" &&
      !alreadyCountedCourses.has(course.courseId) &&
      areas && areas.length === 0 // Empty array means it's an elective
    );
  });

  // Check completion status
  const isMathComplete = completedMath.length >= 1;
  const isOtherRequiredComplete = completedOtherRequired.length >= 2;
  const isRequiredComplete = isMathComplete && isOtherRequiredComplete;
  const isAreaCoursesComplete = completedAreaCourses.length >= 4;
  const isTwoAreasOutsideArea4Complete = coveredNonArea4Areas.size >= 2 && nonArea4Courses.length >= 2;
  const isUlecComplete = ulecCourses.reduce((sum, course) => sum + course.credits, 0) >= 3;
  const isTrackComplete = isRequiredComplete && isAreaCoursesComplete && isTwoAreasOutsideArea4Complete && isUlecComplete;

  useEffect(() => {
    setIsComplete(isTrackComplete);
  }, [isTrackComplete, setIsComplete]);

  return (
    <div className="grid grid-cols-[3.5fr_1fr_1fr]">
      <CourseRow
        columns={[
          <span key={'one-math-course'}>One math course: <strong>MATH 240</strong> or <strong>MATH 461</strong> or <strong>MATH 341</strong></span>,
          <span key={'one-math-course-count'} className="text-center w-full">
            <strong>{completedMath.length}</strong> / <strong>1</strong> course
          </span>,
          <span key={'one-math-course-list'} className="text-center w-full">
            {completedMath.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isMathComplete}
      />

      <CourseRow
        columns={[
          <span key={'other-required-courses'}>Required: <strong>CMSC457, PHYS467</strong> </span>,
          <span key={'other-required-courses-count'} className="text-center w-full">
            <strong>{completedOtherRequired.length}</strong> / <strong>2</strong> courses
          </span>,
          <span key={'other-required-courses-list'} className="text-center w-full">
            {completedOtherRequired.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isOtherRequiredComplete}
      />

      <CourseRow
        columns={[
          <span key={'area-courses'}>Choose <strong>4</strong> courses from Areas 1-5</span>,
          <span key={'area-courses-count'} className="text-center w-full">
            <strong>{completedAreaCourses.length}</strong> / <strong>4</strong> courses
          </span>,
          <span key={'area-courses-list'} className="text-center w-full">
            {completedAreaCourses.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isAreaCoursesComplete}
      />

      <CourseRow
        columns={[
          <span key={'two-areas-outside-area-4'}><strong>2</strong> of the <strong> 4 </strong> courses must be from <strong>2 separate areas</strong> outside Area 4</span>,
          <span key={'two-areas-outside-area-4-count'} className="text-center w-full">
            <strong>{nonArea4Courses.length}</strong> / <strong>2</strong> courses
          </span>,
          <span key={'two-areas-outside-area-4-list'} className="text-center w-full">
            <strong>{coveredNonArea4Areas.size}</strong> / <strong>2</strong> areas
          </span>
        ]}
        completed={isTwoAreasOutsideArea4Complete}
      />

      <CourseRow
        columns={[
          <span key={'ulec-courses'}>Upper Level Elective: <strong>3</strong> credits from CMSC 300-400 level</span>,
          <span key={'ulec-courses-count'} className="text-center w-full">
            <strong>{ulecCourses.reduce((sum, course) => sum + course.credits, 0)}</strong> / <strong>3</strong> credits
          </span>,
          <span key={'ulec-courses-list'} className="text-center w-full">
            {ulecCourses.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isUlecComplete}
      />
    </div>
  );
};

export const MachineLearningTrackRequirements = ({
  courses, 
  setIsComplete
}: {
  courses: (Course & { semester: string; })[], 
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  // Required courses
  const mathOptions = ["MATH240", "MATH461", "MATH341"];
  const otherRequired = ["CMSC320", "CMSC421", "CMSC422"];
  
  const completedMath = courses.filter(course => 
    mathOptions.includes(course.courseId)
  );
  const completedOtherRequired = courses.filter(course => 
    otherRequired.includes(course.courseId)
  );

  // Choose two from these courses
  // Note: CMSC/AMSC 460, CMSC/AMSC 466, and MATH 401 are OR options (only need one of the three)
  const chooseTwoCourses = ["CMSC426", "CMSC460", "CMSC466", "MATH401", "CMSC470", "CMSC472", "CMSC473", "CMSC474"];
  const completedChooseTwo = courses.filter(course => 
    chooseTwoCourses.includes(course.courseId)
  );

  // Upper Level Elective Courses (CMSC 300-400 level, excluding CMSC330, CMSC351, and already counted courses)
  const alreadyCountedCourses = new Set([
    ...completedMath.map(c => c.courseId),
    ...completedOtherRequired.map(c => c.courseId),
    ...completedChooseTwo.map(c => c.courseId)
  ]);
  
  const ulecCourses = courses.filter(course => {
    const courseNum = parseInt(course.courseId.replace("CMSC", ""));
    const areas = courseAreas[course.courseId];
    return (
      course.courseId.startsWith("CMSC") &&
      courseNum >= 300 &&
      courseNum < 500 &&
      course.courseId !== "CMSC330" &&
      course.courseId !== "CMSC351" &&
      !alreadyCountedCourses.has(course.courseId) &&
      areas && areas.length === 0 // Empty array means it's an elective
    );
  });

  // Check completion status
  const isMathComplete = completedMath.length >= 1;
  const isOtherRequiredComplete = completedOtherRequired.length >= 3;
  const isRequiredComplete = isMathComplete && isOtherRequiredComplete;
  const isChooseTwoComplete = completedChooseTwo.length >= 2;
  const isUlecComplete = ulecCourses.reduce((sum, course) => sum + course.credits, 0) >= 6;
  const isTrackComplete = isRequiredComplete && isChooseTwoComplete && isUlecComplete;

  useEffect(() => {
    setIsComplete(isTrackComplete);
  }, [isTrackComplete, setIsComplete]);

  return (
    <div className="grid grid-cols-[3.5fr_1fr_1fr]">
      <CourseRow
        columns={[
          <span key={'one-math-course'}>One math course: <strong>MATH240</strong> or <strong>MATH461</strong> or <strong>MATH341</strong></span>,
          <span key={'one-math-course-count'} className="text-center w-full">
            <strong>{completedMath.length}</strong> / <strong>1</strong> course
          </span>,
          <span key={'one-math-course-list'} className="text-center w-full">
            {completedMath.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isMathComplete}
      />

      <CourseRow
        columns={[
          <span key={'other-required-courses'}>Required: <strong>CMSC320, CMSC421, </strong> and <strong>CMSC422</strong></span>,
          <span key={'other-required-courses-count'} className="text-center w-full">
            <strong>{completedOtherRequired.length}</strong> / <strong>3</strong> courses
          </span>,
          <span key={'other-required-courses-list'} className="text-center w-full">
            {completedOtherRequired.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isOtherRequiredComplete}
      />

      <CourseRow
        columns={[
          <span key={'choose-two-courses'}>Choose <strong>2</strong> from: MATH401, CMSC426, 460/466, 470, 472, 473, or 474</span>,
          <span key={'choose-two-courses-count'} className="text-center w-full">
            <strong>{completedChooseTwo.length}</strong> / <strong>2</strong> courses
          </span>,
          <span key={'choose-two-courses-list'} className="text-center w-full">
            {completedChooseTwo.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isChooseTwoComplete}
      />

      <CourseRow
        columns={[
          <span key={'ulec-courses'}>Upper Level Electives: <strong>6</strong> credits from CMSC 300-400 level</span>,
          <span key={'ulec-courses-count'} className="text-center w-full">
            <strong>{ulecCourses.reduce((sum, course) => sum + course.credits, 0)}</strong> / <strong>6</strong> credits
          </span>,
          <span key={'ulec-courses-list'} className="text-center w-full">
            {ulecCourses.map(c => c.courseId).join(", ") || "None"}
          </span>
        ]}
        completed={isUlecComplete}
      />
    </div>
  );
};