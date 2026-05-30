import { OnboardingFormValues } from './../../components/onboarding/onboarding-form';
import { Course } from '@/lib/utils/types';
import { z } from "zod";

export const CourseInfoSchema = z.object({
  course_id: z.string(),
  name: z.string(),
  credits: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  gen_ed: z.array(z.array(z.string())).optional(),
})

export const CourseSchema = z.object({
  id: z.number().optional().nullable(),
  courseId: z.string(),
  name: z.string(),
  credits: z.number(),
  genEds: z.array(z.array(z.string())),
  assignedGenEds: z.array(z.string()).optional().nullable(),
  assignedGenEdBranchIndex: z.number().optional().nullable(),
  index: z.number().optional().nullable(),
});

export const CourseAutocompleteSuggestionSchema = z.object({
  courseId: z.string(),
  name: z.string().nullable().optional().default(""),
  credits: z.number().nullable().optional().default(null),
});

export const CourseAutocompleteSuggestionListSchema = z.array(CourseAutocompleteSuggestionSchema);

export const CourseSyncSummarySchema = z.object({
  syncedDepartments: z.array(z.string()),
  coursesInsertedOrUpdated: z.number(),
  errors: z.array(z.string()),
});

export const RequirementProgramTypeSchema = z.enum(["MAJOR", "MINOR", "CERTIFICATE", "PROGRAM"]);
export const RequirementReviewStatusSchema = z.enum(["DRAFT", "APPROVED", "PARSE_ERROR"]);

export const CatalogProgramSchema = z.object({
  programName: z.string(),
  catalogTitle: z.string(),
  programType: RequirementProgramTypeSchema,
  sourceUrl: z.string(),
  catalogYear: z.string().nullable().optional().default(null),
});

export const CatalogProgramListSchema = z.array(CatalogProgramSchema);

export const CurriculumRequirementSummarySchema = z.object({
  id: z.number(),
  programName: z.string(),
  catalogTitle: z.string(),
  programType: RequirementProgramTypeSchema,
  status: RequirementReviewStatusSchema,
  catalogYear: z.string().nullable().optional().default(null),
  sourceUrl: z.string(),
  lastSyncedAt: z.string().nullable().optional().default(null),
  approvedAt: z.string().nullable().optional().default(null),
  updatedAt: z.string().nullable().optional().default(null),
});

export const CurriculumRequirementSummaryListSchema = z.array(CurriculumRequirementSummarySchema);

export const CurriculumRequirementDetailSchema = CurriculumRequirementSummarySchema.extend({
  rawRequirementsText: z.string().nullable().optional().default(null),
  structuredRequirements: z.unknown().optional().default({}),
  parseWarnings: z.array(z.string()).optional().default([]),
  approvedBy: z.string().nullable().optional().default(null),
});

export const CurriculumRequirementSyncSummarySchema = z.object({
  syncedPrograms: z.array(CurriculumRequirementSummarySchema),
  errors: z.array(z.string()),
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
    custom: z.boolean().optional().default(false),
  })),
})

export type ULCoursesInfo = z.infer<typeof ULConcentrationSchema.shape.courses>;

export type Semesters = z.infer<typeof SemestersSchema>;

export const GenEdRequirementListSchema = z.array(z.object({
  requirementName: z.string(),
  satisfiedByGenEd: z.string(),
  courseId: z.string(),
  semesterName: z.string(),
  transferCreditName: z.string().optional().nullable(),
}));

export type GenEdRequirementList = z.infer<typeof GenEdRequirementListSchema>;
export type GenEdRequirement = z.infer<typeof GenEdRequirementListSchema>[number];

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
