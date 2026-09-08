import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { getAcademicOverview } from "@/server/services/academic-overview-service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => ok(await getAcademicOverview(await requireUserId())));
}

