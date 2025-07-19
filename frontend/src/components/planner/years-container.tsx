'use client';
import { SemesterDateDescriptor, UserInfo } from "@/lib/utils/types";
import Year from "./year";
import { Semester } from "./semester";
import { extractSemester } from "@/lib/utils";
import { SemesterSchema } from "@/lib/utils/schemas";

const YearsContainer = ({ userInfo, semesters }: { userInfo: UserInfo | null, semesters: SemesterSchema }) => {
  if (!userInfo || !userInfo.startSemester || !userInfo.endSemester) return null;
  const academicYears = generateAcademicYears(userInfo);

  return (
    <>
      {academicYears.map(({ year, semesters: yearSemesters }) => (
        <Year key={year} year={year}>
          {yearSemesters.map(semester => (
            <Semester
              key={`${semester.term}-${semester.year}`}
              term={semester.term}
              year={semester.year}
              courses={extractSemester(semesters, semester.term, semester.year)}
            />
          ))}
        </Year>
      ))}
    </>
  )
};

// Generate all semesters between start and end, grouped by academic year
const generateAcademicYears = (userInfo: UserInfo): { year: number; semesters: SemesterDateDescriptor[] }[] => {
  const academicYears: { year: number; semesters: SemesterDateDescriptor[] }[] = [];
  let currentSemester = { ...userInfo.startSemester };
  let academicYearNumber = 1;
  let currentAcademicYear: SemesterDateDescriptor[] = [];
  
  while (true) {
    currentAcademicYear.push({ ...currentSemester });
    
    // Check if we've reached the end
    if (currentSemester.term === userInfo.endSemester.term && 
        currentSemester.year === userInfo.endSemester.year) {
      academicYears.push({ year: academicYearNumber, semesters: currentAcademicYear });
      break;
    }
    
    // Move to next semester
    if (currentSemester.term === 'FALL') {
      currentSemester = { term: 'SPRING', year: currentSemester.year + 1 };
    } else if (currentSemester.term === 'SPRING') {
      currentSemester = { term: 'FALL', year: currentSemester.year };
    } else if (currentSemester.term === 'SUMMER') {
      currentSemester = { term: 'FALL', year: currentSemester.year };
    }
    
    // Start new academic year when we hit Fall (or if starting with Spring/Summer)
    if (currentSemester.term === 'FALL' && currentAcademicYear.length > 0) {
      academicYears.push({ year: academicYearNumber, semesters: currentAcademicYear });
      academicYearNumber++;
      currentAcademicYear = [];
    }
  }
  
  return academicYears;
};

export default YearsContainer