# Deployment guide (Render)

This deploys HABBIT Quests as a single Docker web service on Render, backed by
Render's managed PostgreSQL, with Express serving both the API and the built
React app from one origin.

## 1. Prerequisites

- A Supabase project (for authentication).
- A Render account.
- This repository pushed to a Git provider Render can access.

## 2. Create the Supabase project

1. Create a project at https://supabase.com (or use an existing one).
2. In **Project Settings → API**, copy:
   - **Project URL** → used as `SUPABASE_URL` (backend) and `VITE_SUPABASE_URL` (frontend).
   - **anon / publishable key** → used as `VITE_SUPABASE_PUBLISHABLE_KEY`. Do **not**
     use the `service_role` key anywhere in this app — it must never reach the client
     or the API.
3. In **Authentication → URL Configuration**, set:
   - **Site URL**: `https://YOUR-RENDER-SERVICE.onrender.com`
   - **Redirect URLs**: add `https://YOUR-RENDER-SERVICE.onrender.com/*`
   (Since this deployment uses password-based email auth, not OAuth redirects,
   this mainly matters if you later enable email confirmation links or OAuth
   providers — email confirmation links use the Site URL.)
4. In **Authentication → Providers → Email**, keep "Confirm email" on for
   production so `sign-up` requires verification before `sign-in` succeeds.
5. No Supabase database is used by this app — Postgres for quest data is
   Render's managed Postgres, configured separately below. Supabase here is
   the identity provider only.

## 3. Create Render's managed PostgreSQL

1. Render dashboard → **New → PostgreSQL**.
2. Choose a plan/region. Note the generated **Internal Database URL** once
   created (starts with `postgres://`).
3. This becomes `DATABASE_URL` in the web service. Use the **internal** URL
   if your web service is also on Render (faster, no public exposure); use
   the external URL only if the web service lives outside Render.

## 4. Create the Render web service

1. Render dashboard → **New → Web Service** → connect this repository.
2. **Runtime**: Docker (Render will use the repository's `Dockerfile`).
3. **Health Check Path**: `/health`
4. Render does not have a distinct "readiness" concept the way Kubernetes
   does; `/ready` is available for your own manual checks and any external
   uptime monitor you attach (see the smoke-test section) — it verifies the
   database connection specifically, whereas `/health` is a pure liveness
   check that does not touch the database.
5. **Instance type**: any; single instance is enough for an MVP (no
   multi-service split; the Docker image serves both API and static frontend).

## 5. Environment variables

Set these in the Render service's **Environment** tab. See
[`.env.production.example`](../.env.production.example) for the full reference
with explanations (this repository's environment could not contain a literal
`.env.example` file — see the note at the top of that file).

Required in production:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Render Postgres internal connection string |
| `DATABASE_SSL` | `true` |
| `SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_URL` | same Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `VITE_API_BASE_URL` | `/api` (same-origin deployment) |
| `CORS_ORIGINS` | `https://YOUR-RENDER-SERVICE.onrender.com` |
| `TRUST_PROXY` | `1` |
| `DEV_AUTH_ENABLED` | `false` (or omit — defaults to false) |
| `DEV_ALLOW_LEGACY_MUTATIONS` | `false` (or omit) |
| `PROVIDER_MODE` | `disabled` (or omit — this is the schema default) |

`PORT` does not need to be set — Render injects its own `PORT`, and the app
reads `process.env.PORT` with a default of `3001`; Render's injected value
takes precedence automatically since it's the same environment variable name.

The `VITE_*` variables are build-time — Render must have them set **before**
the Docker build runs (Render environment variables are available during
`docker build` for services configured with build-time env, which is the
default for Render's Docker runtime). Confirm the built `dist/assets/*.js`
contains your Supabase URL (not a placeholder) after the first deploy if in doubt.

## 6. Migrations

Migrations run automatically on container start via
`scripts/docker-entrypoint.sh`, which runs `node api/migrate.js` before
starting the server whenever `DATABASE_URL` or `POSTGRES_URL` is present.
Migrations are idempotent and tracked in a `schema_migrations` table guarded
by a Postgres advisory lock, so concurrent container starts (e.g. a rolling
deploy) cannot double-apply them.

To run migrations manually against the Render database from your machine:

```bash
DATABASE_URL="<render-external-connection-string>" npm run migrate
```

## 7. Deploy

Push to the branch Render is watching (or trigger a manual deploy from the
Render dashboard). Render builds the Dockerfile, runs the container, and
routes traffic to it once the `/health` check passes.

## 8. Health verification

```bash
curl https://YOUR-RENDER-SERVICE.onrender.com/health
# {"status":"ok","database":"configured"}

curl https://YOUR-RENDER-SERVICE.onrender.com/ready
# {"status":"ready","database":"postgres"}
```

`/health` never touches the database (pure liveness). `/ready` runs
`SELECT 1` against Postgres and returns 503 if that fails — use it for your
own monitoring, not as the Render health check path (Render only supports
one path, and `/health` is the safer choice so a transient DB blip doesn't
cause Render to cycle the instance).

## 9. Smoke test procedure

1. Load `https://YOUR-RENDER-SERVICE.onrender.com/` — Landing page renders.
2. Click **Get started**, sign up with a test email/password.
3. Confirm the email (check Supabase's email logs in dev, or your inbox).
4. Sign in. You should land on **Onboarding**.
5. Complete onboarding (timezone pre-filled from the browser, editable).
6. On the **Dashboard**, confirm XP/Level/Streak show real starting values
   (0 XP, Level 1) — not fixed placeholder numbers.
7. Go to **Quests**, generate daily and weekly quests.
8. Open a TEXT-verification quest, submit a proof ≥ 8 characters — status
   should move to `completed` and XP should increase by exactly that quest's
   reward, once.
9. Open a PHOTO-verification quest and attempt to upload — since
   `PROVIDER_MODE=disabled` in production, expect the honest
   "Photo verification is not available yet" message, not a fake approval.
10. Visit **Gallery** — should reflect only collectibles the backend actually
    unlocked (empty state if none yet).
11. Visit **Profile**, edit display name/timezone, save, reload — confirm
    persistence.
12. Sign out — confirm you're returned to the landing/sign-in flow and
    protected routes redirect correctly.

## 10. Rollback procedure

Render keeps prior deploys. To roll back:

1. Render dashboard → service → **Events/Deploys** tab.
2. Select the last known-good deploy → **Rollback to this deploy**.
3. Because migrations are additive and idempotent (tracked in
   `schema_migrations`), rolling back the application code does **not** roll
   back the schema. If a migration introduced a breaking schema change, you
   must assess whether the previous application version is still compatible
   with the current schema before rolling back the app alone. This
   repository's migrations to date are additive (new tables/columns), so
   rollback of app code alone is safe for the current migration set
   (`001`–`005`).
4. If a bad migration must be undone, write and apply a new forward migration
   that reverses it — do not hand-edit `schema_migrations` or delete rows
   from it.

## 11. Known limitations

- **Photo and automatic health verification are disabled in production**
  (`PROVIDER_MODE=disabled`). Endpoints that require them return
  `provider_not_configured` (HTTP 503), and the frontend shows this honestly
  rather than faking approval. Enabling real verification requires wiring a
  real storage provider (e.g. S3/Supabase Storage) and a real photo/health
  verification service into `api/lib/providers.js`, which is out of scope for
  this deployment.
- Flutter parity, CI hardening beyond the steps listed in
  `.github/workflows/ci.yml`, and multi-region/multi-instance scaling are not
  covered by this guide.
