import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { clearGuestCookies, GUEST_COOKIE_NAME } from "@/lib/api/auth/guest-session";
import { getCurrentSession } from "@/server/auth/current-session";
import { migrateGuestSession } from "@/server/auth/guest-session";
import { ApiError, ok, route } from "@/server/http/api-response";

export const runtime = "nodejs";

export async function POST() {
  return route(async () => {
    const { userId } = await auth();
    if (!userId) throw new ApiError(401, "UNAUTHENTICATED", "Sign in before migrating guest data");
    const cookieStore = await cookies();
    const migration = await migrateGuestSession(
      cookieStore.get(GUEST_COOKIE_NAME)?.value,
      userId,
    );
    const response = ok(await getCurrentSession(), migration.message);
    clearGuestCookies(response);
    return response;
  });
}

