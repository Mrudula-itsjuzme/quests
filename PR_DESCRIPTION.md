Title: Production readiness: tighten config, migrations, and CI

Description
 - Tighten production configuration validation to fail closed when insecure or incomplete (HTTPS OIDC/CORS, real vision provider, provider HTTP verifier).
 - Add forward migrations to align Postgres schema with the 10-quest daily deck behavior and to fix prior uniqueness assumptions.
 - Add GitHub Actions CI (`.github/workflows/ci.yml`) to run unit tests and Postgres integration tests on push/PR.

What I tested
 - Ran `npm run test:ci` locally — unit and server tests passed.
 - Started a local Postgres container, ran `npm run migrate`, and executed `api/postgres.integration.test.js` — all Postgres integration tests passed.

Notes for reviewers
 - Production deploys must set the required environment variables; see `api/config.js` for the exact checks.
 - The migration `024_daily_state_total_assignments_limit.sql` increases the allowed daily assignments to 10; ensure you run migrations prior to deploy.
