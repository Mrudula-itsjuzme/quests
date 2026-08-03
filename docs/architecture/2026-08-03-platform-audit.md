# HABBIT Backend — Platform Architecture Audit

Scope: `quests/server/src` (NestJS backend), read as a 10-year live-service game platform, not as a habit-tracker CRUD app. TypeScript/NestJS idiom is out of scope; this is about engine boundaries, ownership, data, and evolution.

**Top-line verdict:** this is not a green-field mess. The team has already made several of the hard calls correctly — generic `ContentDefinition` registry instead of per-feature tables, append-only ledgers instead of mutable counters, a named `GameEventBus` with a typed contract file, an outbox table. That is further along than most Series-A backends get. The gaps that exist are specific and fixable now, before data and traffic make them expensive: the outbox is unfinished, one engine takes a live synchronous dependency on another, Identity is a stub, and there is no Rule Engine, Content Platform, or Workflow layer yet — all of which the roadmap in this doc (quest chains, seasons, guilds, marketplace) will need within 12-18 months, not 10 years.

---

## 1. Complete architectural critique

**What's right:**
- `ContentDefinition` (generic `type`/`key`/`payload`/`schemaVersion`) means "ship a new quest" or "ship a new season" is a data write, not a migration. This is the single most important decision in the codebase and it's already correct.
- Ledgers (`XpLedgerEntry`, `CurrencyLedgerEntry`) are append-only with `idempotencyKey`. Balances are projections, not mutable state. This is what a real economy needs — it survives replay, dedup, and audit requirements that a `balance` column can't.
- `GameEventBus` with `record()` (durable) + `emit()` (in-process) as two explicit primitives, and a single `game-events.ts` file as the cross-engine contract, is the right shape for "engines never import each other's application services."
- Engine folder layout (`application` / `domain` / `infrastructure` / `interfaces`) is consistently applied and the DDD boundary is real, not cosmetic — verified by grep, only two cross-engine imports exist outside of Identity primitives.

**What's wrong:**
- The outbox is decorative. `GameEventLog.publishedAt` exists in the schema and is never set anywhere in the codebase. Nothing drains `gameEventLog` rows to BullMQ or anywhere else. Today `record()` writes an audit trail no process ever reads, and `emit()` (in-process EventEmitter2, no persistence, no retry, no cross-process fan-out) is silently carrying 100% of real behavior. If the API process crashes between a DB commit and the `emit()` call, every downstream reaction to that event — XP grant, achievement unlock, notification — is lost, permanently, with no replay path. This is fine at current scale and actively dangerous at the scale this doc is asked to plan for.
- Verification Engine has a live, synchronous, in-process dependency on AI Services (`PhotoVerificationStrategy` constructor-injects `AiVisionService` directly). That means AI Services cannot be rate-limited, queued, scaled independently, or swapped for an async provider without changing Verification's code. It also means an AI provider outage is a Verification outage, is a Quest completion outage.
- Identity Engine is not an engine. It's an auth guard, a decorator, and a token verifier — five files, no application layer, no domain layer, no owned write path. Every other engine correctly treats "player identity" as data it doesn't own, but nothing currently *does* own the player-identity lifecycle (registration side effects, account linking, ban/suspension, GDPR delete, multi-device session state). Today that's implicitly Supabase Auth plus a `users` row created by... something unexamined here. This will not scale to guilds, moderation, or fraud detection without a real Identity engine.
- No Rules/Policy Engine. Quest completion conditions, achievement unlock conditions, battle pass tier thresholds, and (later) adaptive-difficulty and AI-generated-quest conditions are each going to get hand-rolled, per-engine, in application-service `if` statements, because there is currently nowhere else for them to live. This is the single biggest one-way door in the codebase: every day this doesn't exist, more conditional logic gets welded into engines that will be painful to extract later.
- No Content Platform beyond the registry primitive. `ContentRegistryService` has no draft/publish workflow, no rollback, no dependency graph between content rows (a quest chain referencing quest IDs is just a string array with no validation), no regional/experiment overrides layer, and no migration tooling for `schemaVersion` bumps (the version field exists, nothing reads it to run a migration). It's a good foundation with the top three floors missing.

---

## 2. Weakness report

| Weakness | Severity | Why it matters at scale |
|---|---|---|
| Outbox never drained/published | **Critical** | Silent event loss on crash; no cross-process fan-out; no replay; blocks Kafka/NATS migration since nothing currently reads the log |
| Verification → AI Services is a live sync call, not an event/queue boundary | **High** | Couples Quest completion latency/availability to third-party AI vendor latency/availability; blocks independent scaling and rate-limiting of AI spend |
| Identity has no application/domain layer | **High** | No true owner of ban/suspend/delete/session lifecycle; every future system (moderation, fraud, guilds) needs this and will bolt it onto the wrong engine if it doesn't exist |
| No Rules Engine | **High** | Condition logic (quest/achievement/battlepass/dynamic-event) will be duplicated 4-6 times across engines within a year, each slightly differently |
| No Content draft/publish/rollback workflow | **Medium** | LiveOps cannot safely stage a season and flip it live without directly mutating `status` on production rows; no undo |
| `QuestChainState.unlockedQuestIds` is an untyped string array | **Medium** | No validated dependency graph; a bad content edit can softlock a chain silently |
| Analytics engine has no domain/infrastructure split (`application`-only) | **Low-Medium** | Fine today (read-only projector); will strain once Analytics needs its own event ingestion pipeline, not just Prisma aggregation |
| `Notification` model is owned by nobody (comment says "LiveOps-adjacent") | **Medium** | Ownerless data is a magnet for every engine writing to it directly; needs a real Notification/Comms engine |
| No feature-flag / experiment primitive anywhere in schema or core | **Medium** | A/B testing, remote balancing, and gradual rollouts (explicitly in your roadmap) have no substrate to attach to |

---

## 3. Risk report

- **Data loss risk (Critical):** unrelayed outbox = event loss on any crash between commit and emit. This is a correctness bug hiding as a scalability concern — fix before real users, not after.
- **Vendor coupling risk (High):** AI Services (OpenAI/Gemini vision) is on the hot path of Quest completion via a direct constructor injection. A pricing change, rate limit, or outage at the vendor is an outage in your core gameplay loop.
- **Compliance risk (Medium-High):** no Identity engine means no clear system boundary for "delete this user's data" (GDPR/CCPA). Right now that would mean auditing 10 engines' Prisma models by hand. This gets worse, not better, with every new engine.
- **Content-safety risk (Medium):** achievements/quests reference `ContentDefinition.id` with no dependency-graph validation. A LiveOps admin editing/archiving content live can silently break active quest chains or battle pass tiers for players mid-season.
- **Circular-dependency risk in 2 years (flagged now):** Achievement Engine will eventually want to react to *almost every* event in the system (quest completion, streaks, purchases, social actions, world events) to evaluate unlock conditions. If Achievement's reactions stay hand-coded per event type rather than routed through a generic Rules Engine, you'll end up with Achievement importing bits of every other engine's payload shapes directly, and other engines reaching back into Achievement to ask "is this unlocked" synchronously. Build the Rules Engine before Achievement's event-handler count exceeds ~5.
- **Ownerless-data risk:** `Notification` and (once built) cross-cutting systems like leaderboards/feature flags need a declared owner now, or three engines will each grow their own half-implementation.

---

## 4. Missing systems

- **Outbox relay/publisher** — a worker that drains `GameEventLog` where `publishedAt IS NULL`, republishes via BullMQ (or later Redis Streams/Kafka), sets `publishedAt`. This alone converts the existing outbox table from a liability into the durable spine of the whole platform.
- **Rules/Policy Engine** — generic condition evaluator (see §Rule Engine below).
- **Content Platform** — draft/publish/rollback/versioning/regional-override layer over `ContentRegistryService` (see §Content System below).
- **Feature Flag / Experiment service** — first-class, not bolted onto ContentDefinition.
- **Notification/Comms Engine** — real owner of `Notification`, push delivery, dedup, digesting.
- **Fraud/Anti-abuse Engine** — currently `ModerationFlag` exists as a table under Verification, but abuse detection (velocity anomalies, multi-account, image reuse across users) is a cross-cutting concern that will outgrow Verification's domain.
- **Social graph substrate** — nothing today models "guild," "party," or "friend" as a relationship; Community Engine currently only has feed posts and leaderboards.

## 5. Missing engines

- **Identity Engine** (real one — see §Identity below)
- **Social/Guild Engine** — split out of Community once guilds/parties/raids land; Community should stay "feed + leaderboard + social reactions," Guild/Party is a different aggregate with membership, roles, and its own progress state.
- **Inventory/Items Engine** — cosmetics, collectibles, equipment will not fit into Economy's ledger model (ledgers are for fungible currency, not unique/stacked items with metadata).
- **Notification/Comms Engine**
- **Moderation/Trust & Safety Engine** — distinct from Verification (Verification decides "is this submission real," Moderation decides "is this account behaving abusively over time").

## 6. Missing platform capabilities

- Durable, replayable event transport (outbox relay, or Redis Streams/Kafka — see §Event System)
- Generic rule/condition evaluation (see §Rule Engine)
- Content versioning, drafts, rollback, dependency graphs, regional/experiment overrides (see §Content System)
- Feature flags & experiments as a first-class primitive
- A declared "who owns account deletion" contract
- Idempotent, replayable admin/LiveOps tooling (content publish is currently a raw upsert — no audit trail beyond `createdBy`)

---

## 7. Better engine boundaries (per-engine breakdown)

### Core
- **Owns:** ContentDefinition storage+query primitive, GameEventBus primitive, Prisma connection, Redis connection, job queue wiring, game clock, progression *curve* (pure XP-cost-per-level table), identity primitives (branded IDs, currency amount value objects), idempotency guard.
- **Should never own:** business rules about *when* XP is granted, *what* content types mean, or any engine-specific decision logic. Today it doesn't — this is clean.
- **Leaking in:** nothing owned by Core is leaking into engines. The risk is the reverse — engines under-using Core's idempotency guard (verify this is actually applied at every ledger-write call site, not just present in `/core`).
- **Missing abstraction:** an Outbox Relay/Publisher belongs in Core (it's infrastructure, not a domain concern).
- **Verdict on splitting Core:** yes, conceptually, even if not yet as separate packages. Treat it as three logical layers already: **Kernel** (event bus, content registry, IDs, clock — stable, almost never changes), **Infrastructure** (Prisma, Redis, job queue — replaceable), **Framework** (idempotency guard, domain-error base classes — shared code, not shared state). Don't build a "Simulation Layer" or "Runtime" yet — you don't have anything real-time/tick-based; that's premature for a quest app, even a very ambitious one.

### Identity
- **Owns today:** nothing. It's an auth adapter (guard + decorator + token verifier over Supabase).
- **Should own:** the player identity lifecycle — account creation side effects, linking, ban/suspend state, session/device state, data-export and data-deletion orchestration (calling into every other engine's deletion hook).
- **Should never own:** player *profile* content (display name, avatar — that's rightly Progression's `PlayerProfile` today, arguably should move to a dedicated Profile aggregate as it grows), gameplay state.
- **Missing:** an `application` and `domain` layer. `PlayerRegistered` event exists in the contract but nothing in the codebase publishes it (verify — this may mean registration side effects like default `StreakState`/`PlayerProfile` rows are created by direct writes somewhere instead of by reacting to this event, which is itself a hidden coupling).
- **API is wrong today insofar as** it doesn't exist as a real API — `AuthContext`/`AuthGuard` is infrastructure, not an Identity Engine.

### Quest
- **Owns:** `QuestAssignment`, `QuestSubmission`, `QuestChainState`, assignment lifecycle state machine.
- **Should never own:** verification decision logic (correctly doesn't), XP/currency amounts as *authoritative* state (correctly emits `QuestCompleted` with reward amounts and lets Progression/Economy be the ledger of record — but see below).
- **Leaking in:** `QuestCompletedPayload` carries `xpReward`/`coinReward` — meaning Quest Engine is computing/asserting the reward amount, which is arguably a Rules/Economy decision (rarity/category → reward). Worth deciding explicitly: does Quest read reward amounts from its own content payload (fine, it owns "what this quest pays out" as authored content) or does something else compute it dynamically (adaptive rewards, roadmap item)? If adaptive rewards is coming, reward *computation* should move to a Rules Engine and Quest should stop hard-coding it into the completion event.
- **Missing:** chain dependency validation (see risk report).

### Verification
- **Owns:** submission decision (approve/reject/manual-review), verification strategy selection, dedup.
- **Should never own:** the AI provider call itself as a synchronous in-process dependency (see critique above) — should own the *decision policy*, consume classification results via an async boundary.
- **Fix:** Verification should publish a `VerificationRequested` event (or enqueue a BullMQ job) and consume the classification result asynchronously, the same way Quest→Verification already works via events. Right now Quest correctly doesn't call Verification directly, but Verification directly calls AI Services — same anti-pattern, one hop over.

### Progression
- **Owns:** XP ledger, level/tier computation, streaks, player profile (currently — reconsider as Identity matures).
- **Should never own:** anything about *why* XP was granted (that's the source engine's job to say via the event) — correctly doesn't.
- **Consumes:** `QuestCompleted`, `AchievementUnlocked`, admin-grant events.
- **Publishes:** `XpGranted`, `LevelUp`, `TierPromoted`, `StreakExtended/Broken` — all correct, all things other engines (LiveOps battle pass, Achievement) will want to react to.

### Economy
- **Owns:** currency ledger, purchases.
- **Missing for roadmap:** Inventory doesn't belong here. When cosmetics/items/marketplace/trading land, do not model them as currency ledger rows — they need their own aggregate (ownership, uniqueness, stacking, trade-lock state). Economy should stay "fungible balances and spend/grant audit trail," full stop.

### Achievement
- **Owns:** unlock records.
- **Should own condition evaluation itself only until a Rules Engine exists** — today it presumably hand-listens to N events and checks thresholds per achievement. This is the engine most at risk of the "reaches into everything" circular-dependency pattern flagged in the risk report. Prioritize the Rules Engine before Achievement's event-listener surface grows further.

### LiveOps
- **Owns:** season/world-event runtime state, battle pass progress.
- **Correctly treats seasons as ContentDefinition rows**, not bespoke tables — good.
- **Missing:** the content publish/rollback workflow it needs to actually run live-service operations safely (flipping a season live today is presumably a raw content status update with no staging).

### Community
- **Owns:** feed posts, leaderboard reads.
- **Will need to split** once guilds/parties exist — don't grow guild membership/roles inside Community's current shape.
- **`GuildQuestProgressed` event already exists in the contract** with no guild data model anywhere yet — this is a good sign the team is already thinking ahead; make sure the eventual Guild engine is genuinely new, not squeezed into Community's existing tables.

### Analytics
- **Owns:** `ContentDifficultyStats`, read-only projections off the event stream.
- **Correct pattern** (consume events, own derived read models, never get consumed *by* other engines except via published signal events like `ContentDifficultySignal`). Keep this discipline as Analytics grows — resist the temptation to let other engines query Analytics' tables directly instead of via published events.

### AI Services
- **Owns:** provider abstraction (OpenAI/Gemini/stub), vision classification.
- **Should never own:** verification policy/thresholds (correctly doesn't — thresholds live in Verification's config).
- **Fix needed:** stop being a direct in-process dependency of Verification; front it with a queue so it can be scaled, rate-limited, and have its vendor swapped independently. This is also where future AI-generated-quests and adaptive-dialogue capability should live — as its own provider-abstracted, queued, engine, not new direct dependencies from Quest/LiveOps into `AiVisionService`.

---

## 8. Hidden coupling found

- **Application service coupling:** Verification → AI Services (`AiVisionService` direct injection). One instance found; fix before it becomes a template other engines copy.
- **Event contract coupling (acceptable, name it anyway):** every engine that imports `AuthContext`/`AuthGuard`/`CurrentUser` from Identity is coupling to Identity's shape. This is fine *if* Identity becomes a real shared-kernel-style engine with a stable, minimal public surface — but today that surface is "whatever Supabase's token shape happens to be," which is an indirect coupling to a third-party auth vendor across every engine's `interfaces` layer.
- **Data coupling via `ContentDefinition.payload`:** every engine's `ContentAdapter` parses opaque JSON with its own Zod schema — good encapsulation — but nothing currently validates *cross-content* references (a quest chain's `unlockedQuestIds`, a quest's reference to an achievement, a battle pass tier's reward references). This is coupling without a contract: two content rows can silently disagree with no schema-level or runtime-level guard.
- **Temporal/ordering coupling in the outbox:** because `record()` and `emit()` are separate calls (transaction-scoped write, then post-commit in-process emit), any handler relying on `emit()` firing is implicitly assuming the process that committed the write is the same process that will fan it out, right now, synchronously. That assumption breaks the moment you need multi-instance horizontal scaling of the API — two API pods, one commits, the other one won't know to relay it. This is today's single biggest "will become a migration blocker in two years" item: fix it before horizontal scaling, not during.
- **Future circular dependency (flagged proactively):** Achievement Engine reacting to progression, economy, community, and quest events all directly, growing its own per-event handler count instead of going through a shared Rules Engine, is the most likely source of a real circular dependency in ~18-24 months (Achievement needs to know about a "guild quest progress" concept that Community owns, which needs to know an achievement unlocked, which affects a leaderboard Community also owns).

---

## 9. Rule Engine

**Yes — one generic Rules Engine, in Core (or a new `platform/rules` module), not per-engine reimplementations.**

Why: quest completion, achievement unlock, battle pass tier thresholds, and (roadmap) adaptive rewards, AI-generated quest conditions, and dynamic-event triggers are all the same shape of problem — "given a set of facts (player state + event payload), does a condition evaluate true, and if so what's the resulting action." Building this five separate times means five separate bug surfaces and five places balance designers need to learn to edit conditions.

Design:
- **Facts, not code.** A condition is data (JSON/Zod-validated, itself stored as `ContentDefinition` rows of type `rule_condition` or embedded in the owning content's payload), not a TypeScript `if`. E.g. `{ op: 'gte', fact: 'streak.currentStreak', value: 7 }`, composable with `and`/`or`/`not`.
- **A single `RuleEvaluator` service** in Core/platform: `evaluate(condition: RuleCondition, facts: FactBag): boolean`. Stateless, pure, no engine-specific knowledge.
- **Each engine supplies facts, not logic.** Achievement, Quest, LiveOps each register a `FactProvider` (e.g. Progression provides `streak.*`/`xp.*`/`level.*` facts by reading its own ledger) — the Rule Engine never queries another engine's database directly, it asks for facts by name and the owning engine resolves them.
- **Triggering stays event-driven.** The Rule Engine doesn't poll; each engine that owns a rule-bearing content type (Achievement unlock rules, Battle Pass tier rules) subscribes to the relevant `GameEventType`s, builds a fact bag from the event payload + its own state, and calls `evaluate()`. This keeps event ownership exactly where it is today — the Rule Engine is a shared *evaluator*, not a shared *subscriber*.
- **Do not** put AI-generated-quest condition logic or adaptive-difficulty logic inside this engine — those are content *generation* concerns (AI Services' job to produce a valid rule-condition payload), not condition *evaluation*. Keep generation and evaluation as separate concerns even though they'll be developed close together.

---

## 10. Event System

**Critique:** EventEmitter2 alone, as the *only* transport, is already outgrown — not because EventEmitter2 is bad, but because it's in-process-only and the outbox that was clearly designed to compensate for that (`GameEventLog`) is unfinished. This is the most urgent fix in the whole audit, and it's cheap: you don't need Kafka, you need to finish what's already half-built.

**Recommended evolution, in order — don't skip to Kafka:**

1. **Now:** Build the outbox relay. A BullMQ repeatable job polls `GameEventLog WHERE publishedAt IS NULL`, re-emits via `EventEmitter2` (or directly invokes handlers), sets `publishedAt`. This alone gives you crash-safety and lets you add a second API instance without losing events. Low effort, highest risk reduction in this entire report.
2. **Next (when you have >1 API instance or need cross-service fan-out):** Move the relay target from in-process `EventEmitter2` to **Redis Streams**. You already run Redis (BullMQ needs it); Streams gives you consumer groups, replay-from-offset, and multi-consumer fan-out without adding new infrastructure. This is the right next step, not Kafka — Kafka is justified by partition-scale throughput and multi-team ownership you don't have yet as a single backend team.
3. **Later (when Achievement/Rules/Analytics all need to replay history, or when you have genuinely independent services, not just modules in one deployable):** Kafka or NATS become justified. Don't reach for them pre-emptively; the migration path from Redis Streams (consumer-group based) to Kafka is a transport swap under the same `GameEventBus.record/emit` interface if that interface stays transport-agnostic from day one — which is exactly why finishing the outbox now, behind the existing `GameEventBus` API, is what buys you this optionality cheaply.
4. **Sagas/Temporal.io:** hold off. You don't have long-running multi-step distributed transactions yet (a quest completion → XP grant → achievement check → notification is a fan-out of independent reactions, not a saga needing compensation logic). Revisit if/when Marketplace/Trading introduces genuine multi-party transactions that need rollback semantics.
5. **CQRS/Event Sourcing:** don't adopt wholesale. You already have the *good* parts (append-only ledgers as source of truth, projections like `ContentDifficultyStats`) without the operational cost of full event sourcing. Keep doing exactly this — ledger-as-source-of-truth, targeted read models — rather than event-sourcing every aggregate.

**Durability classification:**
- **Durable (must survive crash, must be replayable):** `QuestCompleted`, `XpGranted`, `CurrencyGranted/Spent`, `PurchaseCompleted`, `AchievementUnlocked`, `SubmissionVerified` — anything that changes ledger or unlock state. These already go through `record()`; the gap is purely the missing relay.
- **Ephemeral (fine to lose, UI-facing only):** `LeaderboardRankChanged` (recomputable), `WorldEventProgressed` ticks (recomputable from `WorldEventProgress` table), anything purely for live UI updates.
- **Audit log (never delete, rarely queried):** `ModerationFlagged`, admin content publish/rollback actions (once that workflow exists), `PurchaseCompleted` (dual role — ledger *and* audit).
- **Replayable (need consumer-group semantics eventually):** `ContentDifficultySignal` (Analytics → LiveOps/AI Services feedback loop) — this is exactly the kind of cross-engine signal that benefits from Redis Streams' replay-from-offset once more than one consumer needs independent read positions.

---

## 11. Content System

The current `ContentRegistryService` is a correct primitive, not a full content platform. What's missing, mapped to what a live-service game actually needs:

- **Versioning:** `schemaVersion` field exists but nothing reads it. Add a migration registry per `ContentAdapter`: `migrations: { [fromVersion]: (payload) => payload }`, applied in `toDomain()` before Zod validation, so old rows never need a backfill migration when a schema evolves.
- **Drafts/Publishing:** `status` field already supports `draft | active | archived` — but there's no workflow enforcing draft→review→publish, no "publish at" scheduling beyond `activeFrom`, and no permission check on who can flip status. Add a `ContentPublishService` in Core that wraps `upsert` with: draft creation → validation pass (schema + dependency graph, see below) → publish (sets status + records a `ContentPublished` audit event) → optional scheduled publish via the existing job queue.
- **Rollback:** content rows are mutated in place (`upsert` overwrites `payload`). Add append-only versioning: either a `ContentDefinitionVersion` table (row per edit) or reuse the outbox's audit trail once it's a real event log, so "revert to previous version" is a real operation, not a manual re-upsert.
- **Experiments / regional overrides / season overrides:** model as an **override layer**, not new content types. A `ContentOverride` table: `(baseContentId, scope: 'region:US' | 'experiment:variant-b' | 'season:winter-2027', payloadPatch)`. Resolution: base payload + applicable overrides, highest-specificity-wins, resolved once per request and cached. This lets LiveOps stage a "winter reskin" of an existing quest without forking the content row.
- **Dependency graphs:** quest chains, battle pass tiers referencing quests, achievements referencing quests — all currently untyped string/UUID references inside JSON payloads. Add a `ContentDependency` table (`fromId, toId, kind`) populated at publish-time by walking each adapter's known reference fields, so publish-time validation can reject "this chain references an archived quest" instead of failing silently at runtime for a player.
- **Hot reload / remote updates:** you already get this for free from the registry pattern (no redeploy needed to change content) — just make sure adapters cache with a short TTL or subscribe to a `ContentPublished` event to invalidate, rather than re-querying Postgres per request.
- **Inheritance:** lower priority — only pursue if/when NPC dialogue or cosmetics need "base item + variant" patterns; the override-layer mechanism above likely covers 90% of the real need without a separate inheritance concept.

---

## 12. Ownership diagram (textual)

```
Core (Kernel/Infra/Framework)
 ├─ ContentDefinition store ── owned data
 ├─ GameEventLog (outbox) ──── owned data, NEEDS a relay worker
 ├─ GameEventBus (record/emit) ── owned capability
 └─ ProgressionCurveStep ────── owned data (pure curve, not player state)

Identity (needs real engine)
 └─ User (id/email/timezone/locale) ── owned data
     queried-by: everyone (foreign key only, never write)

Progression
 ├─ PlayerProfile, XpLedgerEntry, StreakState ── owned
 └─ publishes: XpGranted, LevelUp, TierPromoted, StreakExtended/Broken

Quest
 ├─ QuestAssignment, QuestSubmission, QuestChainState ── owned
 ├─ reads: ContentDefinition(quest_definition, quest_chain) via QuestContentAdapter
 └─ publishes: QuestAssigned/SubmissionReceived/Completed/Expired/Abandoned/ChainAdvanced

Verification
 ├─ VerificationJob, ModerationFlag ── owned
 ├─ SHOULD consume AI Services async (currently sync — fix)
 └─ publishes: SubmissionVerified, ContentDifficultySignal, ModerationFlagged

Economy
 ├─ CurrencyLedgerEntry, PurchaseRecord ── owned
 └─ publishes: CurrencyGranted/Spent, PurchaseCompleted

Achievement
 ├─ AchievementUnlock ── owned
 ├─ reads: ContentDefinition(achievement_definition)
 ├─ consumes: nearly every event (candidate for Rules Engine before this list grows further)
 └─ publishes: AchievementUnlocked

LiveOps
 ├─ SeasonState, WorldEventProgress, BattlePassProgress ── owned
 ├─ reads: ContentDefinition(season, world_event, battle_pass_tier)
 └─ publishes: SeasonStarted/Ended, WorldEventProgressed/Completed, BattlePassTierClaimed

Community
 ├─ FeedPost ── owned; Leaderboard is a read projection, not owned state
 └─ publishes: FeedPostCreated, GuildQuestProgressed (no guild data model yet), LeaderboardRankChanged

Analytics
 ├─ ContentDifficultyStats ── owned (derived, read-only to everyone else)
 └─ consumes: SubmissionVerified (and should consume broadly as this grows)

AI Services
 ├─ owns: provider abstraction only, no player-facing data
 └─ SHOULD be queue-fronted, not directly injected into Verification

Notification (ownerless today — assign to future Comms Engine)
 └─ Notification table currently has no clear engine boundary
```

---

## 13. Suggested folder hierarchy

Largely keep what exists — it's already right — with these additions:

```
src/
  core/                        # Kernel + Infra + Framework (as-is, plus:)
    outbox/                    # NEW: relay worker draining GameEventLog
    rules/                     # NEW: generic RuleEvaluator + FactProvider contract
    content-platform/          # NEW: ContentPublishService, ContentOverride resolution,
                                #      ContentDependency graph validation
                                #      (content-registry/ stays the low-level primitive underneath)
  engines/
    identity/                  # PROMOTE to real engine: add application/ domain/ infrastructure/
      application/
      domain/
    quest/                     # as-is
    verification/
      infrastructure/
        ai-vision-client.ts    # NEW: queue-based client, replaces direct AiVisionService injection
    progression/                # as-is
    economy/                    # as-is
    achievement/                 # as-is, migrate condition logic to core/rules over time
    liveops/                    # as-is
    community/                  # as-is short-term; split guild/ out when guilds land
    analytics/                  # as-is
    ai-services/                # as-is, but exposed via queue consumer, not direct injection
    notifications/              # NEW engine: owns Notification table + delivery
    inventory/                  # NEW engine, build when cosmetics/items land — do not retrofit into economy/
```

---

## 14. Future evolution roadmap

**Near-term (do before the next major feature, not after):**
1. Outbox relay worker (Core) — unblocks safe horizontal scaling and is a correctness fix, not a nice-to-have.
2. Front AI Services with a queue; remove the direct `AiVisionService` injection from Verification.
3. Stand up a real Identity engine (`application`/`domain` layers) — needed before any moderation/ban/fraud work, and before GDPR delete is a real feature, not a TODO.
4. Rules Engine v1 — start with just Achievement's condition logic migrating onto it, prove the shape, then move Quest completion/reward logic and Battle Pass tier thresholds onto it too.

**Mid-term (aligns with quest chains, seasons, guilds roadmap items):**
5. Content Platform: publish workflow + dependency graph validation, before quest chains ship broadly (a broken chain reference is a player-facing bug, not an internal one).
6. `ContentOverride` layer for regional/experiment/season overrides, before feature-flag/A-B-testing work starts.
7. Split Guild/Party out of Community into its own engine once guilds are scoped.

**Longer-term (only once the above exist and are load-bearing):**
8. Redis Streams as the outbox relay's transport target, once you're running more than one API instance or need independent consumer groups (Analytics replaying history independently of Achievement, for example).
9. Inventory/Items engine for cosmetics/collectibles/equipment — resist modeling these as Economy ledger rows even under deadline pressure.
10. Notification/Comms engine as the real owner of `Notification` + push delivery + digesting.
11. Evaluate Kafka only if/when you have genuinely separate deployable services (not just NestJS modules) with independent scaling needs — not before.

---

## 15. Migration plan (for items 1-4 above — the near-term list)

1. **Outbox relay** — additive only. New BullMQ repeatable job + Core module. Zero changes to existing `record()`/`emit()` call sites. Ship behind a flag that double-runs (in-process emit stays as-is, relay also fires) until confidence is high, then consider whether in-process `emit()` becomes redundant with the relay or stays as the low-latency same-tick path (recommend keeping both — relay for durability/cross-process, emit for same-tick UI-response needs).
2. **AI Services queue front** — add a BullMQ queue + consumer in `ai-services/`, keep `AiVisionService`'s public method signature identical, change `PhotoVerificationStrategy` to enqueue-and-await (or enqueue-and-poll via `VerificationJob` status) instead of direct injection. This is a one-file coupling fix, not a rewrite.
3. **Identity engine** — additive. New `application`/`domain` folders; existing `auth-context`/`auth.module`/guards stay as Identity's `interfaces` layer. Start by moving "what happens on first login" (today presumably implicit) into an explicit `RegisterPlayerUseCase` that publishes `PlayerRegistered` and is the one place `User`/`PlayerProfile`/`StreakState` initial rows get created — currently check whether this already happens somewhere ad hoc and consolidate it.
4. **Rules Engine v1** — additive, opt-in per engine. Build `core/rules/RuleEvaluator`, migrate Achievement's existing unlock-condition checks to call it one achievement type at a time, keep old code path until parity is proven, then delete the old per-type `if` logic (delete, don't deprecate — per your own repo's CLAUDE.md instinct against backwards-compat shims).

None of these four require a schema rewrite or a breaking change to `game-events.ts`. That contract file should stay exactly as stable as it's been designed to be — the fixes are additive infrastructure underneath it, not renegotiations of the event contract.

---

## 16. Technical debt list

1. `GameEventLog.publishedAt` never set — outbox non-functional (Critical, see above).
2. `PhotoVerificationStrategy` direct-injects `AiVisionService` — sync cross-engine coupling (High).
3. Identity Engine has no application/domain layer — five infrastructure files masquerading as an engine (High).
4. No Rules Engine — condition logic will duplicate across Achievement/Quest/LiveOps (High, growing).
5. `ContentDefinition.schemaVersion` is written but never read for migration (Medium).
6. `QuestChainState.unlockedQuestIds: String[]` — untyped reference, no dependency validation (Medium).
7. `Notification` table has no owning engine (Medium).
8. No `ContentPublishService` — content mutation is a raw upsert with no draft/rollback/audit workflow (Medium).
9. No feature-flag/experiment data model anywhere (Medium, blocks roadmap items explicitly requested).
10. Analytics engine lacks `domain`/`infrastructure` folders — fine today, revisit once it needs its own ingestion path rather than pure Prisma aggregation (Low).

---

## 17. What I would redesign if this were starting from scratch

Honestly — not much structurally. The instinct to build a generic `ContentDefinition` registry instead of per-feature content tables, and append-only ledgers instead of mutable balances, are the two decisions that most backends *don't* make until they're forced to by a painful migration, and this one already made them on day one. If I were starting fresh I would:

1. **Build the outbox relay in the same commit as the outbox table**, not as a follow-up — the half-built state (write-only log) is worse than either "no outbox" (you'd know to be careful) or "working outbox" (you'd be safe); half-built creates false confidence.
2. **Design AI Services as queue-fronted from the first line**, since "external AI vendor call in the hot path" is such a well-known failure mode in this exact kind of app (photo verification) that it shouldn't need a retrofit.
3. **Stand up Identity as a real engine before Progression/Quest**, since almost everything else is downstream of "what is a player, what can happen to their account" — building it last means every other engine had to make an implicit assumption about identity that now needs auditing.
4. **Introduce the Rules Engine as soon as the second condition-bearing system (Achievement, after Quest) was built**, rather than letting each engine grow its own `if`-based condition logic first and migrating later — migrations are always more expensive than starting there.
5. **Keep everything else** — the engine boundary discipline (verified by the near-total absence of illegal cross-engine imports), the event-contract-as-single-file pattern, and the DDD folder shape are all worth keeping exactly as they are and extending, not replacing.
