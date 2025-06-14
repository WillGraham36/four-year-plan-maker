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
});

export const SemestersSchema = z.record(z.string(), z.array(CourseSchema));

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
}));

export type GenEdList = z.infer<typeof GenEdListSchema>;
export type GenEd = z.infer<typeof GenEdListSchema>[number];