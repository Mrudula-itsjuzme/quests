# Wild Realm daily-use readiness

Status: **not production-ready**. This is an evidence ledger, not a release certificate.

## Verified during the current pass

- Auth cache now belongs to one identity. Switching identity remounts the query boundary, cancels old queries and isolates delayed writes. Regression covers account A to B and stale callbacks.
- Restored authenticated sessions override stale guest mode. A delayed initial session result cannot overwrite a newer auth event. Session lookup rejection exits loading.
- Profile search now has a rendered UI, debouncing, retry/empty/loading states, bounded API inputs, and both repository implementations.
- Public profile uses actual API field names, protected image loading, follow feedback, retry, and a stable Community return link.
- Account/search tests passed independently. Final full-suite verification remains pending after the latest changes.
- Lint, type checking, and build passed before the final search-cache invalidation change.

## Confirmed connection blockers (2026-09-16)

Read-only probes of this checkout's `.env`, with credentials omitted from output:

- Configured PostgreSQL hostname: DNS `ENOTFOUND`, reproduced outside filesystem/network sandbox.
- Configured Supabase hostname: DNS `ENOTFOUND`.
- Configured API: HTTP URL; `/health` and `/ready` both return connection refused outside sandbox.
- Database schema, actual stored records, production identity and persistence cannot be certified against these endpoints. No migration or data deletion was performed.
- Need the current deployed URL and active Supabase project configuration. Never paste service/database secrets into chat; update the local secret environment securely.

## Remaining acceptance work

| Area | Required evidence |
| --- | --- |
| Database | Reachable real PostgreSQL; migration inventory; storage/RLS ownership tests; save/read across sessions |
| Authentication | Real sign-in/sign-out, expired session, account switch, password/OAuth recovery and native callback |
| Profiles/social | Live two-account search/follow/comment visibility, abuse handling; real private messaging is still absent |
| Camera | Device permission, front/rear, torch, image upload, review, failure retry, Journal/Quest handoff and sharing |
| UI | Current mobile screenshots across narrow/short viewports, keyboard and reduced motion, no overlays hiding controls |
| Performance | Production bundle and requests measured; image-heavy feed, slow/offline network, representative concurrent-user load |
| Operations | HTTPS health/readiness, monitored errors, backups/restore, rate limiting and rollout/rollback |
| QA reports/manuals | Reconcile remaining design/manual/report requirements with current rendered implementation |

Guest demo data and pre-existing seeded development database rows are distinct. Removing automatic seeding does not erase old rows. Do not blanket-delete user data.

Other edits appeared in this shared checkout during the pass (including migrations and alternate frontend files). They are preserved and are not implicitly validated by the fixes above.

### Latest validation

`npm test -- --run --maxWorkers=2`: **234 passed, 35 skipped**, 27 passing files and one skipped file. The skipped PostgreSQL suite is not deployment evidence. The authenticated-image unit test now mocks authentication explicitly rather than depending on local Supabase configuration. Lint, typecheck, production build and `git diff --check` passed. New profile/search screens still need browser verification against reachable backend data.

### Slow-network and authenticated-media follow-up

- API reads now have a 20-second deadline; writes have 90 seconds to accommodate image upload/verification. Deadlines include JSON body reading and abort the transport. Writes are not automatically retried; a timed-out write may have reached the server and still needs reconciliation before user retry.
- Caller cancellation remains cancellation, not a network-error retry. Successful malformed JSON raises `invalid_response` instead of becoming null data.
- Authenticated media only sends session credentials to the configured API origin. Untrusted external references fall back without an authenticated fetch.
- API/App affected suites: 28 passed. Lint/typecheck passed for the request changes. These tests simulate failure modes and are not production latency measurements.

### Capture retry follow-up

- Repeated submission of the same capture now reuses its idempotency key. Candidate confirmation uses a distinct key so it does not replay the initial candidate response.
- Connection failures retain the pending photo and offer retry without recapture; network failures no longer accuse the photo of being an invalid nature subject.
- Server capture replay now precedes duplicate-image detection inside the idempotent operation. A lost successful response returns the original saved card on retry.
- Verified: 84 API tests passed, including completed-capture replay with exactly one stored card; three capture flow/retry tests passed. Lint/typecheck passed. Real PostgreSQL concurrency remains unverified.

### Protected media caching

- Fixed approved capture media being emitted with `public, max-age=300` even on owner-only routes. The moderation `publicSafe` flag is no longer used as shared-cache authorization.
- Capture and community media responses, including storage redirects, now use `private, no-store` and `Vary: Authorization`. Authenticated frontend image requests also use `cache: no-store`.
- Verified 86 API/image tests, including owner retrieval, denial to another account, provisional media protection, community media access and cache headers. Previously distributed cached responses cannot be revoked by this local code change; deploy and inspect actual edge-cache policy before release.

### Inactive profile visibility — 2026-09-17

- Search, direct public-profile lookup and follow-target checks now exclude inactive accounts in both repositories.
- Fixed development search checking `accountStatus` while deletion writes `status`; it now reads the effective status consistently.
- Verified 87 API/search tests including a real deletion-request transition followed by search, direct lookup and follow attempts. PostgreSQL SQL paths were updated but require the still-unavailable integration database for live verification.

### Account-status enforcement — 2026-09-17

- API requests now check persisted account status after authentication. A still-valid token cannot access API routes for a suspended, banned or deleted account.
- Accounts awaiting deletion retain read access and idempotent deletion-request submission, but other writes are denied. PostgreSQL user mapping now carries account status to this check.
- Verified 88 API/search tests, including all three inactive statuses, blocked profile writes during pending deletion, and repeated deletion-request compatibility. Syntax and whitespace checks pass. This adds one account lookup per authenticated request; production latency must be measured against the real database.

### QA-report reconciliation — Library/search

- Revisited report 1 BUG-007 and BUG-010 and the report 2 pre-release checklist. Current Library filters use semantic categories instead of old elements, but Flora had no visible filter. Added Plants and verified switching Plants/Wildlife shows the correct saved captures.
- Explore searches loaded map content, not arbitrary cities. Updated input label/placeholder and empty-result explanation to make that scope explicit. Global city geocoding remains unimplemented.
- Verified 24 Library/App tests; lint and typecheck passed. Reports still contain unresolved live OAuth, native-camera, keyboard, clubs/events and messaging acceptance requirements. These two changes do not close the overall QA reports.

### Failed-load UX — 2026-09-17

- Journal no longer presents a failed capture request as an empty new collection. It shows retry guidance, preserves available cached cards, and avoids reporting zero statistics when nothing loaded.
- Species catalogue loading no longer blocks rendering already-loaded captures. Catalogue failure has its own recoverable notice.
- Onboarding refuses to edit a blank profile when the existing account request failed; retry must succeed first.
- Verified 26 affected App/Journal/onboarding tests. Corrected older empty-journal test fixtures that had returned 404 rather than a successful empty capture list. Lint/typecheck passed before final test/CSS additions; whitespace check passed.

### Real PostgreSQL verification on an isolated local instance — 2026-09-17

- Used installed PostgreSQL 16 in a newly initialized `/tmp` cluster on loopback port 55439. No configured deployment database or user records were touched.
- Current clean baseline was `8015bbf` (app version 1.2.0). Its full suite passed **280 tests with no skipped files**, including all 35 existing PostgreSQL tests.
- Added real-SQL profile coverage; it initially failed with `column u.status does not exist`. Fixed search to use `account_status`, restored inactive direct-profile/follow filtering, and exposed persisted status through the user mapping.
- All **36 PostgreSQL tests passed** after the status fixes. Expanded the new test to check literal wildcard search and absence of private preferences from public search responses; that targeted test passed after those additional fixes.
- Database migrations ran successfully and their idempotent rerun passed on this isolated instance. This verifies local SQL behavior, not live Supabase connectivity, deployment migrations, production role privileges, backups or capacity.

### Retake identity regression on 1.2.0

- Current hook retained a single mutable key after a failed capture and regenerated it on every candidate retry. A different retaken photo could reuse the old key; a retry of the same candidate could lose its deduplication identity.
- Request identity now derives from capture ID and candidate index. Verified all three input paths generate a capture ID; legacy callers without one retain a generated key.
- Four capture/retry tests passed, including failed candidate retry and switching to a new photo before the failed request succeeds. No deployment performed.

### Small-animation reliability

- Animated counters now respect system reduced motion and the live Calm Motion setting. Enabling it stops an active count animation and displays the actual value immediately.
- Floating XP previously waited for an exit callback to hide, while its parent waited for that callback to start hiding. It now completes after 1.2 seconds, cancels callbacks on unmount, and keeps the reward readable without travel/scale animation under reduced motion.
- Five affected counter/XP/quest-detail tests passed; the two level-up tests also passed in the preceding targeted run. These are interaction tests, not fresh visual/device evidence.
