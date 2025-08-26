'use client';
import { Course, SemesterDateDescriptor } from "@/lib/utils/types";
import { CsSpecializations } from "../onboarding/onboarding-form";
import { createContext, useContext, useMemo, useState } from "react";
import { courseAreas } from "@/components/audit/course-areas";

// Types for requirement status
export interface RequirementStatus {
  id: string;
  displayName: string;
  completed: boolean;
  planned: boolean; // NEW: indicates if course is planned but not completed
  details?: string;
  courses?: string[];
  progress?: { current: number; total: number };
}

export interface LowerLevelRequirementStatus {
  cs: RequirementStatus[];
  math: RequirementStatus[];
  allMet: boolean;
}

export interface AreaRequirementStatus {
  areaAssignments: Record<number, (Course & { semester: string; completed: boolean })[]>;
  areaCourseCount: number;
  coveredAreas: Set<number>;
  hasThreeAreas: boolean;
  satisfied: boolean;
  completedCount: number;
  plannedCount: number;
}

export interface TrackRequirementStatus {
  track: CsSpecializations | undefined;
  requirements: RequirementStatus[];
  allMet: boolean;
}

export interface MajorRequirementsContextProps {
  courses: (Course & { semester: string })[];
  lowerLevel: LowerLevelRequirementStatus;
  areas: AreaRequirementStatus;
  trackRequirements: TrackRequirementStatus;
  currentTrack: CsSpecializations | undefined;
  updateTrack: (track: CsSpecializations | undefined) => void;
  // Chart-friendly summary
  chartSummary: {
    lowerLevelCS: { completed: number; planned: number; total: number };
    lowerLevelMath: { completed: number; planned: number; total: number };
    areas: { completed: number; total: number }; // 1 total, 1 if all areas met
    track: { completed: number; total: number }; // each section counts as 1
  };
}

const MajorRequirementsContext = createContext<MajorRequirementsContextProps | undefined>(undefined);

interface MajorRequirementsProviderProps {
  children: React.ReactNode;
  courses: (Course & { semester: string })[];
  userTrack: CsSpecializations | undefined;
  completedSemesters: SemesterDateDescriptor[];
}

// Helper function to check if a course is completed (moved outside component)
const isCourseCompleted = (
  course: Course & { semester: string }, 
  completedSemesters: SemesterDateDescriptor[]
) => {
  if (course.semester === "Transfer Credit") return true;
  
  // Parse the semester string (e.g., "Fall 2024", "Spring 2023")
  const [term, yearStr] = course.semester.split(' ');
  const year = parseInt(yearStr);
  
  return completedSemesters.some(completedSem => 
    completedSem.term.toLowerCase() === term.toLowerCase() && 
    completedSem.year === year
  );
};

export const MajorRequirementsProvider = ({ 
  children, 
  courses,
  userTrack,
  completedSemesters
}: MajorRequirementsProviderProps) => {
  const [currentTrack, setCurrentTrack] = useState<CsSpecializations | undefined>(userTrack);
  
  // Keep track requirements in state to ensure proper updates
  const [trackRequirements, setTrackRequirements] = useState<TrackRequirementStatus>(() => 
    computeTrackRequirements(courses, userTrack)
  );
  
  // Keep chart summary in state for animation purposes
  const [chartSummary, setChartSummary] = useState(() => {
    const initialTrackReqs = computeTrackRequirements(courses, userTrack);
    // Calculate initial lower level requirements
    const LowerLevelCSRequirements = ["CMSC131", "CMSC132", "CMSC216", "CMSC250", "CMSC330", "CMSC351"];
    
    let csCompleted = 0;
    let csPlanned = 0;
    LowerLevelCSRequirements.forEach(courseId => {
      const course = courses.find(c => c.courseId === courseId);
      if (course) {
        if (isCourseCompleted(course, completedSemesters)) {
          csCompleted++;
        } else {
          csPlanned++;
        }
      }
    });

    let mathCompleted = 0;
    let mathPlanned = 0;
    
    // MATH140 and MATH141
    ["MATH140", "MATH141"].forEach(courseId => {
      const course = courses.find(c => c.courseId === courseId);
      if (course) {
        if (isCourseCompleted(course, completedSemesters)) {
          mathCompleted++;
        } else {
          mathPlanned++;
        }
      }
    });
    
    // STAT4XX course
    const stat4Course = courses.find(course => course.courseId.startsWith("STAT4"));
    if (stat4Course) {
      if (isCourseCompleted(stat4Course, completedSemesters)) {
        mathCompleted++;
      } else {
        mathPlanned++;
      }
    }
    
    // Additional MATH/STAT course
    const additionalMathStat = courses.find(course => 
      (course.courseId.startsWith("MATH") || course.courseId.startsWith("STAT")) &&
      course.courseId !== "MATH140" &&
      course.courseId !== "MATH141" &&
      !course.courseId.startsWith("STAT4")
    );
    if (additionalMathStat) {
      if (isCourseCompleted(additionalMathStat, completedSemesters)) {
        mathCompleted++;
      } else {
        mathPlanned++;
      }
    }

    // Calculate areas
    const areaAssignments: Record<number, (Course & { semester: string; completed: boolean })[]> = { 
      1: [], 2: [], 3: [], 4: [], 5: [], 0: [] 
    };
    const upperLevelCSCourses = courses.filter(
      (course) =>
        (course.courseId.startsWith('CMSC3') || course.courseId.startsWith('CMSC4')) &&
        course.courseId !== 'CMSC351' &&
        course.courseId !== 'CMSC330'
    );
    const areaSet = new Set<number>();
    upperLevelCSCourses.forEach((course) => {
      const areas = courseAreas[course.courseId] || [];
      const courseWithStatus = {
        ...course,
        completed: isCourseCompleted(course, completedSemesters),
      };

      if (areas.length === 0) {
        areaAssignments[0].push(courseWithStatus);
      } else {
        let chosenArea = areas[0];
        let minCount = areaAssignments[chosenArea].length;
        areas.forEach((a) => {
          if (areaAssignments[a].length < minCount) {
            chosenArea = a;
            minCount = areaAssignments[a].length;
          }
        });
        areaAssignments[chosenArea].push(courseWithStatus);
      }
    });

    const hasThreeAreas = areaSet.size >= 3;

    return {
      lowerLevelCS: { completed: csCompleted, planned: csPlanned, total: 6 },
      lowerLevelMath: { completed: mathCompleted, planned: mathPlanned, total: 4 },
      areas: { completed: hasThreeAreas ? 1 : 0, total: 1 },
      track: {
        completed: initialTrackReqs.requirements.filter(req => req.completed).length,
        total: initialTrackReqs.requirements.length
      }
    };
  });
  
  // Update track requirements when track or courses change
  useMemo(() => {
    const newTrackRequirements = computeTrackRequirements(courses, currentTrack);
    setTrackRequirements(newTrackRequirements);
  }, [courses, currentTrack]);

  // Update chart summary when any requirements change
  useMemo(() => {
    const LowerLevelCSRequirements = ["CMSC131", "CMSC132", "CMSC216", "CMSC250", "CMSC330", "CMSC351"];
    
    let csCompleted = 0;
    let csPlanned = 0;
    LowerLevelCSRequirements.forEach(courseId => {
      const course = courses.find(c => c.courseId === courseId);
      if (course) {
        if (isCourseCompleted(course, completedSemesters)) {
          csCompleted++;
        } else {
          csPlanned++;
        }
      }
    });

    let mathCompleted = 0;
    let mathPlanned = 0;
    
    // MATH140 and MATH141
    ["MATH140", "MATH141"].forEach(courseId => {
      const course = courses.find(c => c.courseId === courseId);
      if (course) {
        if (isCourseCompleted(course, completedSemesters)) {
          mathCompleted++;
        } else {
          mathPlanned++;
        }
      }
    });
    
    // STAT4XX course
    const stat4Course = courses.find(course => course.courseId.startsWith("STAT4"));
    if (stat4Course) {
      if (isCourseCompleted(stat4Course, completedSemesters)) {
        mathCompleted++;
      } else {
        mathPlanned++;
      }
    }
    
    // Additional MATH/STAT course
    const additionalMathStat = courses.find(course => 
      (course.courseId.startsWith("MATH") || course.courseId.startsWith("STAT")) &&
      course.courseId !== "MATH140" &&
      course.courseId !== "MATH141" &&
      !course.courseId.startsWith("STAT4")
    );
    if (additionalMathStat) {
      if (isCourseCompleted(additionalMathStat, completedSemesters)) {
        mathCompleted++;
      } else {
        mathPlanned++;
      }
    }

    const upperLevelCSCourses = courses.filter(
      (course) =>
        (course.courseId.startsWith('CMSC3') || course.courseId.startsWith('CMSC4')) &&
        course.courseId !== 'CMSC351' &&
        course.courseId !== 'CMSC330'
    );
    const areaSet = new Set<number>();
    upperLevelCSCourses.forEach((course) => {
      const areas = courseAreas[course.courseId] || [];
      areas.forEach(area => areaSet.add(area));
    });
    const hasThreeAreas = areaSet.size >= 3;

    const newChartSummary = {
      lowerLevelCS: { completed: csCompleted, planned: csPlanned, total: 6 },
      lowerLevelMath: { completed: mathCompleted, planned: mathPlanned, total: 4 },
      areas: { completed: hasThreeAreas ? 1 : 0, total: 1 },
      track: {
        completed: trackRequirements.requirements.filter(req => req.completed).length,
        total: trackRequirements.requirements.length
      }
    };

    // Update chart summary state if values changed
    setChartSummary(prev => {
      const hasChanged = JSON.stringify(prev) !== JSON.stringify(newChartSummary);
      return hasChanged ? newChartSummary : prev;
    });
  }, [courses, trackRequirements, isCourseCompleted]);
  
  const contextValue = useMemo(() => {
    // Compute other requirements for the context
    const LowerLevelCSRequirements = ["CMSC131", "CMSC132", "CMSC216", "CMSC250", "CMSC330", "CMSC351"];
    const csRequirements: RequirementStatus[] = LowerLevelCSRequirements.map(courseId => {
      const course = courses.find(c => c.courseId === courseId);
      const completed = course ? isCourseCompleted(course, completedSemesters) : false;
      const planned = course ? !completed : false;
      
      return {
        id: courseId,
        displayName: courseId,
        completed,
        planned,
        details: course?.semester || ''
      };
    });

    const stat4xxCourses = courses.filter(course => course.courseId.startsWith("STAT4"));
    const mathStatCourses = courses.filter(course => 
      (course.courseId.startsWith("MATH") || course.courseId.startsWith("STAT")) &&
      course.courseId !== "MATH140" &&
      course.courseId !== "MATH141" &&
      !course.courseId.startsWith("STAT4")
    );

    const mathRequirements: RequirementStatus[] = [
      {
        id: "MATH140",
        displayName: "MATH140",
        completed: (() => {
          const course = courses.find(c => c.courseId === "MATH140");
          return course ? isCourseCompleted(course, completedSemesters) : false;
        })(),
        planned: (() => {
          const course = courses.find(c => c.courseId === "MATH140");
          return course ? !isCourseCompleted(course, completedSemesters) : false;
        })(),
        details: courses.find(c => c.courseId === "MATH140")?.semester || ''
      },
      {
        id: "MATH141",
        displayName: "MATH141",
        completed: (() => {
          const course = courses.find(c => c.courseId === "MATH141");
          return course ? isCourseCompleted(course, completedSemesters) : false;
        })(),
        planned: (() => {
          const course = courses.find(c => c.courseId === "MATH141");
          return course ? !isCourseCompleted(course, completedSemesters) : false;
        })(),
        details: courses.find(c => c.courseId === "MATH141")?.semester || ''
      },
      {
        id: "STAT4XX",
        displayName: stat4xxCourses.length > 0 ? `STAT4XX : ${stat4xxCourses[0].courseId}` : "STAT4XX",
        completed: stat4xxCourses.length > 0 ? isCourseCompleted(stat4xxCourses[0], completedSemesters) : false,
        planned: stat4xxCourses.length > 0 ? !isCourseCompleted(stat4xxCourses[0], completedSemesters) : false,
        details: stat4xxCourses[0]?.semester || ''
      },
      {
        id: "MATH_STATXXX",
        displayName: mathStatCourses.length > 0 ? `MATH/STATXXX : ${mathStatCourses[0].courseId}` : "MATH / STATXXX",
        completed: mathStatCourses.length > 0 ? isCourseCompleted(mathStatCourses[0], completedSemesters) : false,
        planned: mathStatCourses.length > 0 ? !isCourseCompleted(mathStatCourses[0], completedSemesters) : false,
        details: mathStatCourses[0]?.semester || ''
      }
    ];

    const lowerLevel: LowerLevelRequirementStatus = {
      cs: csRequirements,
      math: mathRequirements,
      allMet: [...csRequirements, ...mathRequirements].every(req => req.completed)
    };

    const upperLevelCSCourses = courses.filter(
      (course) =>
        (course.courseId.startsWith('CMSC3') || course.courseId.startsWith('CMSC4')) &&
        course.courseId !== 'CMSC351' &&
        course.courseId !== 'CMSC330'
    );

    const areaAssignments: Record<number, (Course & { semester: string; completed: boolean })[]> = { 
      1: [], 2: [], 3: [], 4: [], 5: [], 0: [] 
    };

    upperLevelCSCourses.forEach((course) => {
      const areas = courseAreas[course.courseId] || [];
      const courseWithCompleted = {
        ...course,
        completed: isCourseCompleted(course, completedSemesters),
      };
      if (areas.length === 0) {
        areaAssignments[0].push(courseWithCompleted);
      } else {
        let chosenArea = areas[0];
        let minCount = areaAssignments[chosenArea].length;
        areas.forEach((a) => {
          if (areaAssignments[a].length < minCount) {
            chosenArea = a;
            minCount = areaAssignments[a].length;
          }
        });
        areaAssignments[chosenArea].push(courseWithCompleted);
      }
    });

    let areaCourseCount = 0;
    let areaSet = new Set<number>();
    let completedCount = 0;
    let plannedCount = 0;

    Object.entries(areaAssignments).forEach(([areaNum, areaCourses]) => {
      const num = parseInt(areaNum);
      if (num === 0) return;

      const fourHundreds = areaCourses.filter(c => c.courseId.startsWith("CMSC4"));
      const valid = fourHundreds.slice(0, 3);

      areaCourseCount += valid.length;
      if (valid.length > 0) areaSet.add(num);
        areaCourses.forEach(c => {
        if (c.completed) {
          completedCount++;
        } else {
          plannedCount++;
        }
      });
    });

    const hasThreeAreas = areaSet.size >= 3;

    const areas: AreaRequirementStatus = {
      areaAssignments,
      areaCourseCount,
      coveredAreas: areaSet,
      hasThreeAreas,
      satisfied: hasThreeAreas,
      completedCount,
      plannedCount,
    };


    return {
      courses,
      lowerLevel,
      areas,
      trackRequirements,
      currentTrack,
      updateTrack: setCurrentTrack,
      chartSummary // Use the state version
    };
  }, [courses, trackRequirements, chartSummary, currentTrack, completedSemesters]);

  return (
    <MajorRequirementsContext.Provider value={contextValue}>
      {children}
    </MajorRequirementsContext.Provider>
  );
};

// Helper function to compute track requirements
function computeTrackRequirements(
  courses: (Course & { semester: string })[],
  track: CsSpecializations | undefined
): TrackRequirementStatus {
  if (!track) {
    return {
      track,
      requirements: [],
      allMet: false
    };
  }

  let requirements: RequirementStatus[] = [];

  switch (track) {
    case "GENERAL":
      requirements = computeGeneralTrackRequirements(courses);
      break;
    case "CYBERSECURITY":
      requirements = computeCybersecurityTrackRequirements(courses);
      break;
    case "DATA_SCIENCE":
      requirements = computeDataScienceTrackRequirements(courses);
      break;
    case "QUANTUM":
      requirements = computeQuantumTrackRequirements(courses);
      break;
    case "ML":
      requirements = computeMLTrackRequirements(courses);
      break;
  }

  return {
    track,
    requirements,
    allMet: requirements.every(req => req.completed)
  };
}

function computeGeneralTrackRequirements(courses: (Course & { semester: string })[]): RequirementStatus[] {
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
    return areas && areas.length === 0;
  });

  const is400LevelComplete = total400LevelCourses >= 5 && coveredAreas.size >= 3;
  const isElectivesComplete = electiveCourses.length >= 2 && electiveCourses.reduce((sum, course) => sum + course.credits, 0) >= 6;

  return [
    {
      id: "400_level_areas",
      displayName: "5 CMSC 400 level courses from at least 3 different areas",
      completed: is400LevelComplete,
      planned: false,
      progress: { current: Math.min(total400LevelCourses, 5), total: 5 },
      details: `${total400LevelCourses}/5 courses, ${coveredAreas.size}/3 areas`
    },
    {
      id: "electives",
      displayName: "2 CMSC electives totaling 6 credits",
      completed: isElectivesComplete,
      planned: false,
      progress: { current: Math.min(electiveCourses.length, 2), total: 2 },
      details: `${electiveCourses.length}/2 courses, ${electiveCourses.reduce((sum, course) => sum + course.credits, 0)}/6 credits`
    }
  ];
}

function computeCybersecurityTrackRequirements(courses: (Course & { semester: string })[]): RequirementStatus[] {
  const requiredCourses = ["CMSC414", "CMSC456"];
  const completedRequired = courses.filter(course => requiredCourses.includes(course.courseId));

  const chooseFromCourses = ["CMSC411", "CMSC412", "CMSC417", "CMSC430", "CMSC433", "CMSC451"];
  const completedChooseFrom = courses.filter(course => chooseFromCourses.includes(course.courseId));

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

  return [
    {
      id: "required",
      displayName: "Required: CMSC 414 and CMSC 456",
      completed: completedRequired.length >= 2,
      planned: false,
      progress: { current: completedRequired.length, total: 2 },
      courses: completedRequired.map(c => c.courseId)
    },
    {
      id: "choose_four",
      displayName: "Choose 4 from: CMSC 411, 412, 417, 430, 433, 451",
      completed: completedChooseFrom.length >= 4,
      planned: false,
      progress: { current: completedChooseFrom.length, total: 4 },
      courses: completedChooseFrom.map(c => c.courseId)
    },
    {
      id: "ulec",
      displayName: "Upper Level Elective: 3 credits from CMSC 300-400 level",
      completed: ulecCourses.reduce((sum, course) => sum + course.credits, 0) >= 3,
      planned: false,
      details: `${ulecCourses.reduce((sum, course) => sum + course.credits, 0)}/3 credits`,
      courses: ulecCourses.map(c => c.courseId)
    }
  ];
}

function computeDataScienceTrackRequirements(courses: (Course & { semester: string })[]): RequirementStatus[] {
  const mathOptions = ["MATH240", "MATH461", "MATH341"];
  const otherRequired = ["STAT400", "CMSC320", "CMSC422", "CMSC424"];
  
  const completedMath = courses.filter(course => mathOptions.includes(course.courseId));
  const completedOtherRequired = courses.filter(course => otherRequired.includes(course.courseId));

  const chooseOneGroup1 = ["CMSC420", "CMSC421", "CMSC423", "CMSC425", "CMSC426", "CMSC427", "CMSC470"];
  const completedChooseOne1 = courses.filter(course => chooseOneGroup1.includes(course.courseId));

  const chooseOneGroup2 = ["CMSC451", "CMSC454", "CMSC460"];
  const completedChooseOne2 = courses.filter(course => chooseOneGroup2.includes(course.courseId));

  const chooseTwoGroup = ["CMSC411", "CMSC412", "CMSC414", "CMSC417", "CMSC430", "CMSC433", "CMSC434", "CMSC435"];
  const completedChooseTwo = courses.filter(course => chooseTwoGroup.includes(course.courseId));

  return [
    {
      id: "math_req",
      displayName: "One math course: MATH240 or MATH461 or MATH341",
      completed: completedMath.length >= 1,
      planned: false,
      courses: completedMath.map(c => c.courseId)
    },
    {
      id: "other_required",
      displayName: "Required: STAT400, CMSC320, CMSC422, CMSC424",
      completed: completedOtherRequired.length >= 4,
      planned: false,
      progress: { current: completedOtherRequired.length, total: 4 },
      courses: completedOtherRequired.map(c => c.courseId)
    },
    {
      id: "choose_one_1",
      displayName: "Choose 1 from: CMSC 420, 421, 423, 425, 426, 427, or 470",
      completed: completedChooseOne1.length >= 1,
      planned: false,
      courses: completedChooseOne1.map(c => c.courseId)
    },
    {
      id: "choose_one_2",
      displayName: "Choose 1 from: CMSC 451, 454, or 460",
      completed: completedChooseOne2.length >= 1,
      planned: false,
      courses: completedChooseOne2.map(c => c.courseId)
    },
    {
      id: "choose_two",
      displayName: "Choose 2 from: CMSC 411, 412, 414, 417, 430, 433, 434, or 435",
      completed: completedChooseTwo.length >= 2,
      planned: false,
      progress: { current: completedChooseTwo.length, total: 2 },
      courses: completedChooseTwo.map(c => c.courseId)
    }
  ];
}

function computeQuantumTrackRequirements(courses: (Course & { semester: string })[]): RequirementStatus[] {
  const mathOptions = ["MATH240", "MATH461", "MATH341"];
  const otherRequired = ["CMSC457", "PHYS467"];
  
  const completedMath = courses.filter(course => mathOptions.includes(course.courseId));
  const completedOtherRequired = courses.filter(course => otherRequired.includes(course.courseId));

  const completedAreaCourses = courses.filter(course => {
    const areas = courseAreas[course.courseId];
    return areas && areas.length > 0;
  });

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
      areas && areas.length === 0
    );
  });

  return [
    {
      id: "math_req",
      displayName: "One math course: MATH 240 or MATH 461 or MATH 341",
      completed: completedMath.length >= 1,
      planned: false,
      courses: completedMath.map(c => c.courseId)
    },
    {
      id: "other_required",
      displayName: "Required: CMSC457, PHYS467",
      completed: completedOtherRequired.length >= 2,
      planned: false,
      progress: { current: completedOtherRequired.length, total: 2 },
      courses: completedOtherRequired.map(c => c.courseId)
    },
    {
      id: "area_courses",
      displayName: "Choose 4 courses from Areas 1-5",
      completed: completedAreaCourses.length >= 4,
      planned: false,
      progress: { current: completedAreaCourses.length, total: 4 },
      courses: completedAreaCourses.map(c => c.courseId)
    },
    {
      id: "two_areas_outside_4",
      displayName: "2 of the 4 courses must be from 2 separate areas outside Area 4",
      completed: coveredNonArea4Areas.size >= 2 && nonArea4Courses.length >= 2,
      planned: false,
      details: `${nonArea4Courses.length}/2 courses, ${coveredNonArea4Areas.size}/2 areas`
    },
    {
      id: "ulec",
      displayName: "Upper Level Elective: 3 credits from CMSC 300-400 level",
      completed: ulecCourses.reduce((sum, course) => sum + course.credits, 0) >= 3,
      planned: false,
      details: `${ulecCourses.reduce((sum, course) => sum + course.credits, 0)}/3 credits`,
      courses: ulecCourses.map(c => c.courseId)
    }
  ];
}

function computeMLTrackRequirements(courses: (Course & { semester: string })[]): RequirementStatus[] {
  const mathOptions = ["MATH240", "MATH461", "MATH341"];
  const otherRequired = ["CMSC320", "CMSC421", "CMSC422"];
  
  const completedMath = courses.filter(course => mathOptions.includes(course.courseId));
  const completedOtherRequired = courses.filter(course => otherRequired.includes(course.courseId));

  const chooseTwoCourses = ["CMSC426", "CMSC460", "CMSC466", "MATH401", "CMSC470", "CMSC472", "CMSC473", "CMSC474"];
  const completedChooseTwo = courses.filter(course => chooseTwoCourses.includes(course.courseId));

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
      areas && areas.length === 0
    );
  });

  return [
    {
      id: "math_req",
      displayName: "One math course: MATH240 or MATH461 or MATH341",
      completed: completedMath.length >= 1,
      planned: false,
      courses: completedMath.map(c => c.courseId)
    },
    {
      id: "other_required",
      displayName: "Required: CMSC320, CMSC421, and CMSC422",
      completed: completedOtherRequired.length >= 3,
      planned: false,
      progress: { current: completedOtherRequired.length, total: 3 },
      courses: completedOtherRequired.map(c => c.courseId)
    },
    {
      id: "choose_two",
      displayName: "Choose 2 from: MATH401, CMSC426, 460/466, 470, 472, 473, or 474",
      completed: completedChooseTwo.length >= 2,
      planned: false,
      progress: { current: completedChooseTwo.length, total: 2 },
      courses: completedChooseTwo.map(c => c.courseId)
    },
    {
      id: "ulec",
      displayName: "Upper Level Electives: 6 credits from CMSC 300-400 level",
      completed: ulecCourses.reduce((sum, course) => sum + course.credits, 0) >= 6,
      planned: false,
      details: `${ulecCourses.reduce((sum, course) => sum + course.credits, 0)}/6 credits`,
      courses: ulecCourses.map(c => c.courseId)
    }
  ];
}

export const useMajorRequirements = () => {
  const context = useContext(MajorRequirementsContext);
  if (context === undefined) {
    throw new Error("useMajorRequirements must be used within a MajorRequirementsProvider");
  }
  return context;
};