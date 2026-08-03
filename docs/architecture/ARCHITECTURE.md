# HABBIT Game Server Architecture

## 0. Reframing

The previous pass of this document organized the backend as domain modules
sitting behind REST resources — Quest, Progression, Verification each with
their own controller, service, repository. That's a defensible DDD backend,
but it's still shaped like an API with quests. It doesn't scale the way a
live-service game does: every new system (raids, battle pass, guilds) would
mean editing existing engines to know about it.

This revision inverts the shape. **HABBIT is a game server.** Its primary
abstraction is a set of **Engines** — long-lived systems that own a slice of
game state and react to a shared stream of **Game Events**. REST, WebSocket,
and cron are transports that call *into* the engines; they are not the
architecture. An engine never imports another engine's service to trigger a
side effect. It publishes an event on the `GameEventBus` and moves on. This
is what lets a raid system, added in year three, subscribe to
`QuestCompleted` and `PlayerLeveledUp` without a single line of Quest Engine
or Progression Engine changing.

```
                         ┌─────────────────────────┐
   HTTP / WS / Cron ───▶ │   Transport Layer        │
                         │ (controllers, gateways,  │
                         │  BullMQ processors)       │
                         └────────────┬─────────────┘
                                      │ calls into
                         ┌────────────▼─────────────┐
                         │        Engines            │
                         │  Quest · Verification ·   │
                         │  Progression · Economy ·   │
                         │  Achievement · LiveOps ·   │
                         │  Community · AI Services   │
                         └────────────┬─────────────┘
                                      │ publish/subscribe
                         ┌────────────▼─────────────┐
                         │      Core (Shared Kernel) │
                         │  GameEventBus · Content    │
                         │  Registry · GameClock ·    │
                         │  Currency/EntityId · Outbox│
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   Postgres · Redis · S3   │
                         └───────────────────────────┘
```

## 1. Core (Shared Kernel)

Every engine depends on Core. Core depends on nothing else in the system.
This is the layer that has to be right, because everything else is built on
top of it for the life of the product.

- **GameEventBus** — the only channel through which engines communicate.
  Wraps `EventEmitter2` for the in-process fast path and the `content_events`
  outbox table + BullMQ for the durable/cross-process path (see §4). Engines
  publish typed `GameEvent<T>` envelopes; they never call another engine's
  application service directly.
- **ContentRegistry** — the unified, versioned store for *all* designer-
  authored content: quest definitions, achievement rules, battle pass tiers,
  seasonal event configs, NPC dialogue trees, economy price tables. One
  schema, one admin/versioning/rollout pipeline (see §3). "Add a new season"
  or "run a 48-hour world event" becomes a content push, not a deploy.
- **GameClock** — the single source of truth for "now," injectable and
  fakeable in tests, timezone-aware for per-player period calculations
  (daily/weekly/monthly resets, event windows).
- **Identity primitives** — `PlayerId`, `EntityId` branded types; a
  `CurrencyAmount` value type (integer minor units + currency code) so gold/
  gems/season-tokens/battle-pass-XP are never silently mixed or floated.
- **Outbox** — durable event log (`content_events` / `domain_events`,
  unified under Core) with a relay worker that publishes unprocessed rows to
  BullMQ. This is what makes event delivery survive a process crash instead
  of being best-effort in-memory only.
- **Idempotency** — a shared `IdempotencyKeyGuard` any engine can use for
  "this action must not double-apply" (already essential for XP grants,
  equally needed later for marketplace purchases, battle pass claims, raid
  loot rolls).

Core has no knowledge of quests, XP, or verification. It only knows events,
content, time, currency, and identity — the primitives every future system
(marketplace, raids, guilds) will also need.

## 2. Engines

Each engine is a bounded system: it owns its state, exposes an application
service *transports* call into, and communicates with other engines only via
GameEventBus. Build order matters — later engines depend on earlier ones
existing, never the reverse.

### 2.1 Identity Engine
Supabase-JWT verification → `AuthContext`. Publishes `PlayerRegistered` on
first sight of a user. Owns no gameplay state — `PlayerProfile` (display
name, avatar, timezone) is Progression Engine's, not Identity's, because
profile is presentation over progression state, not auth state.

### 2.2 Quest Engine
Everything from the previous design (QuestGenerator, QuestAssignmentService,
QuestLifecycleService, QuestScheduler) but with two changes:

- **Quest definitions move into the Content Registry.** A `QuestDefinition`
  is a `ContentEntry` of `type: 'quest_definition'`. The generator reads
  through a `QuestContentAdapter` that queries the registry, not a bespoke
  `quest_definitions` table. This is what makes AI-generated quests and
  quest chains additive later: a new content type variant, not a schema
  migration.
- **Never calls Verification or Progression directly.** Submission handling
  publishes `QuestSubmissionReceived`; Verification Engine reacts and
  eventually publishes `SubmissionVerified`, which Quest Engine subscribes to
  in order to advance assignment state. Completion publishes
  `QuestCompleted`; Quest Engine's job ends there.
- Adds **quest chains** and **narrative campaigns** as a first-class concept
  from the start: a `QuestChainState` machine (`chapter index, unlocked
  quest ids`) that reacts to `QuestCompleted` for quests tagged with a
  `chainId` in their content payload. This is additive scaffolding now so
  campaigns aren't a retrofit later.

### 2.3 Verification Engine
Unchanged pipeline shape (strategy per verification type, AI vision provider
abstraction, dedup pre-check, confidence thresholds) but now consumes
`QuestSubmissionReceived` off the bus instead of being called synchronously
by Quest Engine's controller. This is also the natural seam for **dynamic
difficulty**: Verification Engine tracks rolling approval/rejection rates
per content id and publishes `ContentDifficultySignal`, which LiveOps/AI
Services can use to adjust future generation weighting — without Quest
Engine needing to know verification even happened.

### 2.4 Progression Engine
Same XP ledger + data-driven curve as before, now explicitly the owner of
`PlayerProfile` (display name, avatar, tier, rank, title) since profile
presentation is progression state, not identity state. Subscribes to
`QuestCompleted`, `AchievementUnlocked`, `EventObjectiveCompleted` — any
source of XP is additive; Progression Engine doesn't special-case which
system sent it, it just processes `XpGranted` intents uniformly.

### 2.5 Economy Engine
New in this revision, and load-bearing for everything the five-year list
implies (marketplace, premium content, battle pass, guild dues). Owns:

- **Currency ledgers** — same append-only pattern as XP (`currency_ledger_
  entries`), one ledger per currency code (soft currency "gold," premium
  currency "gems," seasonal "event tokens," battle-pass XP as its own
  track). Never a mutable balance column, for the same audit/replay-safety
  reasons as XP.
- **Wallet** — derived balance-per-currency, rebuildable from the ledger.
- **Grant/Spend API** — `grant(currency, amount, source, idempotencyKey)`
  and `spend(...)` with insufficient-funds as a domain error, not an
  exception leaking Prisma details.
- **Marketplace/Store** (content-registry-backed catalog of purchasable
  items — cosmetics, quest re-rolls, streak freezes) is built on top of this
  engine later without Economy itself changing.

### 2.6 Achievement Engine
Rule evaluation against `PlayerStatsSnapshot`, unlock rules as Content
Registry entries (`type: 'achievement_definition'`), same "DB entry, not
code change" principle. Reacts to `QuestCompleted`, `StreakExtended`,
`LevelUp`, `PurchaseCompleted` — any event, uniformly, via a small rule
DSL (`{"type":"streak_days","value":30}`) interpreted generically rather
than one handler per achievement.

### 2.7 LiveOps / Event Engine
This is the engine that makes "seasonal events, limited-time quests, world
events, battle pass" possible without new infrastructure each time:

- **Season** — a Content Registry entry with an active window; while active,
  it can inject additional quest pools, reward multipliers, or a battle-pass
  track into Quest/Progression/Economy purely through content, not code.
- **World Event** — time-boxed, potentially global-participation objective
  (e.g. "community reads 1,000,000 pages this week") tracked via aggregated
  `QuestCompleted`/`XpGranted` events, broadcast to clients over WebSocket.
- **Battle Pass** — a tier ladder (Content Registry entries) driven by its
  own XP track (an Economy currency), independent of player level, so
  seasonal progress resets without touching account-level Progression state.
- Absorbs the "Event Domain" temporal-backbone role from the previous
  design: daily/weekly/monthly reset scheduling, streak-break sweeps, are
  LiveOps concerns (they're time-driven content rollout), not a separate
  domain.

### 2.8 Community Engine
Feed, guilds, leaderboards (Redis-sorted-set-backed, unchanged rationale
from the previous design), likes. Guild quests/raids/co-op quests are
additive here later: a raid is a `QuestDefinition` variant with
`audience: 'guild'` and a multi-player progress-aggregation rule, reusing
Quest Engine's assignment/lifecycle machinery rather than inventing a
parallel system.

### 2.9 Analytics Engine
Read-only consumer of the event stream. Streaks, approval-rate-driven
difficulty balancing, behavior funnels — everything from the previous
design, unchanged in spirit, now trivially extended to any new engine's
events without that engine doing anything.

### 2.10 AI Services
Not "Verification's AI vision provider" scoped narrowly anymore — a shared
engine other systems call into: AI Vision (Verification), and, later,
**AI-generated quests** (LiveOps asks AI Services for a candidate quest
draft, which — after moderation — becomes a Content Registry entry the
Quest Engine can select like any other), **NPC interaction/dialogue**
generation. One provider-abstraction layer, many callers.

## 3. Content Registry (detail)

```
ContentDefinition
  id            UUID
  type          TEXT        -- 'quest_definition' | 'achievement_definition'
                             -- | 'battle_pass_tier' | 'season' | 'npc_script'
                             -- | 'store_item' | ... (open-ended, not an enum)
  schemaVersion INT
  key           TEXT        -- stable human-readable id, e.g. "orange-cat-photo"
  payload       JSONB       -- shape defined by (type, schemaVersion)
  activeFrom    TIMESTAMPTZ NULL
  activeUntil   TIMESTAMPTZ NULL
  status        TEXT        -- draft | active | archived
  createdBy     TEXT
  createdAt     TIMESTAMPTZ
  updatedAt     TIMESTAMPTZ
```

Each engine defines a **typed adapter** over the registry
(`QuestContentAdapter`, `AchievementContentAdapter`, ...) that validates
`payload` against a Zod schema for its `(type, schemaVersion)` and returns a
strongly-typed domain object. The registry itself stays generic — it does
not know what a quest is. This is the mechanism that turns "ship a new
season" into a content write instead of a migration, while keeping every
engine's *code* fully typed against its own content shape.

Versioning: `schemaVersion` lets an engine evolve its content shape (e.g.
quest definitions gaining a `chainId` field) with old rows still valid under
their original schema, migrated lazily or via a backfill script — never a
hard cutover.

## 4. Event Contracts

```
IdentityEngine        → PlayerRegistered
QuestEngine            → QuestAssigned, QuestSubmissionReceived (outbound to Verification),
                          QuestCompleted, QuestExpired, QuestAbandoned, QuestChainAdvanced
VerificationEngine     → SubmissionVerified, ContentDifficultySignal, ModerationFlagged
ProgressionEngine      → XpGranted, LevelUp, TierPromoted
EconomyEngine          → CurrencyGranted, CurrencySpent, PurchaseCompleted, InsufficientFunds (rejected, not published)
AchievementEngine      → AchievementUnlocked
LiveOpsEngine          → SeasonStarted, SeasonEnded, WorldEventProgressed, WorldEventCompleted, BattlePassTierClaimed
CommunityEngine        → FeedPostCreated, GuildQuestProgressed, LeaderboardRankChanged
```

Cross-engine reactions are all subscriptions to this table, never direct
calls. Example chain for a photo quest completion:

```
Quest Engine:        submit() -> publish QuestSubmissionReceived
Verification Engine: strategy runs -> publish SubmissionVerified{decision: approved}
Quest Engine:        subscribes to SubmissionVerified for its own submissions
                      -> advances assignment -> on target reached, publish QuestCompleted
Progression Engine:   subscribes to QuestCompleted -> publish XpGranted -> grants ledger entry
                      -> if level crossed, publish LevelUp
Achievement Engine:   subscribes to QuestCompleted, LevelUp -> evaluates rules -> publish AchievementUnlocked
Economy Engine:       subscribes to QuestCompleted (if definition has a coinReward) -> grants currency
Community Engine:     subscribes to QuestCompleted (if feedOptIn) -> creates FeedPost
LiveOps Engine:       subscribes to QuestCompleted -> increments any active WorldEvent's counter
Analytics Engine:     subscribes to everything -> records stats, never mutates
```

No engine in this chain imports another engine's service. Adding Raids in
year three means: a new engine that subscribes to `QuestCompleted` and
`LevelUp` — zero edits above this line.

## 5. Data Model (high-level, supersedes the per-domain-table version)

```
-- Core
ContentDefinition       -- unified registry, see §3
GameEventLog (outbox)   -- id, type, payload, createdAt, publishedAt

-- Identity / Progression
User                    -- auth identity mirror
PlayerProfile           -- display name, avatar, tier/rank presentation, timezone
XpLedgerEntry           -- append-only
ProgressionCurveStep    -- level -> xpCost, tier (could migrate into ContentDefinition later)
StreakState

-- Quest
QuestAssignment         -- references ContentDefinition.id, not a local FK to a quests table
QuestSubmission
QuestChainState         -- userId, chainContentId, currentChapter, unlockedQuestIds[]

-- Verification
VerificationJob
ModerationFlag

-- Economy
CurrencyLedgerEntry     -- append-only, currencyCode discriminates gold/gems/tokens/battlepass-xp
PurchaseRecord

-- Achievement
AchievementUnlock       -- references ContentDefinition.id

-- LiveOps
SeasonState             -- which season is active, cached from ContentDefinition for fast reads
WorldEventProgress      -- eventContentId, currentValue, participants
BattlePassProgress      -- userId, seasonId, tokensEarned, claimedTiers[]

-- Community
FeedPost
GuildMember / Guild
LeaderboardSnapshot (Redis, not Postgres, on the hot path)

Notification
```

`QuestDefinition`, `AchievementDefinition`, `BattlePassTier`, `Season`,
`StoreItem` are **not separate tables** — they're `ContentDefinition` rows
differentiated by `type`. This is the single biggest structural change from
the previous revision, and it's the one that makes "add a raid," "run a
world event," or "launch a battle pass" a content operation instead of a
schema migration + new CRUD module.

## 6. Why this holds up over five years

- **New engine, not new coupling.** Guilds/Raids/Marketplace/Battle Pass are
  new subscribers to existing events, or new engines with their own event
  stream. No existing engine is edited to accommodate them.
- **New content type, not new table.** Seasonal quests, AI-generated quests,
  NPC scripts, store items all live in one versioned registry with one
  admin/rollout story.
- **Currency and XP are already ledgers.** Adding gems, season tokens, or
  battle-pass XP is a new `currencyCode`, not new infrastructure.
- **Quest chains and narrative campaigns are load-bearing from day one** —
  `QuestChainState` exists in the initial Quest Engine build, not bolted on
  when campaigns are requested.
- **Dynamic difficulty has a home** — Verification Engine's approval-rate
  signal feeds Analytics/AI Services without Quest Engine changing.
- **LiveOps operates on content, not deploys** — a 48-hour world event is a
  `ContentDefinition` with an active window, not an engineering ticket.

## 7. Migration from the previous (domain-module) pass

The Quest/Progression/Verification code already written is architecturally
close — the pure `QuestGenerator` and `ProgressionEngine` logic carries over
unchanged (it was already side-effect-free). What changes:
- `QuestCatalogRepository` becomes `QuestContentAdapter` reading through
  `ContentRegistry` instead of a `quest_definitions` table.
- `QuestSubmissionService`'s direct call into `VerificationPipelineService`
  is replaced with publish/subscribe on `QuestSubmissionReceived` /
  `SubmissionVerified`.
- `OutboxService` becomes Core's shared primitive rather than a
  quest-adjacent helper.
- Controllers stay thin API entry points — they call an engine's
  application service exactly as before; what changed is what the engines
  do *between themselves*, not the public HTTP contract, so the frontend is
  unaffected either way.
