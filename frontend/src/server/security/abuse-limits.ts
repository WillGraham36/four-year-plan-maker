import "server-only";
import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "@/server/db/client";
import { query } from "@/server/db/client";
import { withTransaction } from "@/server/db/transactions";
import { ApiError } from "@/server/http/api-response";
import { currentIpSubject, hashSubject, positiveLimit } from "./request-identity";

type Bucket = { key: string; limit: number; seconds: number };

export async function consumeBuckets(client: DatabaseClient, buckets: Bucket[]) {
  await client.query("SET LOCAL lock_timeout = '3s'");
  await client.query("SET LOCAL statement_timeout = '5s'");
  // Stable order prevents concurrent multi-bucket requests from deadlocking.
  for (const bucket of [...buckets].sort((a, b) => a.key.localeCompare(b.key))) {
    const consumed = await client.query<{ hits: number }>(
      `INSERT INTO abuse_counters (bucket_key, hits, expires_at)
       VALUES ($1, 1, NOW() + $3::int * INTERVAL '1 second')
       ON CONFLICT (bucket_key) DO UPDATE SET
         hits = CASE WHEN abuse_counters.expires_at <= NOW() THEN 1 ELSE abuse_counters.hits + 1 END,
         expires_at = CASE WHEN abuse_counters.expires_at <= NOW()
           THEN NOW() + $3::int * INTERVAL '1 second' ELSE abuse_counters.expires_at END
       WHERE abuse_counters.expires_at <= NOW() OR abuse_counters.hits < $2
       RETURNING hits`,
      [bucket.key, bucket.limit, bucket.seconds],
    );
    if (!consumed.rowCount) {
      throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please try again later.");
    }
    if (bucket.key.endsWith(":global") && consumed.rows[0].hits === Math.ceil(bucket.limit * 0.8)) {
      console.warn("Abuse protection daily quota reached 80%", { category: bucket.key.split(":")[0] });
    }
  }
  // Bounded, opportunistic cleanup; never touches application or guest data.
  await client.query(`DELETE FROM abuse_counters WHERE bucket_key IN (
    SELECT bucket_key FROM abuse_counters WHERE expires_at < NOW() - INTERVAL '1 day'
    LIMIT 100 FOR UPDATE SKIP LOCKED
  )`);
}

export async function limitGuestCreation(client: DatabaseClient) {
  const ip = await currentIpSubject();
  await consumeBuckets(client, [
    { key: `guest:ip:${ip}`, limit: positiveLimit("GUEST_CREATIONS_PER_IP_HOUR", 30), seconds: 3600 },
    { key: "guest:global", limit: positiveLimit("GUEST_CREATIONS_PER_DAY", 1000), seconds: 86400 },
  ]);
}

export async function limitPublicCourses() {
  const ip = await currentIpSubject();
  await withTransaction((client) => consumeBuckets(client, [
    { key: `courses:${ip}`, limit: positiveLimit("COURSE_REQUESTS_PER_IP_MINUTE", 120), seconds: 60 },
  ]));
}

export async function acquireTranscriptLease(userId: string) {
  const ip = await currentIpSubject();
  const subject = hashSubject(`user:${userId}`);
  const id = randomUUID();
  await withTransaction(async (client) => {
    await client.query("SET LOCAL lock_timeout = '3s'");
    await client.query("SET LOCAL statement_timeout = '5s'");
    // One short lock serializes admission, not parsing. Leases expire after crashes.
    await client.query("SELECT pg_advisory_xact_lock(731094821)");
    await client.query("DELETE FROM transcript_leases WHERE expires_at <= NOW()");
    const active = await client.query<{ total: number; own: number }>(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE subject_key = $1)::int AS own FROM transcript_leases`, [subject],
    );
    if (active.rows[0].own > 0 || active.rows[0].total >= positiveLimit("TRANSCRIPT_MAX_CONCURRENT", 4, 100)) {
      throw new ApiError(429, "TRANSCRIPT_BUSY", "Transcript processing is busy. Please try again shortly.");
    }
    await consumeBuckets(client, [
      { key: `transcript:user:${subject}`, limit: positiveLimit("TRANSCRIPTS_PER_USER_DAY", 5), seconds: 86400 },
      { key: `transcript:ip:${ip}`, limit: positiveLimit("TRANSCRIPTS_PER_IP_HOUR", 30), seconds: 3600 },
      { key: "transcript:global", limit: positiveLimit("TRANSCRIPTS_PER_DAY", 200), seconds: 86400 },
    ]);
    await client.query(
      "INSERT INTO transcript_leases (id, subject_key, expires_at) VALUES ($1, $2, NOW() + INTERVAL '60 seconds')",
      [id, subject],
    );
  });
  return async () => {
    try {
      await query("DELETE FROM transcript_leases WHERE id = $1", [id]);
    } catch {
      console.error("Transcript lease cleanup failed; lease will expire");
    }
  };
}
