import { Term } from "@/lib/utils/types";

export type TranscriptTerm = "Spring" | "Summer" | "Fall" | "Winter";
export type SemesterDTO = {
  term: TranscriptTerm;
  year: number;
};

export type CourseDTO = {
  courseCode: string;
  semester: SemesterDTO;
};

export type TransferCreditDTO = {
  courseCode: string;
  courseName: string;
  credits: number | null;
  sourceInstitution: string | null;
  genEds: string;
};

export type TranscriptParseRequest = {
  transcriptText: string;
  filename?: string;
};

export type TranscriptParseResponse = {
  startSemester: SemesterDTO | null;
  graduationSemester: SemesterDTO | null;
  major: string | null;
  specialization: string | null;
  minor: string | null;
  transferCredits: TransferCreditDTO[];
  completedCourses: CourseDTO[];
};

export type ExtractedTextValues = {
  major: string | null;
  specialization: string | null;
  minor: string | null;
  startTerm: Term | null;
  startYear: number | null;
  endTerm: Term | null;
  endYear: number | null;
  transferCredits: {
    name: string;
    courseId: string;
    genEds: string;
    credits?: number | null;
    sourceInstitution?: string | null;
  }[];
  completedCourses: {
    term: Term;
    year: number;
    courseId: string;
    name?: string | null;
    credits?: number | null;
  }[];
};

export type TranscriptParsingResult =
  | {
      success: true;
      text: string;
      filename: string;
      parsed: ExtractedTextValues;
      rawParsed: TranscriptParseResponse;
    }
  | {
      error: string;
      details?: string;
    };
