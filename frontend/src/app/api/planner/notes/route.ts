import { z } from "zod";
import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { updateNote } from "@/server/services/user-service";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), request.json()]);
    const { note } = z.object({ note: z.string().nullish() }).parse(body);
    await updateNote(userId, note || "");
    return ok("User note updated successfully");
  });
}

