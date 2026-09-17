# Wild Realm Blueprint — Requirement Map (Phase 0.5)

Baseline: HEAD `0b40c99` on `wild-realm-alignment`. Tests 130 passed / 20 skipped
(Postgres integration, needs a live DB). Lint clean. Typecheck clean. Build clean
(one >500kB chunk warning, pre-existing).

Legend: EXISTS = matches blueprint. PARTIAL = present but incomplete/wrong shape.
MISSING = not built. CONFLICTING = built to a different spec than the blueprint.

## Capture pipeline (§14)
- **EXISTS** — CaptureBundle-equivalent client payload (`captureTelemetry.js`,
  `CaptureFlow.jsx`): gps, capturedAt, heading, liveness, exif.
- **EXISTS** — captureId idempotency end-to-end: client generates
  `crypto.randomUUID()`, server requires `Idempotency-Key` header,
  `runIdempotent()` wraps creation, `captured_cards.capture_id` has a unique
  partial index (`db/migrations/010`).
- **EXISTS** — server clock authority: `serverReceivedAt` recorded and checked
  against `capturedAt` skew in `telemetryConsistencyDetector`.
- **PARTIAL** — offline queue/sync (§14, §26): not audited yet in CaptureFlow;
  verify during Phase 4.

## Anti-cheat gate (§15.1–15.2)
- **EXISTS** — `api/lib/anti-cheat.js`: 8 detectors, PASS/FLAG/REJECT verdicts,
  FLAG_THRESHOLD=2 hard-coded to match §15.2, PASS_WITH_REVIEW routes to
  provisional. Honestly marks 3 detectors (`screenshot`, `ai_generated`,
  `printed_photo`) as `implemented: false` rather than faking a pass — logged
  via `unimplementedDetectors` on every capture. This is correct behavior per
  the blueprint's "no single pass proves authenticity" principle but is a real
  known gap: **MISSING** real screenshot/AI-generated/printed-photo detection.
- **EXISTS** — impossible-travel (haversine + max human speed), duplicate
  window, internet-duplicate-by-hash.
- **CONFLICTING (minor)** — FLAG_THRESHOLD and hard-fail detector set are not
  yet exposed as live-tunable config (blueprint doesn't strictly require this
  for anti-cheat, only for rarity weights, so low priority).

## Species recognition (§15.3)
- **EXISTS** — `vision-providers.js` + `providers.js`, confidence threshold,
  candidate picker (`needsConfirmation` + `chosenCandidateIndex` flow in
  `server.js`).

## Rarity engine (§16)
- **EXISTS** — `api/lib/rarity-engine.js` matches §16.1 weights and §16.2
  grade/XP/coin table exactly. `starsForScore` matches
  `clamp(round(score/20),1,5)`. Low-telemetry cap at B/74 matches spec.
  `weightSetVersion` persisted (`rarity_weight_set_version` column).
- **EXISTS** — live-tunable weights: `rarity_weight_sets` table
  (`db/migrations/012`), versioned, `active` flag — but **PARTIAL**: server.js
  currently calls `scoreDiscovery` with a hardcoded
  `{ version: 1, weights: DEFAULT_WEIGHTS, gradeBands: DEFAULT_GRADE_BANDS }`
  instead of loading the active row from `rarity_weight_sets`. The table exists
  but isn't wired as the actual source of truth yet — **fix in Phase 5**.
- **PARTIAL** — 3 of 9 factors (`regionalRarity`, `weather`) return neutral
  0.5 placeholders (honestly documented in code comments); `discoveryFrequency`
  has a real implementation. This is intentional per the code's own comment
  ("do not fake the missing ones to hit S-grade") — leave as is, it's correct
  blueprint-faithful behavior, not a bug.

## Human verification / moderation (§21)
- **PARTIAL/MISSING** — `admin/submissions/:id/review` and
  `admin/submissions/review-queue` exist but only cover **quest verification
  submissions**, not **captures/Discoveries**. Blueprint §21 requires A/S-grade
  *captures* to enter a ModerationQueue and be approved/rejected by an admin,
  with the card flipping to Human Verified and rewards finalizing on approval,
  or being removed/downgraded with reason on rejection. There is currently
  **no endpoint to approve or reject a provisional `captured_cards` row**, and
  **no crediting of XP/coins on later approval** (they're only credited at
  creation time when status is immediately 'final'). A provisional capture
  today has no path to ever become final. **This is the single biggest gap
  relative to the blueprint's trust spine and is built in Phase 5.**
- **MISSING** — appeals workflow, reviewer audit trail (reviewerId, decidedAt,
  reason) for captures specifically.

## XP / Levels / Explorer Tiers (§17)
- **EXISTS** — `ProgressionEngine.snapshot()` structure (level, xpIntoLevel,
  xpForCurrentLevel, progressToNextLevel) is sound and reusable.
- **CONFLICTING** — `tierForLevel()` returns
  `Bronze → Silver → Gold → Platinum → Mythril → Diamond → Ascendant`.
  Blueprint §17.3 is explicit: **Bronze → Silver → Gold → Platinum → Diamond →
  Adamantium**, six tiers, no Master/Mythril/Ascendant (§31 decision #1 confirms
  this explicitly). Same conflict duplicated in `api/lib/progression-engine.js`
  and inlined again in `postgres-repository.js:levelFromXp/tierForLevel`-style
  helpers. **Fix in Phase 6**, single source of truth.
- **MISSING** — sub-levels I–V within each tier (e.g. "Gold Explorer III").
  Current model has no sub-level concept at all.
- **MISSING** — Season Pass (§17.4): no `seasons` table, no seasonal XP track
  separate from lifetime XP, no free/premium reward tiers.
- **PARTIAL** — duplicate-species XP discount (§17.1, 20% of grade XP):
  not found in capture creation path — new discoveries of an already-owned
  species appear to earn full XP. Verify and fix in Phase 5/6.

## Quest engine (§18)
- **CONFLICTING** — quest model predates the blueprint. Categories are
  `Mind/Body/Discovery/Weekly/Monthly` (a different taxonomy), and objective
  matching uses a generic `verificationType` + `subjectTag`/`targetValue`
  rather than the blueprint's explicit objective-type enum (CAPTURE_COUNT,
  CAPTURE_SPECIFIC, CAPTURE_ATTRIBUTE, EXPLORE_DURATION, DISTANCE_TRAVELLED,
  VISIT_HOTSPOT, RARITY_THRESHOLD, STREAK/SOCIAL). Functionally quests do
  work (assign → track → complete → claim, with an append-only
  `quest_xp_ledger` keyed for idempotent claims — good pattern), but the
  taxonomy is a legacy Mind/Body RPG model, not Wild Realm's nature-discovery
  model. **Phase 7 reworks the objective types and category labels to match
  §18.1, keeping the sound underlying engine (idempotent ledger, state
  machine).**
- **EXISTS** — quest lifecycle states (active/completed/expired/claimed)
  roughly match §18.2's state machine.
- **MISSING** — server re-validation on claim explicitly checking "underlying
  discoveries/events still exist, are final" — needs verification in Phase 7.

## Coins & economy (§19)
- **EXISTS** — `coin_ledger` is a genuine append-only table (migration 015),
  correctly credits capture rewards only when `status = 'final'`, uses
  `ledger_key` uniqueness for idempotency exactly per the blueprint's "ledger,
  not a number" principle. `quest_xp_ledger` and `capture_xp_ledger` follow
  the same pattern. This is one of the strongest parts of the existing build.
- **MISSING** — IAP/coin-pack purchase flow, server-side receipt verification
  (§19, §27). No Store backend exists yet.

## Chests & regional events (§20)
- **MISSING entirely.** No chest tables, no loot tables, no regional event
  counter, no threshold/launch logic. Built from scratch in Phase 10.

## Explore Map / Hotspots (§10)
- **EXISTS** — `world_hotspots` table + `/api/v1/world/hotspots` endpoint,
  seeded with curated locations, category filter chips matching §10's
  All/Hotspots/Parks/Waterfalls/Birding. Good, real data source (recent
  commit 9dd0386 replaced a hardcoded `[]`).
- **MISSING** — fog-of-war overlay, player explored-area polygons.
- **CONFLICTING with navigation** — need to verify Map is reached via
  Community/Explore per blueprint §3, not a root tab (checked in Phase 3).

## Sensitive species / coordinate obfuscation (§1, §10, §22, §27 — CRITICAL)
- **MISSING — server-side enforcement does not exist.** `species_catalog`
  correctly flags `sensitive: true` on several species (Snow Leopard, Tiger,
  Elephant, Scarlet Macaw, African Grey Parrot, Dolphin, Sea Turtle, Wild
  Orchid, Volcanic Vent, Ancient Ruin), but nothing reads that flag to jitter
  coordinates before they reach the client. `community_posts` stores and
  presumably serves raw `gps_lat`/`gps_lng` unconditionally. This is a
  CRITICAL-marked blueprint requirement ("never rely on frontend coordinate
  hiding as the security boundary") and is currently an open exposure for any
  sensitive-species discovery that gets shared. **Fix in Phase 9, before
  Community ships any real location data.**

## Community (§9, §22)
- **EXISTS** — real schema: posts, likes, comments, friendships
  (`db/migrations/016`), idempotent re-share via unique `card_id` index,
  denormalized location on the post. Genuinely matches §22's model well.
- **MISSING** — leaderboard eligibility gate (only verified/final discoveries
  should qualify, §22) — needs checking against the moderation gap above.
- **MISSING** — sensitive coordinate obfuscation (see above — blocks this
  section from being spec-complete).
- **MISSING** — reporting/blocking/muting, rate limiting on posts.

## Notifications (§23)
- Not yet audited in this pass — check during Phase 9/10 alongside chests/events
  which are the primary undelivered trigger sources anyway.

## Data model / API surface (§24–25)
- Overall the Postgres schema is unusually close to the blueprint's collection
  list for the parts that exist: `captured_cards`, `coin_ledger`,
  `capture_xp_ledger`, `quest_xp_ledger`, `rarity_weight_sets`,
  `community_posts/_likes/_comments/_friendships`, `world_hotspots`,
  `quest_definitions/_assignments/_submissions`. Missing collections:
  `ModerationQueue` (captures), `Seasons`, `Events` (regional), `Inventory`,
  `Achievements`, `Reports`, `Notifications` (has quest_feed but not a general
  Notifications table — verify), `Devices` (push tokens).

## Navigation / IA (§3) — frontend, checked in Phase 3
- To verify: is Capture the raised center FAB with exactly 5 destinations, and
  is Map inside Community/Explore rather than a 6th root tab? `App.jsx` routes
  show `/app` children: index(World)/quests/community/rewards/collection/profile
  — that's 6 routes under one shell. Need to confirm which are root nav items
  vs nested, in Phase 3.

---

## Priority order for this session (dependency order, per brief rule 2)

1. **Phase 1–2**: CSS consolidation + Wild Realm visual foundation (blocks all UI work)
2. **Phase 3**: App shell/nav — verify and fix the 5-destination/FAB/Map-in-Explore rule
3. **Phase 4**: Capture experience UI (flagship, already has strong backend to build on)
4. **Phase 5**: Rarity/Discovery UI + wire live rarity_weight_sets + capture ModerationQueue
   endpoints (approve/reject provisional captures) — this is the critical trust-spine gap
5. **Phase 6**: Progression UI + fix tier ladder conflict (Bronze..Adamantium, sub-levels)
6. **Phase 7**: Quests UI + objective-type rework
7. **Phase 8**: Explore/Map UI
8. **Phase 9**: Community UI + sensitive-coordinate server-side obfuscation (CRITICAL, must
   land before/with any Community location UI)
9. **Phase 10**: Seasons/Chests/Events (net-new, lowest dependency risk since nothing relies
   on it yet)
10. **Phase 11–16**: Motion, mobile, accessibility, performance, visual QA, regression
