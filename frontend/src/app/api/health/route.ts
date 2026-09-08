import { query } from "@/server/db/client";
import { ok, route } from "@/server/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => {
    await query("SELECT 1");
    return ok({ status: "ok" });
  });
}

