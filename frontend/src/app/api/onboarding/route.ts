import { requireUserId } from "@/server/auth/current-session";
import { ok, readJson, route } from "@/server/http/api-response";
import { getOnboarding, saveOnboarding } from "@/server/services/onboarding-service";
import { onboardingSchema } from "@/server/validation/domain";

export const runtime = "nodejs";

export async function GET() {
  return route(async () => ok(await getOnboarding(await requireUserId())));
}

export async function POST(request: Request) {
  return route(async () => {
    const [userId, body] = await Promise.all([requireUserId(), readJson(request)]);
    await saveOnboarding(userId, onboardingSchema.parse(body));
    return ok("Successfully submitted form", "Successfully submitted onboarding form", 201);
  });
}
