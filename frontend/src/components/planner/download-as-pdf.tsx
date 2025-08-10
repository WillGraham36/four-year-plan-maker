'use client';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { SemesterSchema, CourseSchema } from '@/lib/utils/schemas';
import { SemesterDateDescriptor, UserInfo } from '@/lib/utils/types';
import { z } from 'zod';
import { extractSemester } from '@/lib/utils';

// Define the course type from your schema
type Course = z.infer<typeof CourseSchema>;

interface AcademicYear {
  year: number;
  semesters: SemesterDateDescriptor[];
}

interface AcademicTranscriptPDFProps {
  semesters: SemesterSchema;
  academicYears: AcademicYear[];
}

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: 'white'
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold'
  },
  yearSection: {
    marginBottom: 15
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    backgroundColor: '#09090b', // bg-background equivalent
    color: 'white',
    padding: 8,
    borderRadius: 4
  },
  semesterRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'stretch' // Ensure all tables in row have equal height
  },
  semesterTable: {
    flex: 1,
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#e4e4e7', // border color
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch' // Match height with sibling tables in the row
  },
  lastSemesterTable: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4e4e7', // border color
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'stretch' // Match height with sibling tables in the row
  },
  semesterHeader: {
    backgroundColor: '#f4f4f5', // bg-card equivalent (zinc-100)
    padding: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    fontSize: 10
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5', // bg-card equivalent (zinc-100)
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7'
  },
  headerCell: {
    padding: 4,
    fontWeight: 'bold',
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#e4e4e7'
  },
  courseIdHeader: {
    width: '25%'
  },
  courseNameHeader: {
    width: '55%'
  },
  creditsHeader: {
    width: '20%',
    borderRightWidth: 0 // Remove border from last column
  },
  // Container for course rows with flex: 1 to push total credits to bottom
  courseRowsContainer: {
    backgroundColor: 'white',
    flexGrow: 1 // Use flexGrow instead of flex: 1 to allow natural sizing
  },
  courseRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f4f4f5',
    minHeight: 20, // Ensure consistent row height
    backgroundColor: 'white',
    alignItems: 'center' // Center content vertically in each row
  },
  courseCell: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#f4f4f5'
  },
  courseIdCell: {
    width: '25%'
  },
  courseNameCell: {
    width: '55%'
  },
  creditsCell: {
    width: '20%',
    textAlign: 'center',
    borderRightWidth: 0 // Remove border from last column
  },
  emptySemester: {
    padding: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#71717a', // text-muted-foreground equivalent
    backgroundColor: 'white',
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40 // Minimum height for empty semester display
  },
  offTermRow: {
    marginBottom: 8
  },
  totalCredits: {
    padding: 6,
    backgroundColor: '#f4f4f5', // bg-card equivalent (zinc-100)
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    marginTop: 'auto' // This pushes it to the bottom
  }
});


// Component to render a single semester table
const SemesterTable: React.FC<{ 
  title: string; 
  courses: Course[]; 
  isLast?: boolean;
}> = ({ title, courses, isLast = false }) => {
  const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <View style={isLast ? styles.lastSemesterTable : styles.semesterTable}>
      <Text style={styles.semesterHeader}>{title}</Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.courseIdHeader]}>Course ID</Text>
        <Text style={[styles.headerCell, styles.courseNameHeader]}>Course Name</Text>
        <Text style={[styles.headerCell, styles.creditsHeader]}>Credits</Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.courseRowsContainer}>
          <Text style={styles.emptySemester}>No courses</Text>
        </View>
      ) : (
        <View style={styles.courseRowsContainer}>
          {courses.map((course, index) => (
            <View key={`${course.courseId}-${index}`} style={styles.courseRow}>
              <Text style={[styles.courseCell, styles.courseIdCell]}>{course.courseId}</Text>
              <Text style={[styles.courseCell, styles.courseNameCell]}>{course.name}</Text>
              <Text style={[styles.courseCell, styles.creditsCell]}>{course.credits}</Text>
            </View>
          ))}
        </View>
      )}

      {courses.length > 0 && (
        <Text style={styles.totalCredits}>Total: {totalCredits} credits</Text>
      )}
    </View>
  );
};

// Component to render off-term semesters (Winter/Summer)
const OffTermRow: React.FC<{
  semesters: SemesterDateDescriptor[];
  semesterData: SemesterSchema;
}> = ({ semesters, semesterData }) => {
  const offTermSemesters = semesters.filter(sem => sem.term === 'WINTER' || sem.term === 'SUMMER');
  
  if (offTermSemesters.length === 0) return null;

  return (
    <View style={styles.offTermRow}>
      <View style={styles.semesterRow}>
        {offTermSemesters.map((semester, index) => {
          const courses = extractSemester(semesterData, semester.term, semester.year);
          const title = `${semester.term.charAt(0)}${semester.term.slice(1).toLowerCase()} ${semester.year}`;
          
          return (
            <SemesterTable 
              key={`${semester.term}-${semester.year}`}
              title={title}
              courses={courses}
              isLast={index === offTermSemesters.length - 1}
            />
          );
        })}
      </View>
    </View>
  );
};

// Main PDF Document component
const AcademicTranscriptPDF: React.FC<AcademicTranscriptPDFProps> = ({ semesters, academicYears }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Academic Transcript</Text>
        
        {academicYears.map((academicYear) => {
          // Find Fall and Spring semesters for main row
          const fallSemester = academicYear.semesters.find(sem => sem.term === 'FALL');
          const springSemester = academicYear.semesters.find(sem => sem.term === 'SPRING');
          
          // Get course data
          const fallCourses = fallSemester ? (extractSemester(semesters, fallSemester.term, fallSemester.year)) : [];
          const springCourses = springSemester ? (extractSemester(semesters, springSemester.term, springSemester.year)) : [];
          
          // Determine display year range
          const fallYear = fallSemester?.year;
          const springYear = springSemester?.year;
          const yearRange = fallYear && springYear ? `${fallYear}-${springYear}` : 
                           fallYear ? `${fallYear}-${fallYear + 1}` :
                           springYear ? `${springYear - 1}-${springYear}` : `Year ${academicYear.year}`;
          
          return (
            <View key={academicYear.year} style={styles.yearSection}>
              <Text style={styles.yearTitle}>Academic Year {yearRange}</Text>
              
              {/* Main semester row (Fall/Spring) */}
              <View style={styles.semesterRow}>
                <SemesterTable 
                  title={fallSemester ? `Fall ${fallSemester.year}` : 'Fall (No courses)'}
                  courses={fallCourses}
                />
                <SemesterTable 
                  title={springSemester ? `Spring ${springSemester.year}` : 'Spring (No courses)'}
                  courses={springCourses}
                  isLast={true}
                />
              </View>

              {/* Off-term semesters (Winter/Summer) */}
              <OffTermRow 
                semesters={academicYear.semesters}
                semesterData={semesters}
              />
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

export default AcademicTranscriptPDF;