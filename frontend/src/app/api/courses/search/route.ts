import { NextRequest } from "next/server";
import { ok, route } from "@/server/http/api-response";
import { autocompleteCourses } from "@/server/services/course-service";
import { limitPublicCourses } from "@/server/security/abuse-limits";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return route(async () => {
    await limitPublicCourses();
    return ok(await autocompleteCourses(request.nextUrl.searchParams.get("q") || ""));
  });
}

