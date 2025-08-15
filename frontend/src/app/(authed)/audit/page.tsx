import LowerLevelRequirements from '@/components/audit/lower-level-reqs';
import { getAllSemesters } from '@/lib/api/planner/planner.server'
import { Course } from '@/lib/utils/types';
import React from 'react'

const formatSemester = (semesterName: string): string => {
  // Extract term and year using regex
  const match = semesterName.match(/Semester\(term=(\w+), year=(-?\d+)\)/);
  if (!match) return semesterName; // fallback if format doesn't match
  
  const [, term, year] = match;
  
  if (term === 'TRANSFER') {
    return 'Transfer Credit';
  }
  
  // Capitalize first letter and lowercase the rest
  const formattedTerm = term.charAt(0) + term.slice(1).toLowerCase();
  return `${formattedTerm} ${year}`;
};

const AuditPage = async () => {
  const semesters = await getAllSemesters();
  const allCourses = Object.entries(semesters)
  .flatMap(([semesterName, courses]) => 
    courses.map(course => ({ ...course, semester: formatSemester(semesterName) }))
  ) as (Course & { semester: string })[];

  return (
    <main>
      <LowerLevelRequirements courses={allCourses} />
    </main>
  )
}

export default AuditPage