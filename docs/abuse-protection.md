# Transcript and guest abuse protection

## Deployment prerequisites

1. Apply `docs/migrations/2026-09-08-abuse-limits.sql` to the intended database
   before deploying the application. This adds two tables and indexes; it does not
   alter or delete planner data. The application never creates tables at runtime.
2. Set `ABUSE_IP_HASH_SECRET` to a random secret of at least 32 characters, shared
   across all instances of this environment. Generate it with a password manager.
   Keep it stable: rotation resets per-IP/user quota identities. Missing production
   configuration fails closed for protected operations.
3. Vercel uses `x-vercel-forwarded-for`. Elsewhere, configure
   `ABUSE_TRUSTED_IP_HEADER` only when the trusted ingress overwrites that header
   and direct access to the application is blocked. Arbitrary `X-Forwarded-For`
   headers are ignored by default. Without trusted IP information, all callers
   share an unknown-IP bucket. IPv6 clients are grouped by /64.
4. The setup route requests a 60-second function duration. Confirm the deployment
   supports it and Node worker threads. File tracing explicitly includes the PDF
   packages for this route. Next Server Actions accept 4 MB request bodies; file
   uploads are limited to 3 MiB, leaving room below Vercel's 4.5 MB request limit.

## Default quotas

| Operation | Limit | Configuration |
| --- | --- | --- |
| Transcript import | 5/user per 24 hours | `TRANSCRIPTS_PER_USER_DAY` |
| Transcript import | 30/IP per hour | `TRANSCRIPTS_PER_IP_HOUR` |
| Transcript import | 200 total per 24 hours | `TRANSCRIPTS_PER_DAY` |
| Transcript concurrency | 1/user, 4 total | `TRANSCRIPT_MAX_CONCURRENT` (global) |
| New guests | 30/IP per hour | `GUEST_CREATIONS_PER_IP_HOUR` |
| New guests | 1,000 total per 24 hours | `GUEST_CREATIONS_PER_DAY` |
| Public course search + lookup | 120/IP per minute combined | `COURSE_REQUESTS_PER_IP_MINUTE` |

Windows start at the first accepted request and expire after the stated duration;
they do not reset at midnight. Guest resumes do not consume creation quotas.
Creation limits are enforced in the shared creation function, including pending
guest materialization through session reads. Campus networks may share IPs;
monitor legitimate rejections before adjusting limits. Limits must be positive
integers; invalid settings do not silently disable enforcement.

Counters use atomic PostgreSQL upserts inside transactions. Transcript admission
also takes a short database lock and records an expiring lease. Parsing holds no
database connection. Successful and failed admitted parses consume quota; rejected
admissions roll back all counter increments. Leases are released in `finally` and
expire after 60 seconds if a process crashes. Expired counters are removed in
bounded batches after a one-day grace period. No raw IPs or account IDs are stored
in the abuse tables; identifiers are HMAC digests.

The parser accepts non-empty PDFs up to 3 MiB with a `%PDF-` signature, at most 20
pages and 36,000 extracted characters. It runs in a worker with a 128 MiB old-space
heap limit (not a total process-memory guarantee) and an 8-second extraction
deadline. The parent terminates the worker on success, failure, or timeout.
The overall parsing deadline is 25 seconds, including provider retries. There are
at most two provider requests per admitted import; only explicit retryable HTTP
statuses are retried. Network failures/timeouts and authentication failures are
not retried. Responses and logs do not include upstream errors or raw transcript
text. PDF parser output is not forwarded to application logs.

## Spending and operational alerts

Set `TRANSCRIPT_PARSING_ENABLED=false` and redeploy to disable imports immediately
on the new deployment while leaving manual onboarding available. In-flight work
may finish. Global quotas bound accepted imports, not exact dollar spending:
token usage and possible provider retries affect cost.

At 80% of either daily global quota the app emits a structured warning:
`Abuse protection daily quota reached 80%`, with category `transcript` or `guest`.
Connect a log alert for this event and repeated transcript admission/cleanup
failures to your monitored address. Configure provider project-budget alerts and
Vercel usage/spend alerts in their dashboards; these account settings cannot be
activated by committing this repository. Budget alerts should not be assumed to
stop spending. The application quota and kill switch provide independent controls.

Use Vercel Firewall/WAF rate limiting for volumetric traffic before it reaches
PostgreSQL, including guest/session endpoints. Database quotas protect allocations
and paid parsing but do not stop a flood from invoking the function or querying
the database. No hosting/account settings are changed by this implementation.

## Verification

`npm test` includes admission order, unauthorized and throttled requests, pending
guest creation, lease cleanup, IP spoofing, real PDF limits, and provider timeout
and retry tests with mocked provider responses. No paid calls or student PDFs.

For real concurrency testing, set `ABUSE_TEST_DATABASE_URL` to a **local** PostgreSQL
database and run `node --import tsx --test src/server/__tests__/abuse-database.test.ts`
from `frontend/`. The test rejects remote hosts, creates a randomly named temporary
schema, applies the additive migration there, tests concurrent requests and lease
expiry, and drops only that schema afterward. It never reads the app's DATABASE_URL.

Before public release, smoke-test guest creation/resume and an actual transcript
import on the preview deployment after configuring its database and secrets.

References: [Vercel request headers](https://vercel.com/docs/headers/request-headers),
[function limits](https://vercel.com/docs/functions/limitations), and
[Next Server Actions configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).
