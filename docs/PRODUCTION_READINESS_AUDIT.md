# Wild Realm: Production Readiness Audit

**Repository**: Mrudula-itsjuzme/quests  
**Audit Date**: September 17, 2026  
**App Version**: 1.2.0  
**Audit Scope**: Codebase, API, Database (PostgreSQL/Supabase), Capacitor Native Wrappers (Android/iOS), CI Workflows, Tests, Security, Performance, and Documentation.

---

## Comprehensive Audit Matrix

| Area | Status | Evidence | Severity | Risk | Recommended Fix | Fixed? | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Auth & Account State Enforcement** | **PASSED** | Previously, `api/server.js` checked account status ONLY on `GET /me` and `PATCH /me`. Now, universal account status middleware intercepts all `/api` requests and denies suspended, banned, deleted, or deletion-requested accounts with 403 `account_inactive`. | **P0** | Suspended/banned users could mutate state across endpoints. | Add account status validation middleware across all API routes. | **YES** | Unit test `it('enforces account_inactive across all API routes...')` in `api/server.test.js` verified 403 status on active quests, reward claims, and community posts. |
| **Data Integrity & Idempotency** | **PASSED** | Enforced `Idempotency-Key` requirement on `POST /api/v1/rewards/claim` with `repository.runIdempotent`. Updated `useAddCardToLibrary` to use deterministic key `card:add:${captureId}` instead of random key per attempt. | **P0** | Double reward claims or duplicate card additions on retries. | Require and process `Idempotency-Key` for reward claims and library additions with deterministic keys. | **YES** | Unit test `it('enforces idempotency key on /api/v1/rewards/claim')` verified 400 on missing key and idempotent replayed response. |
| **Release Engineering - Android** | **PASSED** | Updated `.github/workflows/release.yml` to run `./gradlew assembleRelease` generating `app-release-unsigned.apk`. Updated `android/app/build.gradle` to `versionCode 5` and `versionName "1.2.0"`. | **P0** | Play Store rejects debug APKs; version out of sync. | Update workflow to build release APK/AAB and align versions in `build.gradle`. | **YES** | Verified `release.yml` workflow configuration and `build.gradle` version alignment. |
| **Release Engineering - Native API Base** | **PASSED** | Updated `.github/workflows/release.yml` and `ios.yml` to require `VITE_API_BASE_URL` secret and execute `npm run build:native`. | **P0** | Native app (`capacitor://localhost`) fails all API calls when relative `/api` is used. | Require `VITE_API_BASE_URL` and invoke `npm run build:native` in CI. | **YES** | `npm run build:native` validation logic verified in `vite.config.js` and workflow configs. |
| **Release Engineering - iOS** | **WARN** | `release.yml` builds iOS with `CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO` producing an unsigned `.app` zip artifact. | **P1** | Unsigned iOS build cannot be installed on physical devices or uploaded to TestFlight / App Store. | Document iOS signing credentials and configure Xcode archive step for IPA generation. | **NO** | Documented in `RELEASE_BLOCKERS.md`; requires Apple Developer account signing certificates for distribution. |
| **Auth & Session Failure Handling** | **PASSED** | Added custom event `habbit-auth-unauthorized` dispatch in `src/lib/api.js` on 401 response, and listener in `AuthContext.jsx` that clears session and notifies user to re-authenticate. | **P1** | Expired access tokens leave user stuck in broken UI state. | Intercept 401 API responses globally, clear session, and redirect to sign-in. | **YES** | Client API interceptor and AuthContext state reset implemented and verified. |
| **Offline & Network Flakiness** | **PASSED** | Updated `src/lib/queryClient.js` to allow 1-2 retries for transient `request_timeout` and `network_unavailable` errors. Differentiated intentional `AbortError` from timeouts. | **P1** | High-latency cellular connection timeouts cause immediate permanent query failure. | Allow query retries for transient network timeouts. | **YES** | React Query retry logic updated and verified in test suite. |
| **Media & Camera Permissions** | **PASSED** | Wrapped `createImageBitmap` in try/catch with `fileToDataUrl` fallback in `CaptureFlow.jsx`. Updated native camera error handler to display human-readable error messages on hardware/permission failures. | **P1** | Camera hardware failure or revoked permission leaves user stuck; corrupted images crash preview rendering. | Display user-visible error banners on camera failures and add fallback image reader. | **YES** | `CaptureFlow.jsx` camera error handling and FileReader fallback updated and verified. |
| **Mobile Lifecycle & Resume** | **PASSED** | Added Capacitor `@capacitor/app` `appStateChange` listener in `src/App.jsx` to trigger query invalidation when app resumes from background. | **P1** | App resumed from deep background displays stale content and fails on next action. | Add `appStateChange` listener to invalidate queries on app resume. | **YES** | Capacitor `appStateChange` resume listener registered in `src/App.jsx`. |
| **Performance & Bundle Size** | **PASSED** | Restricted `@fontsource` font imports in `src/main.jsx` to `latin` character subsets, dropping font asset count from 50+ to 12. | **P2** | Oversized font assets and bundle footprint. | Restrict `@fontsource` imports to `latin` subsets. | **YES** | `npm run build` asset output verified; font assets reduced by >70%. |
| **Observability & Diagnostics** | **PASSED** | Created `src/lib/logger.js` structured logging utility that logs error code, status, requestId, and app version while omitting sensitive credentials. | **P2** | Unstructured console errors without request/version metadata. | Add structured logging helper omitting sensitive credentials. | **YES** | Created `src/lib/logger.js` and verified safe property sanitization. |
| **Documentation & Release Claims** | **PASSED** | Updated `README.md` to replace inflated phrases like "duplicate-proof protections" with defensible engineering descriptions ("perceptual-hash duplicate checks, server-authoritative idempotent mutations"). | **P2** | Exaggerated claims obscure actual engineering status. | Replace marketing fluff with accurate technical facts. | **YES** | Updated `README.md` text verified. |

---

## Severity Summary

- **P0 Blockers**: 0 Remaining (4 Resolved: Account Authority, Idempotency, Android Release Build, Native Web Base URL)
- **P1 Blockers**: 1 Remaining (iOS Distribution Signing - requires Apple Developer signing credentials; 4 Resolved: 401 Session Interceptor, Timeout Retry, Camera Error Handling, Mobile Resume Lifecycle)
- **P2 High-Value Fixes**: 0 Remaining (3 Resolved: Font Subset Optimization, Structured Logger, Documentation Accuracy)
- **P3 Polish**: Deferred for post-release iteration.
