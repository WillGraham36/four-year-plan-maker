import { z } from "zod";
import { requireUserId } from "@/server/auth/current-session";
import { ok, readJson, route } from "@/server/http/api-response";
import { updateSemesterCompletion } from "@/server/services/user-service";
import { semesterSchema } from "@/server/validation/domain";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ term: string; year: string }> },
) {
  return route(async () => {
    const [userId, params, body] = await Promise.all([
      requireUserId(),
      context.params,
      readJson(request),
    ]);
    const semester = semesterSchema.parse({ term: params.term, year: params.year });
    const { completed } = z.object({ completed: z.boolean() }).parse(body);
    await updateSemesterCompletion(userId, semester, completed);
    return ok("Semester completion updated successfully");
  });
}
