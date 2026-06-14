import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  createPendingGuestSession,
  GUEST_COOKIE_NAME,
  isPendingGuestToken,
  PENDING_GUEST_COOKIE_NAME,
  setPendingGuestCookies,
} from "@/lib/api/auth/guest-session";
import { CurrentUserSession } from "@/lib/utils/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (userId) {
    const session: CurrentUserSession = {
      authenticated: true,
      guest: false,
      userId,
      onboarded: false,
      guestExpiresAt: null,
    };

    return NextResponse.json({
      data: session,
      message: "Already signed in",
    });
  }

  const existingGuestToken = request.cookies.get(GUEST_COOKIE_NAME)?.value;
  if (existingGuestToken) {
    const session: CurrentUserSession = {
      authenticated: true,
      guest: true,
      userId: null,
      onboarded: false,
      guestExpiresAt: null,
      pending:
        request.cookies.get(PENDING_GUEST_COOKIE_NAME)?.value === "1" &&
        isPendingGuestToken(existingGuestToken),
    };

    return NextResponse.json({
      data: session,
      message: "Guest session already present",
    });
  }

  const { token, session } = createPendingGuestSession();
  const response = NextResponse.json({
    data: session,
    message: "Guest session started",
  });

  setPendingGuestCookies(response, token);
  return response;
}
