"use client";

import { CurrentUserSession } from "@/lib/utils/types";
import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  SetStateAction,
  ReactNode,
} from "react";
import { toast } from "sonner";

type CurrentUserContextValue = {
  session: CurrentUserSession;
  isGuest: boolean;
  setSession: Dispatch<SetStateAction<CurrentUserSession>>;
};

const anonymousSession: CurrentUserSession = {
  authenticated: false,
  guest: false,
  userId: null,
  onboarded: false,
  guestExpiresAt: null,
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function CurrentUserProvider({
  initialSession,
  children,
}: {
  initialSession?: CurrentUserSession | null;
  children: ReactNode;
}) {
  const [session, setSession] = useState<CurrentUserSession>(initialSession || anonymousSession);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const migrationAttempted = useRef(false);
  const migrationInFlight = useRef(false);

  useEffect(() => {
    setSession(initialSession || anonymousSession);
  }, [initialSession]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || migrationAttempted.current || migrationInFlight.current) {
      return;
    }

    let cancelled = false;

    const delay = (ms: number) =>
      new Promise((resolve) => window.setTimeout(resolve, ms));

    const migrateGuestData = async () => {
      migrationInFlight.current = true;
      try {
        for (let attempt = 1; attempt <= 5 && !cancelled; attempt++) {
          const token = await getToken();
          if (!token) {
            await delay(250 * attempt);
            continue;
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/migrate-guest`, {
            method: "POST",
            credentials: "include",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-cache",
          });

          const body = await response.json();
          if (cancelled) {
            return;
          }

          if (!response.ok) {
            await delay(250 * attempt);
            continue;
          }

          migrationAttempted.current = true;

          if (body.data) {
            setSession(body.data as CurrentUserSession);
          }

          if (body.message === "Guest data migrated") {
            toast.success("Your guest planner is now saved to your account");
            window.location.assign("/planner");
          }

          return;
        }
      } catch (error) {
        console.error("Guest migration failed", error);
      } finally {
        migrationInFlight.current = false;
      }
    };

    migrateGuestData();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      session,
      isGuest: session.guest,
      setSession,
    }),
    [session],
  );

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return context;
}

export function useOptionalCurrentUser() {
  return useContext(CurrentUserContext);
}
