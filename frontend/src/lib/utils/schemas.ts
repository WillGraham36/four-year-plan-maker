import { z } from "zod";

export const CourseInfoSchema = z.object({
  course_id: z.string(),
  name: z.string(),
  description: z.string(),
  credits: z.union([z.string(), z.number()]).transform((val) => Number(val)),
  gen_ed: z.array(z.array(z.string())).optional(),
  relationships: z.object({
    prereqs: z.union([z.string(), z.null()]).optional(),
  }).optional(),
})