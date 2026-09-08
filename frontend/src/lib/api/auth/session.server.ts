'use server';

import { CurrentUserSession } from "@/lib/utils/types";
import { getCurrentSession as resolveCurrentSession } from "@/server/auth/current-session";

type GetCurrentSessionOptions = {
  allowPendingGuest?: boolean;
};

export const getCurrentSession = async ({
  allowPendingGuest: _allowPendingGuest = true,
}: GetCurrentSessionOptions = {}): Promise<CurrentUserSession> => {
  return resolveCurrentSession();
};
