import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Pool, PoolClient } from "pg";
import { loadModule } from "./helpers";

const databaseUrl = process.env.ABUSE_TEST_DATABASE_URL;

test("PostgreSQL limits remain atomic across concurrent connections and release/expire leases", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Integration tests require a local database");
  const schema = `abuse_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^abuse_test_[a-f0-9]{32}$/);
  const pool = new Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 3000, options: `-c search_path=${schema}` });
  const transaction = async <T>(operation: (client: PoolClient) => Promise<T>) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const value = await operation(client);
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  };
  let created = false;
  try {
    await pool.query(`CREATE SCHEMA ${schema}`);
    created = true;
    await pool.query(readFileSync("../docs/migrations/2026-09-08-abuse-limits.sql", "utf8"));
    const subject = loadModule<typeof import("../security/abuse-limits")>("server/security/abuse-limits.ts", {
      "@/server/db/client": { query: (sql: string, values: unknown[]) => pool.query(sql, values) },
      "@/server/db/transactions": { withTransaction: transaction },
      "./request-identity": { currentIpSubject: async () => "test_ip", hashSubject: (value: string) => value, positiveLimit: (_name: string, fallback: number) => fallback },
    });
    const requests = await Promise.allSettled(Array.from({ length: 30 }, () => transaction((client) => subject.consumeBuckets(client, [{ key: "concurrent", limit: 5, seconds: 60 }]))));
    assert.equal(requests.filter((entry) => entry.status === "fulfilled").length, 5);
    for (const entry of requests) if (entry.status === "rejected") assert.equal(entry.reason.status, 429);
    assert.equal((await pool.query("SELECT hits FROM abuse_counters WHERE bucket_key = 'concurrent'")).rows[0].hits, 5);
    // A rejected later bucket must roll back the earlier counter too.
    await assert.rejects(transaction((client) => subject.consumeBuckets(client, [
      { key: "aaa", limit: 5, seconds: 60 }, { key: "concurrent", limit: 5, seconds: 60 },
    ])), { status: 429 });
    assert.equal((await pool.query("SELECT * FROM abuse_counters WHERE bucket_key = 'aaa'")).rowCount, 0);
    await pool.query("UPDATE abuse_counters SET expires_at = NOW() - INTERVAL '1 second'");
    await transaction((client) => subject.consumeBuckets(client, [{ key: "concurrent", limit: 5, seconds: 60 }]));
    assert.equal((await pool.query("SELECT hits FROM abuse_counters WHERE bucket_key = 'concurrent'")).rows[0].hits, 1);
    const admissions = await Promise.allSettled(Array.from({ length: 10 }, (_, index) => subject.acquireTranscriptLease(`user_${index}`)));
    const accepted = admissions.filter((entry) => entry.status === "fulfilled");
    assert.equal(accepted.length, 4);
    for (const entry of admissions) if (entry.status === "rejected") assert.equal(entry.reason.status, 429);
    for (const entry of accepted) if (entry.status === "fulfilled") await entry.value();
    assert.equal((await pool.query("SELECT * FROM transcript_leases")).rowCount, 0);
    const release = await subject.acquireTranscriptLease("same_user");
    await assert.rejects(subject.acquireTranscriptLease("same_user"), { status: 429 });
    await pool.query("UPDATE transcript_leases SET expires_at = NOW() - INTERVAL '1 second'");
    const releaseAfterExpiry = await subject.acquireTranscriptLease("same_user");
    await release(); // stale owner cannot release the new lease
    assert.equal((await pool.query("SELECT * FROM transcript_leases")).rowCount, 1);
    await releaseAfterExpiry();
  } finally {
    if (created) await pool.query(`DROP SCHEMA ${schema} CASCADE`);
    await pool.end();
  }
});
