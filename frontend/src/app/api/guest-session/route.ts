import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GUEST_COOKIE_NAME, setPersistedGuestCookie } from "@/lib/api/auth/guest-session";
import { getCurrentSession } from "@/server/auth/current-session";
import { createOrResumeGuestSession } from "@/server/auth/guest-session";
import { ok, route } from "@/server/http/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return route(async () => {
    const { userId } = await auth();
    if (userId) return ok(await getCurrentSession(), "Already signed in");

    const guest = await createOrResumeGuestSession(
      request.cookies.get(GUEST_COOKIE_NAME)?.value,
    );
    const response = ok({
      authenticated: true,
      guest: true,
      userId: guest.userId,
      onboarded: false,
      guestExpiresAt: guest.expiresAt.toISOString(),
    }, guest.created ? "Guest session started" : "Guest session resumed");
    setPersistedGuestCookie(response, guest.token);
    return response;
  });
}

