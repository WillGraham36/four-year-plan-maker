import { z } from "zod";

export const termSchema = z.enum([
  "FALL",
  "SPRING",
  "SUMMER",
  "WINTER",
  "TRANSFER",
]);

export const semesterSchema = z.object({
  term: termSchema,
  year: z.union([z.number(), z.string().trim().regex(/^-?\d+$/)])
    .pipe(z.coerce.number().int().min(-1).max(2200)),
});

export const courseInputSchema = z.object({
  courseId: z.string().min(5).max(16),
  name: z.string().max(500).default(""),
  credits: z.number().int().min(0).max(30),
  genEds: z.array(z.array(z.string())).default([]),
});

export const coursePlacementSchema = z.object({
  course: courseInputSchema,
  semester: semesterSchema,
  index: z.number().int().min(0),
});

export const coursePlacementsSchema = z.array(coursePlacementSchema).max(200);

export const courseIdentifierSchema = z.object({
  courseId: z.string().min(5).max(16),
  semester: semesterSchema,
});

export const courseIdentifiersSchema = z.array(courseIdentifierSchema).max(200);

export const onboardingSchema = z.object({
  startTerm: termSchema.exclude(["TRANSFER"]),
  startYear: z.coerce.number().int().min(2000).max(2200),
  endTerm: termSchema.exclude(["TRANSFER"]),
  endYear: z.coerce.number().int().min(2000).max(2200),
  major: z.string().trim().min(1).max(200),
  minor: z.string().max(200).nullish().transform((value) => value ?? ""),
  track: z.enum(["GENERAL", "DATA_SCIENCE", "QUANTUM", "CYBERSECURITY", "ML"]).nullish(),
  transferCredits: z.array(z.object({
    name: z.string().max(500).nullish().transform((value) => value ?? ""),
    course: courseInputSchema,
    semester: semesterSchema,
    genEdOverrides: z.array(z.array(z.string())).default([]),
  })).default([]),
});

const submissionCourseIdSchema = z.string().trim().toUpperCase().regex(/^[A-Z]{4}[0-9]{3}[A-Z]{0,2}$/);
const submissionTermSchema = z.string().toUpperCase().pipe(termSchema.exclude(["TRANSFER"]));

export const onboardingSubmissionSchema = onboardingSchema.omit({ track: true, transferCredits: true }).extend({
  startTerm: submissionTermSchema,
  endTerm: submissionTermSchema,
  csSpecialization: onboardingSchema.shape.track,
  transferCredits: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    courseId: submissionCourseIdSchema,
    genEds: z.string().trim().toUpperCase().default(""),
  })).max(200).default([]),
  completedCourses: z.array(z.object({
    courseId: submissionCourseIdSchema,
    term: submissionTermSchema,
    year: z.coerce.number().int().min(2000).max(2200),
  })).max(200).default([]),
});
