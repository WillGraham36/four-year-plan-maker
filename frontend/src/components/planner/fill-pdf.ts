import { extractSemester, termYearToString } from '@/lib/utils';
import { GenEdList, SemesterSchema } from '@/lib/utils/schemas';
import { UserInfo } from '@/lib/utils/types';
import { generateAcademicYears } from './years-container';
import { assignGenEdsToRequirements, GenEdListForRendering } from '../gen-eds/gen-eds-container';

interface FillPDFFormParams {
  userInfo: UserInfo;
  semesters: SemesterSchema;
  totalCredits: number;
  genEds: GenEdList;
}

/**
 * Can throw error if fails, make sure to try catch
 * Has no toasts, even on success
 */
export default async function fillPDFForm({ userInfo, semesters, totalCredits, genEds }: FillPDFFormParams) {
  const academicYears = generateAcademicYears(userInfo);

  // Dynamic import of PDF-lib
  const { PDFDocument } = await import('pdf-lib');
  
  // Fetch the template PDF (you'll need to add this to your public folder)
  const existingPdfBytes = await fetch('/cmsc-graduation-plan-template.pdf').then(res => res.arrayBuffer());
  
  // Load the existing PDF
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
  // Get the form from the PDF
  const form = pdfDoc.getForm();
  
  // Fill in the basic info fields
  // TODO FIX THIS 
  // if (userInfo?.name) {
  //   form.getTextField('Name').setText(userInfo.name); 
  // }
  // if (userInfo?.uid) {
  //   form.getTextField('UID').setText(userInfo.uid);
  // }
  form.getTextField('Name').setText("will graham");
  form.getTextField('UID').setText("123456789");
  form.getTextField('Date').setText(new Date().toLocaleDateString());
  
  // Fill in anticipated graduation date in Text4, Text5, Text6 fields
  if (userInfo?.endSemester) {
    form.getTextField('Text5').setText(`${userInfo.endSemester.term} ${userInfo.endSemester.year}`);
  }

  academicYears.forEach((academicYear, index) => {
    const fallHeaderField = index === 0 ? 'FALL' : `FALL_${index+1}`;
    form.getTextField(fallHeaderField).setText((academicYear.year + userInfo.startSemester.year - 1).toString());

    // Fill in Spring semester header
    const springHeaderField = index === 0 ? 'SPRING' : `SPRING_${index+1}`;
    form.getTextField(springHeaderField).setText((academicYear.year + userInfo.startSemester.year).toString());

    // Fill in Summer semester header
    const summerHeaderField = index === 0 ? 'SUMMER' : `SUMMER_${index+1}`;
    form.getTextField(summerHeaderField).setText((academicYear.year + userInfo.startSemester.year).toString());

    // Fill in January semester header
    const januaryHeaderField = index === 0 ? 'JANUARY' : `JANUARY_${index+1}`;
    form.getTextField(januaryHeaderField).setText((academicYear.year + userInfo.startSemester.year).toString());
  });

  type SemesterKey =
    | "FALL-1" | "FALL-2" | "FALL-3" | "FALL-4"
    | "SPRING-1" | "SPRING-2" | "SPRING-3" | "SPRING-4"
    | "WINTER-1" | "WINTER-2" | "WINTER-3" | "WINTER-4"
    | "SUMMER-1" | "SUMMER-2" | "SUMMER-3" | "SUMMER-4";
  type SemesterKeyNoWinter =
    | "FALL-1" | "FALL-2" | "FALL-3" | "FALL-4"
    | "SPRING-1" | "SPRING-2" | "SPRING-3" | "SPRING-4"
    | "SUMMER-1" | "SUMMER-2" | "SUMMER-3" | "SUMMER-4";

  // format of array: [startCourse, startGenEd, startCredit]
  const startIndicesForSemester = {
    "FALL-1": [0, 0, 0],
    "FALL-2": [16, 6, 7],
    "FALL-3": [22, 12, 14],
    "FALL-4": [28, 18, 21],

    "SPRING-1": [6, 24, 28],
    "SPRING-2": [34, 30, 35],
    "SPRING-3": [40, 36, 42],
    "SPRING-4": [46, 42, 49],
    
    "WINTER-1": [12, 48, 56],
    "WINTER-2": [52, 52, 61],
    "WINTER-3": [56, 56, 66],
    "WINTER-4": [60, 60, 71],

    "SUMMER-1": [13, 49, 57],
    "SUMMER-2": [53, 53, 62],
    "SUMMER-3": [57, 57, 67],
    "SUMMER-4": [61, 61, 72],
  };

  const indicesForTotalCreditsPerSemester = {
    "FALL-1": 6,    // Cr_7
    "FALL-2": 13,   // Cr_14
    "FALL-3": 20,   // Cr_21
    "FALL-4": 27,   // Cr_28

    "SPRING-1": 34, // Cr_35
    "SPRING-2": 41, // Cr_42
    "SPRING-3": 48, // Cr_49
    "SPRING-4": 55, // Cr_56

    "SUMMER-1": 60, // Cr_61
    "SUMMER-2": 65, // Cr_66
    "SUMMER-3": 70, // Cr_71
    "SUMMER-4": 75, // Cr_76
  };

  academicYears.forEach((academicYear, yearIndex) => {
    academicYear.semesters.forEach((semester) => {
      const semesterKey = `${semester.term}-${yearIndex + 1}` as SemesterKey;
      const courses = extractSemester(semesters, semester.term, semester.year);
      
      if (courses.length === 0) return;

      const [startCourse, startGenEd, startCredit] = startIndicesForSemester[semesterKey] || [0, 0, 0];

      // Fill courses
      courses.forEach((course, courseIndex) => {
        const courseField = startCourse + courseIndex;
        const genEdField = startGenEd + courseIndex;
        const creditField = startCredit + courseIndex;

        form.getTextField(courseField === 0 ? 'Course' : `Course_${courseField + 1}`).setText(course.courseId);

        let cleanedGenEds;
        if(course.selectedGenEds) {
          cleanedGenEds = course.selectedGenEds
            .map((genEd: string) => genEd.split('|')[0])
            .join(', ');
        } else {
          cleanedGenEds = course.genEds[0]
            .map((genEd: string) => genEd.split('|')[0])
            .join(', ');
        }
        form.getTextField(genEdField === 0 ? 'GenEd' : `GenEd_${genEdField + 1}`).setText(cleanedGenEds);
        form.getTextField(creditField === 0 ? 'Cr' : `Cr_${creditField + 1}`).setText(course.credits.toString());
      });

        // Fill total credits for this semester (only for FALL, SPRING, SUMMER)
        if (['FALL', 'SPRING', 'SUMMER'].includes(semester.term)) {
          const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
          const creditIndex = indicesForTotalCreditsPerSemester[semesterKey as SemesterKeyNoWinter];
          if (typeof creditIndex !== 'undefined') {
            form.getTextField(`Cr_${creditIndex + 1}`).setText(totalCredits.toString());
          }
        }
    });
  });
  form.getTextField('Cr_77').setText(totalCredits.toString());

  // Set the geneds section
  form.getTextField('GE Course').setText('GenEd Course 1');
  form.getTextField('Semester').setText('GenEd Semester 1');

  GenEdListForRendering.map((genEd, i) => {
    const { courseId, semesterName, transferCreditName } = assignGenEdsToRequirements(genEds)[i];
    const courseName = termYearToString(semesterName);
    form.getTextField(i === 0 ? 'GE Course' : `GE Course_${i + 1}`).setText(transferCreditName ? transferCreditName : courseId);
    form.getTextField(i === 0 ? 'Semester' : `Semester_${i + 1}`).setText(courseName === 'Transfer' ? '---Transfer---' : courseName);
  })

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();

  // Create download
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'filled-graduation-plan.pdf';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  
  return ({
    success: true,
    pdfUrl: url
  })
  
};