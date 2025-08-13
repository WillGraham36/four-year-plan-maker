import { OnboardingFormValues } from './../../components/onboarding/onboarding-form';
import { Course } from '@/lib/utils/types';
import { z } from "zod";

export const CourseInfoSchema = z.object({
  course_id: z.string(),
  name: z.string(),
  description: z.string(),
  credits: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  gen_ed: z.array(z.array(z.string())).optional(),
})

export const CourseSchema = z.object({
  courseId: z.string(),
  name: z.string(),
  credits: z.number(),
  genEds: z.array(z.array(z.string())),
  selectedGenEds: z.array(z.string()).optional().nullable(),
  index: z.number().optional().nullable(),
});

export const SemestersSchema = z.record(z.string(), z.array(CourseSchema));
export type SemesterSchema = z.infer<typeof SemestersSchema>;

export const ULConcentrationSchema = z.object({
  concentration: z.string(),
  courses: z.array(z.object({
    courseId: z.string(),
    semester: z.object({
      term: z.string(),
      year: z.number(),
    }),
    credits: z.number(),
  })),
})

export type ULCoursesInfo = z.infer<typeof ULConcentrationSchema.shape.courses>;

export type Semesters = z.infer<typeof SemestersSchema>;

export const GenEdListSchema = z.array(z.object({
  genEd: z.string(),
  courseId: z.string(),
  semesterName: z.string(),
  transferCreditName: z.string().optional().nullable(),
}));

export type GenEdList = z.infer<typeof GenEdListSchema>;
export type GenEd = z.infer<typeof GenEdListSchema>[number];

export const OnboardingFormInitialValuesSchema = z.object({
  startTerm: z.string(),
  startYear: z.preprocess(val => {
    if (typeof val === 'number') return val.toString();
    return val;
  }, z.string()),
  endTerm: z.string(),
  endYear: z.preprocess(val => {
    if (typeof val === 'number') return val.toString();
    return val;
  }, z.string()),
  major: z.string(),
  csSpecialization: z.string().optional().nullable().default(""),
  minor: z.string().optional().nullable().default(""),
  transferCredits: z.array(z.object({
    name: z.string().optional(),
    courseId: z.string().optional(),
    genEdOverrides: z.array(z.array(z.string())).optional().nullable(),
  })).optional().nullable().default([]),
});