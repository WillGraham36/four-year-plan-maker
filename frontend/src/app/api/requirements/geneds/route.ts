import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { calculateGenEds } from "@/server/services/gen-ed-service";
import { getUserCourses } from "@/server/services/planner-service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    const courses = await getUserCourses(await requireUserId());
    return ok(await calculateGenEds(courses));
  });
}

