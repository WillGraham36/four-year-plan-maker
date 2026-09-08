# Testing the app

Run the active Next.js application's checks from `frontend/`:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` discovers every `src/**/*.test.ts` file using Node's test runner and the existing `tsx` dependency. It includes the previously separate transcript and onboarding tests. `npm run test:migration` remains available for just the original Gen Ed suite.

The legacy backend checks run from `backend/`:

```powershell
.\mvnw.cmd test
```

The backend tests use the test profile and an in-memory H2 database.

## Coverage

- Every Next API route file has handler coverage. Protected routes exercise successful requests, missing authentication, invalid bodies, and admin rejection where applicable.
- Planner mutations cover user scope, existing placement indexes, transfer overrides, upper-level eligibility, repeated courses, notes, and off-term cleanup.
- Guest tests cover token hashing, expiry, invalidation, pending-session locking, migration into an empty account, preserving an existing account, and cookies.
- Onboarding tests cover normalization, required CS tracks, parent-before-child writes, transaction connection reuse, imported placement failures, and missing users.
- Course tests cover cached DTOs, invalid queries, batch deduplication, upstream failure fallback, response normalization, department pagination, and preventing planner submissions from overwriting existing shared catalog metadata.
- Transaction tests cover success, operation failure, BEGIN/COMMIT failure, failed rollback, preserving the original error, and discarding a connection after rollback failure.
- Transcript tests include multiline institution headers and AP/external transfer-credit extraction.
- Bounded stress tests run a 200-course Gen Ed input twice, assert deterministic results and 200 persistence calls, and issue 100 concurrent handler calls to check independent responses.

## Scope and limitations

Route and service tests run real TypeScript implementations with isolated dependency doubles. The test helper compiles files with the already installed TypeScript package and substitutes database, Clerk, cookie-context, and service boundaries. Tests use actual Next request/response objects. Unexpected database access throws, and tests that exercise umd.io substitute `fetch`.

These checks do not establish live PostgreSQL transaction isolation, database constraints, network throughput, Clerk middleware behavior, production capacity, or browser interactions. The stress inputs are bounded regression cases, not a worst-case capacity benchmark. H2 backend tests do not validate the new Next.js PostgreSQL queries.

Stop a dev server before building into the same `.next` directory on Windows, or build an isolated copy; an open `.next/trace` file can prevent a build.

## Verification on September 7, 2026

- 112 frontend tests passed.
- 26 legacy backend tests passed with no failures or skips.
- TypeScript and lint passed.
- The production build passed in an isolated temporary copy, including all pages and API routes.
- Two 200-course calculations took about 90 ms on this machine in one test run; timings vary and are reported as diagnostics rather than enforced as brittle thresholds.
- A live local PostgreSQL load test was not run because the Docker daemon was unavailable. No production load test or production database migration was performed.
