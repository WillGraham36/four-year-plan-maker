import { z } from "zod";
import { DEPARTMENT_CODE_SET } from "@/lib/courses/departments";
import { requireUserId } from "@/server/auth/current-session";
import { ApiError, ok, readJson, route } from "@/server/http/api-response";
import { getULConcentration } from "@/server/services/planner-service";
import { updateConcentration } from "@/server/services/user-service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => ok(await getULConcentration(await requireUserId())));
}

export async function PATCH(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), readJson(request)]);
    const { concentration } = z.object({ concentration: z.string().max(4) }).parse(body);
    if (concentration && !DEPARTMENT_CODE_SET.has(concentration)) {
      throw new ApiError(400, "INVALID_CONCENTRATION", "Unknown upper level concentration");
    }
    await updateConcentration(userId, concentration);
    return ok(await getULConcentration(userId));
  });
}
