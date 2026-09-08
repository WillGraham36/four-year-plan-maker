import { z } from "zod";
import { requireAdmin } from "@/server/auth/current-session";
import { ok, readJson, route } from "@/server/http/api-response";
import { syncDepartments } from "@/server/services/course-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return route(async () => {
    const [, body] = await Promise.all([requireAdmin(), readJson(request)]);
    const { departments } = z.object({ departments: z.array(z.string()).max(200) }).parse(body);
    return ok(await syncDepartments(departments));
  });
}
