import AreaRequirements from '@/components/audit/area-requirements';
import ChartsContainer from '@/components/audit/charts/charts-container';
import { ChartsInfoProvider } from '@/components/audit/charts/charts-context';
import LowerLevelRequirements from '@/components/audit/lower-level-reqs';
import TrackRequirements from '@/components/audit/track-requirements';
import { RequirementsProvider } from '@/components/context/requirements-context';
import { MajorRequirementsProvider } from '@/components/context/major-requirements-context';
import UpperLevelConcentrationContainer from '@/components/ul-concentration/ul-concentration';
import { getAllGenEds, getAllSemesters, getAllULCourses, getUserInfo } from '@/lib/api/planner/planner.server'
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
  const [semesters, genEds, { concentration, courses }, { data: userInfo }] = await Promise.all([
    getAllSemesters(),
    getAllGenEds(),
    getAllULCourses(),
    getUserInfo()
  ]);
  
  const allCourses = Object.entries(semesters)
    .flatMap(([semesterName, courses]) => 
      courses.map(course => ({ ...course, semester: formatSemester(semesterName) }))
    ) as (Course & { semester: string })[];

  const totalCredits = Object.values(semesters)
    .flat()
    .reduce((sum, course) => sum + course.credits, 0);

  return (
    <main className='mx-4 flex flex-col gap-4 mt-4 mb-8'>
      <RequirementsProvider 
        initialGenEds={genEds} 
        initialULCourses={courses} 
        initialTotalCredits={totalCredits}
        userInfo={userInfo}
      >
        <MajorRequirementsProvider 
          courses={allCourses}
          userTrack={userInfo?.track}
          completedSemesters={userInfo?.completedSemesters || []}
        >
          <ChartsInfoProvider allCourses={allCourses}>
            <section>
              <ChartsContainer />
            </section>
            <div className='flex flex-row gap-4'>
              <section className='flex flex-col gap-4 flex-1'>
                <LowerLevelRequirements />
                <AreaRequirements />
              </section>
              <section className='flex flex-col gap-4 flex-1'>
                <UpperLevelConcentrationContainer concentration={concentration} />
                <TrackRequirements initialTrack={userInfo?.track} />
              </section>
            </div>
          </ChartsInfoProvider>
        </MajorRequirementsProvider>
      </RequirementsProvider>
    </main>
  )
}

export default AuditPage;