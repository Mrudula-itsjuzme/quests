# Release Notes — 2026-09-01 Production Readiness Pass

Summary
- Tightened production configuration validation (OIDC/CORS/vision/provider checks).
- Updated Postgres schema to support 10 daily quests per user and added migration.
- Added GitHub Actions CI workflow for unit and Postgres integration tests.
- Added health/readiness endpoints and rate-limiting enforcement (already present).

Files changed
- `api/config.js`: stricter production checks for provider and secrets.
- `db/migrations/023_daily_deck_definition_uniqueness.sql`: migration to change uniqueness from category -> definition_id.
- `db/migrations/024_daily_state_total_assignments_limit.sql`: migration to increase daily deck limit to 10.
- `.github/workflows/ci.yml`: CI workflow.

Notes
- Integration tests were executed locally against Postgres and all Postgres integration tests passed.
- Production requires setting `PROVIDER_MODE=http`, `QUEST_AI_VERIFY_URL`, `QUEST_PROVIDER_SECRET`, and HTTPS OIDC/CORS endpoints.
