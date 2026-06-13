'use server';

import { CurrentUserSession } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";

export const getCurrentSession = async (): Promise<CurrentUserSession> => {
  const response = await fetchWithAuth("v1/auth/session");
  if (!response.ok || !response.data) {
    return {
      authenticated: false,
      guest: false,
      userId: null,
      onboarded: false,
      guestExpiresAt: null,
    };
  }

  return response.data as CurrentUserSession;
};
