import { requireAdmin } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { getCourseCatalog } from "@/server/services/course-service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    await requireAdmin();
    return ok(await getCourseCatalog());
  });
}
