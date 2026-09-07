import { z } from "zod";
import { requireUserId } from "@/server/auth/current-session";
import { ok, route } from "@/server/http/api-response";
import { updateTrack } from "@/server/services/user-service";

export const runtime = "nodejs";

const trackSchema = z.enum(["GENERAL", "DATA_SCIENCE", "QUANTUM", "CYBERSECURITY", "ML"]);

export async function PUT(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), request.json()]);
    const { track } = z.object({ track: trackSchema }).parse(body);
    await updateTrack(userId, track);
    return ok(`Updated user track successfully to ${track}`);
  });
}

