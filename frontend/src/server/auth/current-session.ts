import "server-only";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { GUEST_COOKIE_NAME } from "@/lib/api/auth/guest-session";
import { ANONYMOUS_CURRENT_USER_SESSION } from "@/lib/utils/types";
import type { CurrentUserSession } from "@/lib/utils/types";
import { query } from "@/server/db/client";
import { ApiError } from "@/server/http/api-response";
import { resolveGuestSession } from "./guest-session";

async function isOnboarded(userId: string) {
  const result = await query<{ onboarded: boolean }>(
    `SELECT (start_term IS NOT NULL AND end_term IS NOT NULL
             AND major IS NOT NULL AND BTRIM(major) <> '') AS onboarded
     FROM users WHERE id = $1`,
    [userId],
  );
  return result.rows[0]?.onboarded ?? false;
}

export async function getCurrentSession(): Promise<CurrentUserSession> {
  const { userId } = await auth();
  if (userId) {
    return {
      authenticated: true,
      guest: false,
      userId,
      onboarded: await isOnboarded(userId),
      guestExpiresAt: null,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  const guest = await resolveGuestSession(token, { materializePending: true });
  if (!guest) return ANONYMOUS_CURRENT_USER_SESSION;

  return {
    authenticated: true,
    guest: true,
    userId: guest.userId,
    onboarded: await isOnboarded(guest.userId),
    guestExpiresAt: guest.expiresAt.toISOString(),
  };
}

export async function requireUserId() {
  const session = await getCurrentSession();
  if (!session.authenticated || !session.userId) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");
  }
  return session.userId;
}

function isAdminValue(value: unknown): boolean {
  if (value === true) return true;
  if (Array.isArray(value)) return value.some(isAdminValue);
  return typeof value === "string" && ["ADMIN", "ROLE_ADMIN"].includes(value.toUpperCase());
}

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new ApiError(401, "UNAUTHENTICATED", "Authentication is required");

  const claims = sessionClaims as Record<string, unknown> | null;
  const publicMetadata = claims?.public_metadata as Record<string, unknown> | undefined;
  const privateMetadata = claims?.private_metadata as Record<string, unknown> | undefined;
  const isAdmin =
    isAdminValue(claims?.role) ||
    isAdminValue(claims?.roles) ||
    isAdminValue(claims?.status) ||
    isAdminValue(publicMetadata?.role) ||
    isAdminValue(publicMetadata?.roles) ||
    isAdminValue(publicMetadata?.status) ||
    isAdminValue(publicMetadata?.isAdmin) ||
    isAdminValue(privateMetadata?.role) ||
    isAdminValue(privateMetadata?.roles) ||
    isAdminValue(privateMetadata?.status) ||
    isAdminValue(privateMetadata?.isAdmin);

  if (!isAdmin) throw new ApiError(403, "FORBIDDEN", "Admin access is required");
  return userId;
}
