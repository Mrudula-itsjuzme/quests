# Backend security and provider model

## Trust boundaries

- The reverse proxy terminates TLS and forwards only from a configured trusted hop count.
- OIDC access tokens are validated against an allowlisted issuer, audience, JWKS endpoint, and asymmetric algorithms.
- The token `sub` claim is the user boundary. Query parameters and request bodies never select another account.
- PostgreSQL is authoritative for assignments, submissions, XP, streaks, and idempotency.
- Storage, health, and photo adapters return normalized domain results. The core engine never fetches arbitrary URLs or writes arbitrary paths.

## Production requirements

Set `NODE_ENV=production`, configure `DATABASE_URL`, set
`DEV_AUTH_ENABLED=false`, `DEV_ALLOW_LEGACY_MUTATIONS=false`,
`PROVIDER_MODE=http`, configure the HTTPS verifier and its secret, set a
separate cron secret, and configure HTTPS OIDC metadata. Startup rejects an
ephemeral repository, local/disabled providers, or plaintext OIDC/provider
endpoints in production. Use PostgreSQL credentials limited to the quest
schema and enable `DATABASE_SSL` where the connection crosses a network
boundary.

Idempotency responses are retained for seven days. A processing reservation older than two minutes is recoverable so a crashed worker cannot permanently block the key; all reward mutations remain protected by assignment, ledger, period, and photo-hash uniqueness constraints.

## Development-only behavior

`DEV_AUTH_ENABLED` supplies one fixed local identity. `DEV_ALLOW_LEGACY_MUTATIONS` permits the old React create/complete workflow. `PROVIDER_MODE=local` provides deterministic, opaque upload references matching `local_[A-Za-z0-9_-]{8,80}`. Production configuration rejects all three behaviors.

## Sensitive-data handling

Request logs contain request ID, method, route, and normalized error code only. Raw authorization tokens, text proof, health values, image references, provider responses, and request bodies are not logged. Live adapters must preserve this rule.

## Provider status

- Object storage: private per-user Supabase Storage paths; no public URLs are persisted.
- Photo AI: authenticated HTTP verifier with subject confidence, perceptual hash, and metadata signals.
- Health: deliberately deferred; AUTO quests fail closed.
- Redis: optional shared rate/idempotency cache; the bounded memory cache is development-only.
- Scheduler: authenticated periodic pre-generation with per-period idempotency and deduplicated notices.
