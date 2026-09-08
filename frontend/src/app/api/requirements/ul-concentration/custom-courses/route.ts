import { requireUserId } from "@/server/auth/current-session";
import { ok, readJson, route } from "@/server/http/api-response";
import { setCustomULCourse } from "@/server/services/planner-service";
import { courseIdentifierSchema } from "@/server/validation/domain";

export const runtime = "nodejs";

async function update(request: Request, custom: boolean) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), readJson(request)]);
    return ok(await setCustomULCourse(userId, courseIdentifierSchema.parse(body), custom));
  });
}

export async function POST(request: Request) {
  return update(request, true);
}

export async function DELETE(request: Request) {
  return update(request, false);
}
