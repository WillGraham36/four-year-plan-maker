import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { getUserInfo } from "@/server/services/user-service";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => ok(await getUserInfo(await requireUserId())));
}

