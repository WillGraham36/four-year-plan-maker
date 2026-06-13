'use server';

import { ANONYMOUS_CURRENT_USER_SESSION, CurrentUserSession } from "@/lib/utils/types";
import { fetchWithAuth } from "../server";

export const getCurrentSession = async (): Promise<CurrentUserSession> => {
  const response = await fetchWithAuth("v1/auth/session");
  if (!response.ok || !response.data) {
    return ANONYMOUS_CURRENT_USER_SESSION;
  }

  return response.data as CurrentUserSession;
};
