import { ok, route } from "@/server/http/api-response";
import { findOrFetchCourse } from "@/server/services/course-service";
import { limitPublicCourses } from "@/server/security/abuse-limits";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  return route(async () => {
    await limitPublicCourses();
    const { courseId } = await context.params;
    return ok(await findOrFetchCourse(courseId));
  });
}

