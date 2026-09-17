# Production readiness blockers

Verified locally on 2026-09-07:

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test:ci` passed (see the latest verification run below).
- PostgreSQL integration passed against a disposable PostgreSQL 16 database: 26/26 tests, including migrations run twice, completion replay/concurrency, daily bonus uniqueness, capture retry/approval, wallet persistence, and concurrent reward claims.
- `npm run build` passed.
- `git diff --check` passed.

## Must resolve before production rollout

1. Confirm the API identity role can read/write the two new tables through the deployed server. Direct client table access should remain denied by RLS; the Express API is the authority.
2. Configure every secret consumed by the fail-closed `Production env gate` job. A main-branch push now fails when production configuration is missing or unsafe instead of silently skipping validation.
3. Verify the deployed authentication issuer/audience, scenic-place provider, vision provider, media storage, and moderation operator path. Local or synthetic provider configuration is not production evidence.
4. Install the release build on at least one physical Android device and one iPhone. Recheck sign-up keyboard/scroll behavior, map permissions, reduced motion, save/rating controls, capture media decoding, and offline/retry behavior.

Resolved on 2026-09-07: all pending migrations were applied to the database configured in `.env`. `033_hotspot_retention.sql` is recorded in `schema_migrations`; `saved_hotspots` and `hotspot_ratings` exist with their primary keys, foreign keys, and rating-range constraint.

## Reward and idempotency audit

- Quest completion locks the user and assignment in one PostgreSQL transaction. `quest_xp_ledger.ledger_key` prevents replayed completion XP, and the daily bonus has its own unique ledger key.
- Capture minting stores the card, media, XP ledger, coin ledger, and user XP update in one transaction. `capture_xp_ledger.card_id` and `coin_ledger.ledger_key` prevent duplicate credits.
- A client `captureId` is serialized with a transaction-scoped advisory lock before the same-user/cross-user check. Concurrent retries return the original card; the unique database index remains the final duplicate boundary.
- Already-completed quests return zero newly credited XP. Concurrent daily completion/bonus, same-`captureId` creation, capture approval, and level-reward claims all passed against PostgreSQL 16.
- Store purchases now use a stable request key, a per-user row lock, a unique ledger key, and one transaction for balance validation, debit, inventory grant, and replay response persistence.
- Chest opening now uses the same transactional request-key boundary for inventory consumption, loot credit, and regional-event contribution. Duplicate and concurrent replays return the original loot without consuming or crediting twice.

## Release workflow

Resolved on 2026-09-07: the release job now has job-scoped `contents: write`, uses the Node 24-compatible `softprops/action-gh-release@v3`, and fails if either expected artifact is absent. JavaScript actions in the release workflow were upgraded to their Node 24-compatible current majors. A new tag run is still required to confirm repository-level Actions policy permits release creation.

## Follow-up scope not claimed complete

- Mini expeditions and seasonal collections need product rules, moderation/visibility rules, and database/API implementation.
- Photo revisit currently exists through the player's capture clusters and Collection history, but a dedicated date-comparison revisit experience is not yet implemented.
- The quest catalog is exploration-oriented, but truly local niche generation still needs an approved source/provider contract and evaluation criteria.
