import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { CurrentUserSession } from "@/lib/utils/types";

export const GUEST_COOKIE_NAME =
  process.env.NEXT_PUBLIC_GUEST_COOKIE_NAME || "terpplanner_guest";
export const PENDING_GUEST_COOKIE_NAME =
  process.env.NEXT_PUBLIC_PENDING_GUEST_COOKIE_NAME ||
  `${GUEST_COOKIE_NAME}_pending`;
export const PENDING_GUEST_TOKEN_PREFIX = "tp_pending_guest_";

const DEFAULT_GUEST_SESSION_DAYS = 30;
const GUEST_TOKEN_RANDOM_BYTES = 32;
const GUEST_TOKEN_RANDOM_CHARS = 43;

type CookieSameSite = "strict" | "lax" | "none";

type GuestCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: CookieSameSite;
  path: string;
  maxAge?: number;
  domain?: string;
};

type CookieWritable = {
  cookies: {
    set: (name: string, value: string, options: GuestCookieOptions) => void;
  };
};

export function createPendingGuestSession(now = new Date()) {
  const token = `${PENDING_GUEST_TOKEN_PREFIX}${randomBytes(GUEST_TOKEN_RANDOM_BYTES).toString("base64url")}`;
  const expiresAt = addDays(now, getGuestSessionDays());

  return {
    token,
    session: buildPendingGuestSession(expiresAt),
  };
}

export async function getPendingGuestSessionFromCookies() {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  const pendingMarker = cookieStore.get(PENDING_GUEST_COOKIE_NAME)?.value;

  if (pendingMarker !== "1" || !isPendingGuestToken(guestToken)) {
    return null;
  }

  return buildPendingGuestSession(null);
}

export function setPendingGuestCookies(response: CookieWritable, token: string) {
  const maxAge = getGuestSessionMaxAgeSeconds();
  response.cookies.set(GUEST_COOKIE_NAME, token, {
    ...getGuestCookieOptions(),
    maxAge,
  });
  response.cookies.set(PENDING_GUEST_COOKIE_NAME, "1", {
    ...getGuestCookieOptions(),
    maxAge,
  });
}

export async function clearPendingGuestMarker() {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_GUEST_COOKIE_NAME, "", {
    ...getGuestCookieOptions(),
    maxAge: 0,
  });
}

function buildPendingGuestSession(expiresAt: Date | null): CurrentUserSession {
  return {
    authenticated: true,
    guest: true,
    userId: null,
    onboarded: false,
    guestExpiresAt: expiresAt?.toISOString() ?? null,
    pending: true,
  };
}

export function isPendingGuestToken(token: string | null | undefined) {
  if (!token?.startsWith(PENDING_GUEST_TOKEN_PREFIX)) {
    return false;
  }

  const randomPart = token.slice(PENDING_GUEST_TOKEN_PREFIX.length);
  return (
    randomPart.length >= GUEST_TOKEN_RANDOM_CHARS &&
    /^[A-Za-z0-9_-]+$/.test(randomPart)
  );
}

function getGuestCookieOptions(): GuestCookieOptions {
  const domain =
    process.env.APP_GUEST_COOKIE_DOMAIN ||
    process.env.NEXT_PUBLIC_GUEST_COOKIE_DOMAIN ||
    "";

  return {
    httpOnly: true,
    secure: getGuestCookieSecure(),
    sameSite: getGuestCookieSameSite(),
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

function getGuestCookieSecure() {
  const explicitValue =
    process.env.APP_GUEST_COOKIE_SECURE ||
    process.env.NEXT_PUBLIC_GUEST_COOKIE_SECURE;

  if (explicitValue?.toLowerCase() === "true") {
    return true;
  }

  if (explicitValue?.toLowerCase() === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function getGuestCookieSameSite(): CookieSameSite {
  const value = (
    process.env.APP_GUEST_COOKIE_SAME_SITE ||
    process.env.NEXT_PUBLIC_GUEST_COOKIE_SAME_SITE ||
    "lax"
  ).toLowerCase();

  if (value === "strict" || value === "none") {
    return value;
  }

  return "lax";
}

function getGuestSessionMaxAgeSeconds() {
  return getGuestSessionDays() * 24 * 60 * 60;
}

function getGuestSessionDays() {
  const value =
    process.env.APP_GUEST_SESSION_DAYS ||
    process.env.NEXT_PUBLIC_GUEST_SESSION_DAYS;
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_GUEST_SESSION_DAYS;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
