import assert from "node:assert/strict";
import test from "node:test";
import { loadModule, result } from "./helpers";

type Auth = typeof import("../auth/current-session");
type Guests = typeof import("../auth/guest-session");

function authModule(userId: string | null, claims: unknown = {}, onboarded = true) {
  return loadModule<Auth>("server/auth/current-session.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId, sessionClaims: claims }) },
    "next/headers": { cookies: async () => ({ get: () => undefined }) },
    "@/server/db/client": { query: async (_sql: string, values: unknown[]) => { assert.equal(values[0], userId); return result([{ onboarded }]); } },
    "./guest-session": { resolveGuestSession: async () => null },
  });
}

test("anonymous session cannot access user APIs", async () => {
  const auth = authModule(null);
  assert.equal((await auth.getCurrentSession()).authenticated, false);
  await assert.rejects(auth.requireUserId, { status: 401 });
  await assert.rejects(auth.requireAdmin, { status: 401 });
});

test("signed-in sessions return their own identity and onboarding state", async () => {
  const auth = authModule("user_owner", {}, false);
  assert.deepEqual(await auth.getCurrentSession(), {
    authenticated: true, guest: false, userId: "user_owner", onboarded: false, guestExpiresAt: null,
  });
  assert.equal(await auth.requireUserId(), "user_owner");
});

test("admin claim variants accept trusted roles and reject ordinary users", async () => {
  for (const claims of [
    { role: "ADMIN" }, { roles: ["member", "ROLE_ADMIN"] },
    { public_metadata: { isAdmin: true } }, { private_metadata: { role: "admin" } },
  ]) assert.equal(await authModule("admin_owner", claims).requireAdmin(), "admin_owner");
  for (const claims of [null, {}, { role: "member" }, { public_metadata: { isAdmin: false } },
    { public_metadata: { isAdmin: "false" } }, { unsafe_metadata: { isAdmin: true } },
  ]) await assert.rejects(authModule("user_owner", claims).requireAdmin, { status: 403 });
});

function guestModule(options: { expired?: boolean; invalidated?: boolean; hasData?: boolean; missing?: boolean } = {}) {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  const client = { query: async (sql: string, values?: unknown[]) => {
    calls.push({ sql, values });
    if (sql.includes("SELECT gs.*")) return result(options.missing ? [] : [{
      id: "7", user_id: "guest_owner", created_at: new Date(), last_seen_at: new Date(),
      expires_at: new Date(options.expired ? "2000-01-01" : "2100-01-01"),
      invalidated_at: options.invalidated ? new Date() : null, migrated_to_user_id: null,
    }]);
    if (sql.includes("AS has_data")) return result([{ has_data: options.hasData ?? false }]);
    if (sql.includes("INSERT INTO guest_sessions")) return result([{ id: "8" }]);
    return result([], 1);
  } };
  const subject = loadModule<Guests>("server/auth/guest-session.ts", {
    "@/server/db/transactions": { withTransaction: async (operation: (client: unknown) => Promise<unknown>) => operation(client) },
  });
  return { subject, calls };
}

test("missing guest tokens do not open transactions or touch the database", async () => {
  const { subject, calls } = guestModule();
  assert.equal(await subject.resolveGuestSession(null), null);
  assert.equal((await subject.migrateGuestSession(undefined, "user_owner")).migrated, false);
  assert.deepEqual(calls, []);
});

test("guest tokens are hashed for lookup and valid sessions retain their expiry", async () => {
  const { subject, calls } = guestModule();
  const session = await subject.resolveGuestSession("secret_token");
  assert.equal(session?.userId, "guest_owner");
  assert.equal(session?.expiresAt.toISOString(), "2100-01-01T00:00:00.000Z");
  assert.match(String(calls[0].values?.[0]), /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(calls).includes("secret_token"), false);
});

for (const options of [{ expired: true }, { invalidated: true }, { missing: true }]) {
  test(`invalid guest session cannot migrate data: ${JSON.stringify(options)}`, async () => {
    const { subject, calls } = guestModule(options);
    assert.equal((await subject.migrateGuestSession("token", "user_owner")).migrated, false);
    assert.equal(calls.some(({ sql }) => /DELETE FROM|UPDATE user_courses SET user_id|INSERT INTO users/.test(sql)), false);
  });
}

test("guest migration preserves an existing account and only deletes the guest's data", async () => {
  const { subject, calls } = guestModule({ hasData: true });
  const migration = await subject.migrateGuestSession("token", "user_owner");
  assert.equal(migration.migrated, false);
  assert.equal(migration.message, "Signed-in account data kept");
  const deletions = calls.filter(({ sql }) => sql.startsWith("DELETE"));
  assert.equal(deletions.length, 4);
  assert.ok(deletions.every(({ values }) => values?.[0] === "guest_owner"));
  assert.equal(calls.some(({ sql }) => sql.includes("UPDATE user_courses SET user_id")), false);
});

test("guest migration moves data to an empty account and invalidates sessions", async () => {
  const { subject, calls } = guestModule();
  const migration = await subject.migrateGuestSession("token", "user_owner");
  assert.equal(migration.migrated, true);
  assert.equal(migration.movedCourses, 1);
  const moved = calls.find(({ sql }) => sql.includes("UPDATE user_courses SET user_id"));
  assert.deepEqual(moved?.values, ["guest_owner", "user_owner"]);
  assert.ok(calls.some(({ sql }) => sql.includes("invalidated_at = NOW(), migrated_to_user_id")));
});

test("pending guest creation takes a transaction advisory lock before lookup", async () => {
  const { subject, calls } = guestModule({ missing: true });
  const session = await subject.resolveGuestSession(`tp_pending_guest_${"a".repeat(43)}`, { materializePending: true });
  assert.match(calls[0].sql, /pg_advisory_xact_lock/);
  assert.match(session!.userId, /^guest_/);
  assert.equal(calls.filter(({ sql }) => sql.includes("INSERT INTO users")).length, 1);
});
