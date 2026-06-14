'use server';

import { ANONYMOUS_CURRENT_USER_SESSION, CurrentUserSession } from "@/lib/utils/types";
import { auth } from "@clerk/nextjs/server";
import { getPendingGuestSessionFromCookies } from "./guest-session";
import { fetchWithAuth } from "../server";

type GetCurrentSessionOptions = {
  allowPendingGuest?: boolean;
};

export const getCurrentSession = async ({
  allowPendingGuest = true,
}: GetCurrentSessionOptions = {}): Promise<CurrentUserSession> => {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token && allowPendingGuest) {
    const pendingGuestSession = await getPendingGuestSessionFromCookies();
    if (pendingGuestSession) {
      return pendingGuestSession;
    }
  }

  const response = await fetchWithAuth("v1/auth/session");
  if (!response.ok || !response.data) {
    return ANONYMOUS_CURRENT_USER_SESSION;
  }

  return response.data as CurrentUserSession;
};
