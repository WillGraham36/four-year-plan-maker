-- Non-destructive schema additions for anonymous guest users.
-- Production uses spring.jpa.hibernate.ddl-auto=validate, so apply this manually
-- before deploying guest-user code.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS guest_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guest_last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guest_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS migrated_to_user_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS guest_sessions (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    invalidated_at TIMESTAMPTZ,
    migrated_to_user_id VARCHAR(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_sessions_token_hash
    ON guest_sessions (token_hash);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_user_id
    ON guest_sessions (user_id);

CREATE TABLE IF NOT EXISTS guest_usage_stats (
    stat_date DATE PRIMARY KEY,
    created_guest_users BIGINT NOT NULL DEFAULT 0,
    migrated_guest_users BIGINT NOT NULL DEFAULT 0,
    deleted_guest_users BIGINT NOT NULL DEFAULT 0,
    invalidated_guest_sessions BIGINT NOT NULL DEFAULT 0,
    cleanup_runs BIGINT NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
