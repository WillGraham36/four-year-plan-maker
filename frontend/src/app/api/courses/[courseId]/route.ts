import { ok, route } from "@/server/http/api-response";
import { findOrFetchCourse } from "@/server/services/course-service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  return route(async () => {
    const { courseId } = await context.params;
    return ok(await findOrFetchCourse(courseId));
  });
}

