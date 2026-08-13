# HABBIT Quest Engine

Standalone HABBIT Quest Hub with a user-owned, DOCX-aligned quest engine, premium React experience, and Flutter client. Supabase owns credentials and sessions; Express validates asymmetric access tokens and PostgreSQL remains authoritative for quest state.

## Product journey

`Landing → Sign in or sign up → Onboarding → Guided tour → Quest dashboard`

The website includes a lazy-loaded WebGL Quest Compass with a static fallback. Flutter uses matched rendered compass artwork and honors the same motion preference while retaining usable content if animation is disabled.

## Local development

```bash
npm install
npm run migrate
export DEV_AUTH_ENABLED=true
export DEV_ALLOW_LEGACY_MUTATIONS=true
export PROVIDER_MODE=local
npm run dev:full
```

The Vite app runs on `http://localhost:3000` and proxies `/api/*` to the Express API on `http://localhost:3001`. Development auth, legacy mutations, and deterministic providers are opt-in, and both development listeners bind to loopback by default.

For real authentication, configure the public clients and API with:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export VITE_SUPABASE_URL=$SUPABASE_URL
export VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Production derives the JWT issuer and JWKS endpoint from `SUPABASE_URL`, requires audience `authenticated`, and rejects symmetric algorithms. Never expose a service-role key to either client.

## API base URL

The web deployment serves the built client and the API from the **same origin**
(`api/server.js` mounts `/api` and also serves `dist/`), so `VITE_API_BASE_URL`
is not required and the client's default relative `/api` base is correct.

Native (Capacitor) builds are different: the WebView loads from
`capacitor://localhost`, where a relative `/api` resolves to the device rather
than the server. Native builds must be given an absolute URL:

```bash
VITE_API_BASE_URL=https://your-backend.example.com/api npm run build:native
npx cap sync android
```

`npm run build:native` sets `VITE_NATIVE_BUILD=true`, which makes a missing
`VITE_API_BASE_URL` fail at build time instead of shipping a client that
silently calls the device. The backend must also list the native origin in
`CORS_ORIGINS`, since a native build is cross-origin:

```bash
export CORS_ORIGINS=https://your-backend.example.com,capacitor://localhost,http://localhost
```

## Explore map data

The Explore map renders two real layers:

- **Curated world hotspots** — `world_hotspots`, served by
  `GET /api/v1/world/hotspots` (optional `category` and
  `bbox=minLng,minLat,maxLng,maxLat` filters). Migration `018` seeds demo rows
  flagged `is_demo = TRUE`; replace them with curated content by inserting rows
  with `is_demo = FALSE`.
- **The player's own capture clusters** — derived from GPS-tagged captures.

Both arrive through the normal React Query data layer. Running `npm run migrate`
creates and seeds the table; without `DATABASE_URL` the in-memory repository
serves the same demo set from `api/lib/world-hotspots.js`.

## Docker

```bash
POSTGRES_PASSWORD="choose-a-local-secret" docker compose up --build
```

Docker builds the Vite app, applies the ordered migrations, serves it from Express as a non-root user, and starts PostgreSQL. Its development ports bind to localhost only; open `http://localhost:3001`.

Without `DATABASE_URL`, development uses a bounded in-memory repository. Production must use PostgreSQL, OIDC/JWT authentication, and non-local provider adapters.

## Quest engine

- Daily generation creates one Mind, one Body, and one Discovery quest in the user's IANA timezone.
- Weekly generation creates one photo quest per Monday-Sunday UTC period.
- Monthly generation creates one multi-proof expedition per local calendar month.
- Discovery and weekly selection use the documented rarity weights and cooldowns.
- Quest, daily-bonus, and streak rewards are transactionally idempotent.
- Versioned writes require an `Idempotency-Key` header.
- Current React endpoints remain available as development-safe compatibility adapters.

## API

- `GET /api/v1/me`
- `PATCH /api/v1/me`
- `GET /api/v1/quests/active`
- `GET /api/v1/quests/history`
- `GET /api/v1/quests/definitions`
- `POST /api/v1/quests/generate-daily`
- `POST /api/v1/quests/generate-weekly`
- `POST /api/v1/quests/generate-monthly`
- `POST /api/v1/quests/:assignmentId/progress`
- `POST /api/v1/quests/:assignmentId/submissions`
- `GET /api/v1/feed`
- `GET /api/v1/leaderboard`
- `GET /api/v1/rewards`
- `POST /api/v1/rewards/claim`
- `GET /api/v1/notifications`
- `GET /api/v1/admin/submissions/review-queue`
- `POST /api/v1/admin/submissions/:submissionId/review`

## Database

`npm run migrate` applies ordered transactional migrations from `db/migrations/`. Core tables cover:

- users and provider-neutral OIDC subjects;
- quest definitions and immutable assignment snapshots;
- submissions, private upload references, perceptual-hash checks, and review decisions;
- transactional generation-run records and per-day bonus/streak state;
- XP ledger entries, daily bonuses, milestone inventory, and streak state;
- idempotency keys and collectible hooks.
- onboarding path, reminder, motion, and tour-version preferences.

`db/init.sql` is intentionally not the schema source of truth.

## Deployment

See [docs/deployment.md](docs/deployment.md) for the full Render deployment
guide: environment variables, Supabase configuration, migrations, health
checks, smoke tests, and rollback procedure. See
[.env.production.example](.env.production.example) for the complete
environment variable reference.

## Security and providers

See [docs/backend-security.md](docs/backend-security.md). Local health, storage,
photo verification, cache, and scheduler adapters are deterministic development
implementations. Production requires the HTTP photo-verification adapter and a
cron secret; it fails startup if development authentication, legacy mutation
bypasses, or local providers are enabled. Health integration is deliberately
not included.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
docker build -t quests-app-ci .
```

Flutter:

```bash
cd mobile_flutter
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
  --dart-define=API_BASE_URL=http://10.0.2.2:3001/api
flutter analyze
flutter test
```
