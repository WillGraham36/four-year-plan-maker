# Production dependency review (2026-09-08)

Run `npm run audit:prod` from `frontend/` before release. The dependency-audit
workflow also runs for dependency changes and weekly. It fails for moderate or
higher production findings. Development dependencies are outside this check.

The initial production audit reported nine affected packages (seven high, two
moderate). All were remediated; there are no production advisory exceptions.

| Dependency path | Exposure and resolution |
| --- | --- |
| Next.js | Server Actions and image optimization are used. Updated within Next 15 to 15.5.25 for the Server Action, cache, SSRF and image advisories. Custom servers/rewrites are not configured, but the framework was patched regardless. |
| Next.js → PostCSS → nanoid | Build/CSS processing; no user-supplied CSS processing is exposed. Override Next's pinned PostCSS with compatible 8.5.28 and refresh nanoid. |
| Next.js → sharp | Image optimization is used, with Clerk remote image hosts allowed. Refresh to patched 0.35.x. |
| Clerk → shared → js-cookie | Authentication cookie functionality is used. Refresh Clerk and its compatible cookie dependency. |
| pdfreader → pdf2json → xmldom | Untrusted PDFs reach this parser. pdf2json 3.1.4 bundles the vulnerable XML dependency, so overriding xmldom alone does not replace it. Override pdfreader's backend to pdf2json 3.2.2, which removes xmldom, instead of downgrading pdfreader to 1.x. |

The PDF backend requires Node >=20.18.0. Synthetic multi-page PDF extraction
tests exercise the real parser without student data or paid API calls. The update
also requires an exact-size PDF backing buffer: pooled buffers may otherwise
include unrelated bytes when read by the updated backend.

Recheck the two scoped overrides when updating Next.js/pdfreader. Remove them
when upstream dependency declarations select patched compatible versions.

Verification: production audit, full automated tests (including mocked auth
authorization checks and real PDF extraction), and production build. A live Clerk
sign-in and paid transcript import remain deployment smoke checks; these local
checks do not claim to exercise external accounts or paid API credentials.
