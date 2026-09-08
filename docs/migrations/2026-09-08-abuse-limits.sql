-- Additive migration. Apply before deploying abuse protection.
BEGIN;
CREATE TABLE IF NOT EXISTS abuse_counters (
  bucket_key text PRIMARY KEY,
  hits integer NOT NULL CHECK (hits > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS abuse_counters_expiry ON abuse_counters (expires_at);
CREATE TABLE IF NOT EXISTS transcript_leases (
  id uuid PRIMARY KEY,
  subject_key text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS transcript_leases_expiry ON transcript_leases (expires_at);
COMMIT;
