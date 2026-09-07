import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import {
  deleteCoursePlacements,
  getUserCourses,
  groupCourses,
  saveCoursePlacements,
} from "@/server/services/planner-service";
import { courseIdentifiersSchema, coursePlacementsSchema } from "@/server/validation/domain";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    const userId = await requireUserId();
    return ok(groupCourses(await getUserCourses(userId)));
  });
}

export async function POST(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), request.json()]);
    return ok(await saveCoursePlacements(userId, coursePlacementsSchema.parse(body)), undefined, 201);
  });
}

export async function DELETE(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), request.json()]);
    return ok(await deleteCoursePlacements(userId, courseIdentifiersSchema.parse(body)));
  });
}

