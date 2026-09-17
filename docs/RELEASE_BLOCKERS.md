# Wild Realm: Release Blockers

This document tracks **ONLY** the critical engineering issues that block deployment to Wider Beta, Play Store (Android), and App Store (iOS).

---

## 1. Wider Beta Blockers

Issues that prevent testing with a wider group of external beta users (due to security, auth collapse, data corruption, or crash risks):

1. **Unenforced Account Status Across Mutation/Read API Endpoints (P0)**
   - *Description*: Suspended, banned, deleted, or deletion-requested user accounts are only checked on `GET /me` and `PATCH /me`. All other endpoints (`/quests/*`, `/captures`, `/community/*`, `/rewards/claim`, `/store/*`) execute mutations regardless of account state.
   - *Impact*: Inactive or banned accounts can continue exploiting the platform, creating captures, claiming rewards, and writing community posts.
   - *Fix Required*: Enforce account status check universally across all API endpoints.

2. **Non-Idempotent Reward Claims & Duplicate Mutation Keys (P0)**
   - *Description*: `POST /api/v1/rewards/claim` does not process idempotency keys. Client library mutations (`useAddCardToLibrary`) generate random UUID keys per attempt instead of deterministic keys per entity, and social write paths lack idempotency.
   - *Impact*: Network retries or rapid taps can double-mint XP/coins or duplicate library cards and social interactions.
   - *Fix Required*: Require and enforce server-side `Idempotency-Key` headers on reward claims and card additions with deterministic keys.

3. **Unhandled Token Expiration & 401 Session Handling (P1)**
   - *Description*: API 401 responses (`invalid_access_token` / `authentication_required`) are not caught by `AuthContext` to trigger session cleanup or prompt sign-in.
   - *Impact*: Users with expired tokens get stuck in broken states with failing requests while appearing authenticated.
   - *Fix Required*: Intercept 401 errors globally, clear session, and navigate to `/sign-in`.

4. **Disabled Retry on Network Timeouts (P1)**
   - *Description*: `queryClient.js` explicitly disables retries whenever a request times out (`request_timeout`).
   - *Impact*: High-latency cellular connections fail permanently on transient 15s timeouts without a single retry attempt.
   - *Fix Required*: Allow retries for transient timeout/network-unavailable errors on read queries and safe mutations.

5. **Camera Permission Error Masking & Image Processing Crashes (P1)**
   - *Description*: `CaptureFlow.jsx` swallows camera exception errors as "User cancelled" and `createImageBitmap` lacks error handling for corrupted files.
   - *Impact*: Hardware errors or denied permissions cause silent UI freezes; corrupted images crash preview rendering.
   - *Fix Required*: Display user-visible error banners on camera failures and add fallback image reading.

6. **Missing App Resume Lifecycle Handling (P1)**
   - *Description*: No listener for `@capacitor/app` `appStateChange` on pause/resume.
   - *Impact*: App resumed after hours displays stale data and fails on next action due to expired tokens.
   - *Fix Required*: Trigger session verification and query invalidation on app resume.

---

## 2. Play Store Release Blockers (Android)

Issues that prevent releasing the Android app on Google Play Store:

1. **Release Workflow Builds Debug APK (`assembleDebug`) (P0)**
   - *Description*: `.github/workflows/release.yml` executes `./gradlew assembleDebug` and packages `app-debug.apk` as the release asset.
   - *Impact*: Google Play Store rejects debug APKs. Debug builds contain debug flags, unoptimized code, and debug signing keys.
   - *Fix Required*: Update CI workflow to run `./gradlew assembleRelease` (or `bundleRelease` for AAB) with release keystore configuration.

2. **CI Native Web Build Lacks Absolute API Base URL (P0)**
   - *Description*: CI runs `npm run build` instead of `VITE_API_BASE_URL=<prod_url> npm run build:native`.
   - *Impact*: Native Android bundle attempts API calls to relative `/api` (`capacitor://localhost/api`), rendering the app completely non-functional.
   - *Fix Required*: Update CI release steps to invoke `npm run build:native` with a valid production API URL.

3. **Android Versioning & Signing Configuration (P0)**
   - *Description*: `android/app/build.gradle` has `versionCode 4` / `versionName 1.0.4` while `package.json` is `1.2.0`. No release signing configuration exists.
   - *Impact*: Inability to publish or update builds on Play Console.
   - *Fix Required*: Align `build.gradle` versioning with `package.json` and configure release signing environment variables.

---

## 3. App Store Release Blockers (iOS)

Issues that prevent releasing the iOS app on Apple App Store / TestFlight:

1. **Release Workflow Produces Unsigned `.app` Zip (P1)**
   - *Description*: `.github/workflows/release.yml` builds iOS with `CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO` and zips an unsigned `App.app`.
   - *Impact*: Unsigned iOS `.app` zip cannot be installed on physical iOS devices or uploaded to TestFlight / App Store.
   - *Fix Required*: Document iOS distribution signing requirements and add Xcode archive (`xcodebuild archive`) step producing a signed `.ipa` package.

2. **CI iOS Web Build Lacks Absolute API Base URL (P0)**
   - *Description*: CI runs `npm run build` without setting `VITE_API_BASE_URL`.
   - *Impact*: iOS Capacitor app fails all API requests because relative `/api` resolves to `capacitor://localhost/api`.
   - *Fix Required*: Invoke `npm run build:native` with `VITE_API_BASE_URL` in iOS release steps.
