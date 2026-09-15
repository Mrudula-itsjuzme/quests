# Wild Realm release readiness

Status: code-complete for a credentialed staging deployment. Production launch remains blocked on the external accounts, secrets, signed-store builds, and real curated hotspot data listed below.

## Complete in this pass

- Production configuration fails closed when PostgreSQL, Supabase client/server alignment, HTTPS API/provider URLs, explicit CORS origins, scheduler auth, or real verification providers are missing.
- Development auth, legacy mutation routes, deterministic proof verification, and stub vision identification cannot silently run in production.
- The HTTP proof verifier and OpenRouter vision adapter use authenticated requests, bounded timeouts/retries, response validation, and safe failure codes. Malformed or unavailable provider responses cannot award completion.
- Capture replay/idempotency and high-rarity review boundaries remain server-authoritative and are covered by unit and PostgreSQL integration tests.
- Demo hotspot rows are hidden by default in production. Explore displays an honest empty state while retaining the player's own GPS-tagged capture clusters and bbox/category filtering.
- Capacitor requires an absolute HTTPS backend URL, permits only the exact native web origins at the API boundary, disables broad cleartext traffic, and declares camera/location usage.
- Android and iOS web assets sync successfully. An Android debug APK builds successfully.
- Day and Night palettes, core mobile routes, camera filters, card navigation/flip, community Nearby, fixed navigation, and 320/360/390/430 px overflow were regression-checked.
- CI runs lint, type checking, unit tests, a clean PostgreSQL migration/integration job, a blocking high-severity production dependency audit, build, and production configuration preflight.
- The Docker image builds from Node 22 and excludes native, release, QA, database, and tool-state artifacts from its context.

## Required production environment

Set these on the web service. Values shown are shapes, not usable credentials.

| Variable | Required value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | PostgreSQL connection URL |
| `DATABASE_SSL` | `true` for managed TLS databases |
| `SUPABASE_URL` | `https://PROJECT.supabase.co` |
| `VITE_SUPABASE_URL` | exactly the same project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable/anon key only; never service role |
| `VITE_API_BASE_URL` | `/api` for same-origin web; absolute HTTPS URL for native |
| `CORS_ORIGINS` | exact HTTPS web origins plus `capacitor://localhost,http://localhost` for native |
| `TRUST_PROXY` | normally `1` on Render |
| `DEV_AUTH_ENABLED` | `false` or omitted |
| `DEV_ALLOW_LEGACY_MUTATIONS` | `false` or omitted |
| `PROVIDER_MODE` | `http` |
| `QUEST_AI_VERIFY_URL` | HTTPS proof-verifier endpoint |
| `QUEST_PROVIDER_SECRET` | verifier bearer secret, at least 16 characters |
| `QUEST_PROVIDER_TIMEOUT_MS` | recommended `10000` |
| `QUEST_PROVIDER_MAX_RETRIES` | recommended `1` |
| `VISION_PROVIDER` | `openrouter` |
| `OPENROUTER_API_KEY` | server-side OpenRouter key |
| `OPENROUTER_VISION_MODEL` | reviewed supported vision model |
| `VISION_PROVIDER_TIMEOUT_MS` | recommended `20000` |
| `VISION_PROVIDER_MAX_RETRIES` | recommended `1` |
| `INCLUDE_DEMO_HOTSPOTS` | `false` |
| `CRON_SECRET` | random scheduler bearer secret, at least 16 characters |

Optional: `POSTGRES_URL` as a `DATABASE_URL` alternative, rate-limit/body-size tuning, `QUEST_NOTIFICATION_URL`, and explicit OIDC overrides. See `.env.production.example` for every supported variable.

## External and manual setup still required

1. Create/configure the Supabase project, allowed redirect URLs, and private `quest-proofs` bucket policy. Supply only the publishable key to Vite.
2. Provision PostgreSQL and supply its URL/TLS setting.
3. Deploy a compatible HTTPS proof-verifier service and provision its shared bearer secret.
4. Provision the server-side OpenRouter account/key and approve the selected vision model's cost, retention, and regional policy.
5. Set the exact web/native CORS origins and the public native API URL.
6. Insert reviewed, non-demo hotspot rows (`is_demo = FALSE`) before claiming curated coverage in a city. The app deliberately does not infer or fabricate nearby places.
7. Update `SCHEDULER_URL` in `render.yaml` if the Render service hostname differs from `quests-app.onrender.com`.
8. Configure Supabase native OAuth/deep-link redirect schemes if social sign-in is enabled. Password auth and web redirects do not prove native OAuth callback handling.
9. Configure Android release signing and create a signed AAB/APK. Configure Apple certificates/profiles on macOS and archive with Xcode.
10. Perform physical-device camera, GPS, keyboard, offline/interrupted-network, and auth callback checks on supported Android and iOS versions.

## Deploy

1. Add all required environment values to the Render web service before building. Render exposes non-secret `VITE_*` values as Docker build arguments.
2. Sync the checked-in `render.yaml` Blueprint. It builds the root `Dockerfile`, whose entrypoint applies migrations before starting the server.
3. Confirm the cron service has the same `CRON_SECRET` and the correct HTTPS `SCHEDULER_URL`.
4. Wait for `/health` to pass, then verify `/ready` returns the PostgreSQL readiness response.
5. Do not promote a build whose production-config preflight, migrations, or provider probes fail.

For a manual image build:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=/api \
  --build-arg VITE_SUPABASE_URL=https://PROJECT.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY \
  -t quests-app:release .
```

The publishable key is intentionally client-visible. Never pass database, service-role, OpenRouter, cron, or verifier secrets as Docker build arguments.

## Smoke test

1. Check `GET /health` and `GET /ready` over HTTPS.
2. Sign up, confirm the email, sign in, complete onboarding, reload, and confirm profile persistence.
3. Generate daily and weekly quests; verify displayed XP, progress, and rewards match server responses.
4. Submit text proof and confirm the XP ledger awards exactly once.
5. Upload a fresh JPEG/PNG/WEBP to a photo quest. Confirm the object remains private and the external verifier returns a bounded approval, rejection, or review result.
6. Retry the same `captureId`; confirm no duplicate quest completion, collectible, XP, or coin award.
7. Confirm Library contains only unlocked captures and that card next/previous, flip, filter, search, and detail interactions work.
8. Confirm Community Feed/Chats/Nearby load real server data or honest empty/error states.
9. With production demo data disabled, confirm Explore contains only reviewed `is_demo = FALSE` hotspots and the user's own GPS clusters.
10. On real Android and iOS devices, verify camera/GPS denial and grant, safe areas, keyboard, dock, dark theme, interrupted network, and auth callback behavior.
11. Trigger the scheduler with its bearer token and confirm an unauthorized request is rejected.

## Rollback

1. Select the previous known-good Render deploy and inspect the target revision's migration compatibility.
2. Roll back application code only when it remains compatible with the current additive schema.
3. Never delete `schema_migrations` rows or manually reverse production DDL. Apply a reviewed forward corrective migration when schema rollback is necessary.
4. Re-run `/health`, `/ready`, authentication, quest generation, proof verification, and replay/idempotency smoke tests after rollback.
5. Rotate any credential involved in the incident independently of the code rollback.

## Known limitations

- No production credentials or external verifier were available in this pass, so real Supabase authentication, private media upload/readback, OpenRouter identification, and the proof-verifier contract require staging validation.
- Automatic health/fitness proof verification remains unavailable and fails closed; no synthetic fallback is enabled in production.
- Production intentionally has no bundled curated hotspots. An empty Explore result is correct until reviewed rows are inserted.
- Flutter analysis and all 9 tests pass in `mobile_flutter`; store signing and physical-device validation remain manual.
- iOS sync works on Linux, but signing/archive and device checks require macOS/Xcode and Apple credentials.
- The verified Android artifact is a debug APK, not a signed or store-ready release.
- Native social OAuth/deep-link callbacks need provider/dashboard and device validation before enabling them for launch.
- The main web bundle still emits a non-blocking large-chunk warning; route chunks exist, but further bundle work was not required for correctness in this pass.
- Guest showcase photography is bundled locally under its documented Unsplash license; production user captures use private authenticated media instead.
