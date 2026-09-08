import "server-only";

import { createHash, randomBytes, randomUUID } from "crypto";
import type { DatabaseClient } from "@/server/db/client";
import { query } from "@/server/db/client";
import { withTransaction } from "@/server/db/transactions";
import {
  getGuestSessionDaysValue,
  isPendingGuestToken,
  PENDING_GUEST_TOKEN_PREFIX,
} from "@/lib/api/auth/guest-session";

type GuestSessionRow = {
  id: string;
  user_id: string;
  created_at: Date;
  last_seen_at: Date;
  expires_at: Date;
  invalidated_at: Date | null;
  migrated_to_user_id: string | null;
};

export type ResolvedGuestSession = {
  sessionId: number;
  userId: string;
  expiresAt: Date;
};

export type GuestSessionCreation = ResolvedGuestSession & {
  token: string;
  created: boolean;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiresFrom(now: Date) {
  return new Date(
    now.getTime() + getGuestSessionDaysValue() * 24 * 60 * 60 * 1000,
  );
}

function generateToken() {
  return `tp_guest_${randomBytes(32).toString("base64url")}`;
}

async function incrementGuestStats(
  client: DatabaseClient,
  column: "created_guest_users" | "migrated_guest_users" | "invalidated_guest_sessions",
  amount = 1,
) {
  await client.query(
    `INSERT INTO guest_usage_stats (stat_date, ${column}, last_updated_at)
     VALUES (CURRENT_DATE, $1, NOW())
     ON CONFLICT (stat_date) DO UPDATE
     SET ${column} = guest_usage_stats.${column} + EXCLUDED.${column},
         last_updated_at = NOW()`,
    [amount],
  );
}

async function createSession(
  client: DatabaseClient,
  token: string,
  now = new Date(),
): Promise<ResolvedGuestSession> {
  const userId = `guest_${randomUUID()}`;
  const expiresAt = expiresFrom(now);

  await client.query(
    `INSERT INTO users
       (id, ul_concentration, note, is_guest, guest_created_at, guest_last_seen_at, guest_expires_at)
     VALUES ($1, '', '', TRUE, $2, $2, $3)`,
    [userId, now, expiresAt],
  );
  const session = await client.query<GuestSessionRow>(
    `INSERT INTO guest_sessions
       (token_hash, user_id, created_at, last_seen_at, expires_at)
     VALUES ($1, $2, $3, $3, $4)
     RETURNING *`,
    [tokenHash(token), userId, now, expiresAt],
  );
  await incrementGuestStats(client, "created_guest_users");

  return {
    sessionId: Number(session.rows[0].id),
    userId,
    expiresAt,
  };
}

async function resolveWithClient(
  client: DatabaseClient,
  token: string,
  materializePending: boolean,
): Promise<ResolvedGuestSession | null> {
  const hash = tokenHash(token);
  if (isPendingGuestToken(token)) {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [hash]);
  }

  const result = await client.query<GuestSessionRow>(
    `SELECT gs.*
     FROM guest_sessions gs
     JOIN users u ON u.id = gs.user_id
     WHERE gs.token_hash = $1 AND u.is_guest = TRUE
     FOR UPDATE OF gs`,
    [hash],
  );

  if (result.rowCount === 0) {
    if (materializePending && isPendingGuestToken(token)) {
      return createSession(client, token);
    }
    return null;
  }

  const session = result.rows[0];
  const now = new Date();
  if (session.invalidated_at || session.expires_at <= now) {
    await client.query(
      "UPDATE guest_sessions SET invalidated_at = COALESCE(invalidated_at, $2) WHERE id = $1",
      [session.id, now],
    );
    return null;
  }

  await client.query(
    "UPDATE guest_sessions SET last_seen_at = $2 WHERE id = $1",
    [session.id, now],
  );
  await client.query(
    `UPDATE users
     SET guest_last_seen_at = $2, guest_expires_at = $3
     WHERE id = $1 AND is_guest = TRUE`,
    [session.user_id, now, session.expires_at],
  );

  return {
    sessionId: Number(session.id),
    userId: session.user_id,
    expiresAt: session.expires_at,
  };
}

export async function resolveGuestSession(
  token: string | null | undefined,
  options: { materializePending?: boolean } = {},
) {
  if (!token) return null;
  return withTransaction((client) =>
    resolveWithClient(client, token, options.materializePending ?? false),
  );
}

export async function createOrResumeGuestSession(
  existingToken: string | null | undefined,
): Promise<GuestSessionCreation> {
  return withTransaction(async (client) => {
    if (existingToken) {
      const existing = await resolveWithClient(client, existingToken, true);
      if (existing) return { ...existing, token: existingToken, created: false };
    }

    const token = generateToken();
    const created = await createSession(client, token);
    return { ...created, token, created: true };
  });
}

async function hasPlannerData(client: DatabaseClient, userId: string) {
  const result = await client.query<{ has_data: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM users u
       WHERE u.id = $1 AND (
         u.start_term IS NOT NULL OR u.end_term IS NOT NULL OR
         NULLIF(u.major, '') IS NOT NULL OR NULLIF(u.minor, '') IS NOT NULL OR
         u.track IS NOT NULL OR NULLIF(u.ul_concentration, '') IS NOT NULL OR
         NULLIF(u.note, '') IS NOT NULL OR
         EXISTS (SELECT 1 FROM user_off_semesters os WHERE os.user_id = u.id) OR
         EXISTS (SELECT 1 FROM user_completed_semesters cs WHERE cs.user_id = u.id) OR
         EXISTS (SELECT 1 FROM user_courses uc WHERE uc.user_id = u.id)
       )
     ) AS has_data`,
    [userId],
  );
  return result.rows[0]?.has_data ?? false;
}

async function deleteGuestData(client: DatabaseClient, guestUserId: string) {
  await client.query("DELETE FROM user_courses WHERE user_id = $1", [guestUserId]);
  await client.query("DELETE FROM user_off_semesters WHERE user_id = $1", [guestUserId]);
  await client.query("DELETE FROM user_completed_semesters WHERE user_id = $1", [guestUserId]);
  await client.query("DELETE FROM users WHERE id = $1 AND is_guest = TRUE", [guestUserId]);
}

export async function migrateGuestSession(
  token: string | null | undefined,
  authenticatedUserId: string,
) {
  if (!token) {
    return { migrated: false, movedCourses: 0, message: "No guest session was present" };
  }

  return withTransaction(async (client) => {
    const guestSession = await resolveWithClient(client, token, false);
    if (!guestSession) {
      return { migrated: false, movedCourses: 0, message: "Guest session was not found" };
    }

    if (await hasPlannerData(client, authenticatedUserId)) {
      await deleteGuestData(client, guestSession.userId);
      const invalidated = await client.query(
        `UPDATE guest_sessions
         SET invalidated_at = NOW(), migrated_to_user_id = $2
         WHERE user_id = $1 AND invalidated_at IS NULL`,
        [guestSession.userId, authenticatedUserId],
      );
      await incrementGuestStats(
        client,
        "invalidated_guest_sessions",
        invalidated.rowCount ?? 0,
      );
      return { migrated: false, movedCourses: 0, message: "Signed-in account data kept" };
    }

    await client.query(
      `INSERT INTO users
         (id, ul_concentration, start_term, start_year, end_term, end_year,
          major, minor, note, track, is_guest)
       SELECT $2, COALESCE(ul_concentration, ''), start_term, start_year,
              end_term, end_year, major, minor, COALESCE(note, ''), track, FALSE
       FROM users WHERE id = $1 AND is_guest = TRUE
       ON CONFLICT (id) DO UPDATE SET
         ul_concentration = EXCLUDED.ul_concentration,
         start_term = EXCLUDED.start_term,
         start_year = EXCLUDED.start_year,
         end_term = EXCLUDED.end_term,
         end_year = EXCLUDED.end_year,
         major = EXCLUDED.major,
         minor = EXCLUDED.minor,
         note = EXCLUDED.note,
         track = EXCLUDED.track,
         is_guest = FALSE,
         guest_created_at = NULL,
         guest_last_seen_at = NULL,
         guest_expires_at = NULL,
         migrated_to_user_id = NULL`,
      [guestSession.userId, authenticatedUserId],
    );

    await client.query("DELETE FROM user_off_semesters WHERE user_id = $1", [authenticatedUserId]);
    await client.query(
      `INSERT INTO user_off_semesters (user_id, term, year)
       SELECT $2, term, year FROM user_off_semesters WHERE user_id = $1`,
      [guestSession.userId, authenticatedUserId],
    );
    await client.query("DELETE FROM user_completed_semesters WHERE user_id = $1", [authenticatedUserId]);
    await client.query(
      `INSERT INTO user_completed_semesters (user_id, term, year)
       SELECT $2, term, year FROM user_completed_semesters WHERE user_id = $1`,
      [guestSession.userId, authenticatedUserId],
    );

    const moved = await client.query(
      "UPDATE user_courses SET user_id = $2 WHERE user_id = $1",
      [guestSession.userId, authenticatedUserId],
    );
    const invalidated = await client.query(
      `UPDATE guest_sessions
       SET invalidated_at = NOW(), migrated_to_user_id = $2
       WHERE user_id = $1 AND invalidated_at IS NULL`,
      [guestSession.userId, authenticatedUserId],
    );
    await client.query("DELETE FROM user_off_semesters WHERE user_id = $1", [guestSession.userId]);
    await client.query("DELETE FROM user_completed_semesters WHERE user_id = $1", [guestSession.userId]);
    await client.query("DELETE FROM users WHERE id = $1 AND is_guest = TRUE", [guestSession.userId]);
    await incrementGuestStats(client, "migrated_guest_users");
    await incrementGuestStats(
      client,
      "invalidated_guest_sessions",
      invalidated.rowCount ?? 0,
    );

    return {
      migrated: true,
      movedCourses: moved.rowCount ?? 0,
      message: "Guest data migrated",
    };
  });
}

export function pendingGuestTokenPrefix() {
  return PENDING_GUEST_TOKEN_PREFIX;
}

