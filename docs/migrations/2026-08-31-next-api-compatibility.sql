-- Additive schema changes required by the Next.js API migration.
-- This migration is idempotent and does not delete existing application data.

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS dept_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

UPDATE courses
SET dept_id = SUBSTRING(course_id FROM 1 FOR 4)
WHERE dept_id IS NULL AND LENGTH(course_id) >= 4;

CREATE INDEX IF NOT EXISTS idx_courses_course_id ON courses (course_id);
CREATE INDEX IF NOT EXISTS idx_courses_dept_id ON courses (dept_id);

ALTER TABLE user_courses
    ADD COLUMN IF NOT EXISTS custom_ul_concentration BOOLEAN DEFAULT FALSE;

UPDATE user_courses
SET custom_ul_concentration = FALSE
WHERE custom_ul_concentration IS NULL;

ALTER TABLE user_courses
    ALTER COLUMN custom_ul_concentration SET DEFAULT FALSE;

-- Preserve the existing three-table model: courses are shared catalog rows and
-- user_courses are user-specific placements. These checks intentionally fail
-- instead of deleting or silently repairing production data if legacy rows are
-- invalid; resolve those rows before rerunning the migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM user_courses uc
        LEFT JOIN users u ON u.id = uc.user_id
        WHERE uc.user_id IS NULL OR u.id IS NULL
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Cannot add user_courses user foreign key: orphaned or null user_id values exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM user_courses uc
        LEFT JOIN courses c ON c.course_id = uc.course_id
        WHERE uc.course_id IS NULL OR c.course_id IS NULL
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Cannot add user_courses course foreign key: orphaned or null course_id values exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM user_courses
        WHERE term IS NULL OR year IS NULL
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce user_courses semester integrity: null term or year values exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM user_courses
        GROUP BY user_id, course_id, term, year
        HAVING COUNT(*) > 1
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Cannot add user_courses uniqueness constraint: duplicate user/course/semester placements exist';
    END IF;
END $$;

ALTER TABLE user_courses
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN course_id SET NOT NULL,
    ALTER COLUMN term SET NOT NULL,
    ALTER COLUMN year SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_user_courses_user'
    ) THEN
        ALTER TABLE user_courses
            ADD CONSTRAINT fk_user_courses_user
            FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_user_courses_course'
    ) THEN
        ALTER TABLE user_courses
            ADD CONSTRAINT fk_user_courses_course
            FOREIGN KEY (course_id) REFERENCES courses(course_id) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'uk_user_courses_user_course_semester'
    ) THEN
        ALTER TABLE user_courses
            ADD CONSTRAINT uk_user_courses_user_course_semester
            UNIQUE (user_id, course_id, term, year);
    END IF;
END $$;

ALTER TABLE user_courses
    VALIDATE CONSTRAINT fk_user_courses_user,
    VALIDATE CONSTRAINT fk_user_courses_course;

CREATE INDEX IF NOT EXISTS idx_user_courses_user_semester
    ON user_courses (user_id, term, year);

ALTER TABLE users
    ALTER COLUMN note TYPE TEXT,
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
