import { getCurrentSession } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => ok(await getCurrentSession()));
}

