# HABBIT Backend — Principal-Level Architecture Review & V5.0 Target

## 0. How to read this document

This is a critique of the codebase as it stands after the previous two passes
(domain-module rewrite, then game-engine restructure), followed by a target
architecture for what HABBIT needs to look like to support the full five-year
feature list without another rebuild. It is deliberately harsh where the
current design has real weaknesses — several of which I introduced two
passes ago and am now flagging against myself.

The verdict up front: **the event-bus-and-engines shape from the last pass is
the right foundation and should not be thrown out.** But four things are
wrong at a level that will hurt in year two, not year five, and one entire
category of concept — *player state as inventory/possessions*, not just
XP/currency — is completely missing. That gap is the most urgent fix,
because everything in the "future systems" list (equipment, crafting,
marketplace, battle pass rewards, collectibles, companions) is fundamentally
"the player owns a *thing*," and there is currently no concept of a *thing*
anywhere in the system.

---

## 1. Engine-by-engine review

### 1.1 Core

**What it owns today:** GameEventBus (in-process emitter + outbox), Content
Registry, GameClock, a `ProgressionCurveRepository`/`ProgressionEngine` pair
that leaked in from Progression, idempotency helper, identity primitives
(barely used), Redis client, BullMQ wiring.

**Single responsibility?** No — and this is the first real problem. Core has
become two different things wearing one name:

1. **Infrastructure plumbing** (Prisma, Redis, BullMQ, event bus transport) —
   this is legitimately shared and belongs in one place.
2. **Shared domain primitives** (Content Registry, the XP curve formula,
   currency amount types) — this is *game design logic*, not infrastructure,
   and conflating the two means "Core" has no coherent test for "does this
   belong here." Anyone touching the codebase in year two will keep dumping
   things into Core because the current Core already contains a domain
   formula (`ProgressionEngine`), which sets a bad precedent — the next
   engineer will just as reasonably add `InventoryValuationEngine` or
   `DifficultyCurve` to Core "because ProgressionEngine is there too."

**Does it own too much?** The Content Registry is the single biggest latent
bottleneck in the whole system, and it's in Core. Every engine — Quest,
Achievement, LiveOps, and eventually Marketplace, Battle Pass, Crafting,
NPCs, Guild templates — reads through *one* table (`content_definitions`)
with a `type` discriminator and an opaque `payload: Json`. This works at
current scale. It will not survive:
- **Write contention** — an admin publishing a new season and a live quest-
  balancing job updating `content_difficulty_stats`-driven weights are
  hitting the same table.
- **Query planning** — Postgres can't meaningfully index/optimize a JSONB
  payload shared across a dozen unrelated shapes. `listActive()` for quests
  scans the same table as `listActive()` for NPC scripts.
- **Blast radius** — a bad migration, a lock, or a hot index rebuild on
  `content_definitions` takes down quest generation, achievements, seasons,
  and (later) marketplace pricing simultaneously, because they're the same
  physical table.

This is the classic "one generic table to rule them all" trap. It looks
elegant at 10 content types and becomes a scaling and blast-radius problem
at 30. **Verdict: the *pattern* (versioned, typed-adapter content) is
correct and should stay. The *single-table* implementation needs to become
per-domain physical tables behind the same logical interface before this
goes to production scale** — see §4.

**Hidden couplings:** `ProgressionCurveRepository` living in Core, imported
by Achievement, is a smell disguised as a virtue. I justified it last pass
as "a pure formula, not a service call" — that's true in the narrow sense
that it has no side effects, but it means Core now encodes a specific game-
design decision (how levels/tiers work) that has nothing to do with events,
content storage, or clocks. If HABBIT ever wants *per-season* or *per-track*
progression curves (a Destiny-style "Power Level" separate from "Account
Level," or a Battle Pass track with its own curve), this single global
curve becomes a wall. It should move to a proper **Progression Engine
sub-module** that other engines depend on via a narrow published interface
(`LevelCurveProvider`), not a Core primitive.

**Missing from Core:** Feature flags / remote config, experimentation
(A/B assignment), a proper **Player Inventory ledger primitive** (see §2 —
this is the load-bearing gap), tenant/region context, and a **snapshot/
event-sourcing boundary**. All discussed below.

---

### 1.2 Identity

**Single responsibility:** Yes, narrowly — JWT verification, `AuthContext`.
This is the one engine in the current design that is *correctly* scoped and
should not grow. Resist the temptation to put `PlayerProfile` here (it
currently correctly lives in Progression, which is right — profile is
presentation over progression state, not auth state).

**What's missing that will bite:** Identity today is "verify a Supabase JWT
and stop." At scale this needs to become the actual **Account Engine**:
- Multiple linked identities per account (email + Apple + Google + guest-to-
  real-account migration) — Duolingo/Riot/Epic all have this because "one
  auth provider forever" never survives five years.
- **Session/device management** for anti-cheat and multi-device play.
- **Ban/suspension state** — this cannot live in Community's moderation
  queue; a banned account needs to be unable to authenticate at all, which
  is an Identity concern, not a Community one.
- **Social graph** (friends, blocks) is *account-relationship* data, not
  Community content. Placing it in Community (as I would have defaulted to)
  is wrong for the same reason Discord and Riot keep "who is your friend"
  separate from "what did you post" — the social graph is queried on nearly
  every request path (privacy checks, matchmaking-adjacent guild/co-op
  eligibility, notification fan-out) and needs to be cheap and authoritative,
  not a join through a content-heavy engine.

**Verdict: rename/expand to Identity & Account Engine, and pull the social
graph out of "Community" into it before Community grows.**

---

### 1.3 Quest Engine

**Single responsibility:** Mostly yes — generation, assignment, lifecycle,
scheduling. This is the best-scoped engine in the system.

**Does it own too much?** One real issue: `QuestChainState` (narrative
chapter progress) is modeled as a Quest Engine table today, which is *fine
for linear chains* but will not survive **Story Campaigns** or branching
narrative (see §3). A campaign with branching dialogue, NPC state,
world-flags, and multiple concurrent chains per player is a bigger state
machine than "current chapter index." Quest Engine should keep owning *quest
completion mechanics*; a separate **Narrative/Campaign Engine** should own
*story state, branching, and NPC-relationship-driven unlocks*, publishing
into and reading from Quest Engine's completion events rather than Quest
Engine growing a narrative-state-machine feature.

**Hidden coupling:** Quest Engine's `recentAssignments` cooldown logic reads
the assignment table directly and, transitively, `ContentDefinition`
through the adapter — meaning quest selection quality is *only* as good as
what's in one shared JSONB table. Once Marketplace/Battle Pass/Guild-quest
content is also `ContentDefinition` rows, `listActive({type:
'quest_definition'})` queries share table bloat with everything else. This
is the same Content Registry issue from §1.1 surfacing concretely here.

**Will this scale?** The generation algorithm (`QuestGenerator`) is pure and
well-tested — good. But it runs **per user, synchronously, in a loop** inside
`QuestSchedulerService.runDailyResetForAllUsers()`. At "millions of users,"
a single BullMQ job iterating every user serially at UTC-hour boundaries is
a multi-hour job that will miss its window. This needs to become a fan-out:
one job enqueues per-shard/per-timezone-bucket batches, each processed by a
worker pool, not one process looping over the entire user table.

**Circular dependency risk:** None today. But if Dynamic Difficulty
(Analytics → Quest weighting) and AI-Generated Quests (AI Services → Content
Registry → Quest) both land as designed, there's a real risk of Quest Engine
depending on Analytics' derived signal *and* Analytics depending on Quest
Engine's completion events — which is fine *as long as it stays event-only*.
The danger is a future engineer adding a direct "ask Analytics for the
current difficulty score" synchronous call from inside `QuestGenerator`
because it's convenient. That would create a request-time dependency from
the core gameplay loop onto an analytics read path. **This needs an explicit
rule, not just hygiene**: Quest Engine may only consume difficulty signals
that have already been materialized into `ContentDefinition`/quest-pool
weight data by an offline job — never a live cross-engine query in the
request path.

---

### 1.4 Verification Engine

**Single responsibility:** Yes. Pipeline pattern is correct and this is the
one place genuinely ready for scale-out (submission → queue → worker →
event, already async via `QuestSubmissionReceived`).

**What's missing:** No real **anti-cheat/anti-abuse engine** exists — what's
there (dedup hash, confidence thresholds) is *verification-strategy-local*
anti-abuse, not account-level. Detecting "this account is submitting
implausibly fast across 40 quests" or "this device fingerprint matches 200
other accounts" is a cross-cutting concern that touches Identity (device/
session), Quest (submission timing), Economy (currency velocity), and
Verification (rejection rate) simultaneously. Bolting that onto Verification
Engine (the natural first instinct) would make Verification "the anti-cheat
engine" by accretion, which is wrong — anti-cheat needs to see across *all*
engines' events, the same way Analytics does. **This should be a sibling of
Analytics: a dedicated Trust & Safety Engine, consuming the same
event stream, with authority to emit a `TrustSignal` that Identity can act
on (suspend) and Verification can act on (force manual review).**

**Hidden coupling:** `PhotoVerificationStrategy`'s dedup check queries
`QuestSubmission` directly for the user's history. At scale this is a
correctness problem waiting to happen: perceptual-hash dedup needs to be
checked *globally*, not just per-user (stolen/scraped images reused across
accounts is the actual abuse pattern), which means it needs a proper
indexed hash-similarity store (a pHash index), not a Postgres row scan. This
is infrastructure that belongs in Core or in the future Trust & Safety
engine, not hand-rolled inside a verification strategy.

---

### 1.5 Progression Engine

**Single responsibility:** Mostly, but it has accidentally become
*"everything about the player that isn't a quest or a coin"* — XP ledger,
level/tier snapshot, `PlayerProfile`, and (added last pass) streak tracking.
Streak tracking in particular is a mistake I'd reverse: a streak is not XP
progression, it's a *separate, parallel meta-progression system* that games
like Duolingo treat as its own subsystem (streak freezes, streak repair as
purchasable items, streak milestones as a distinct reward track). Housing it
inside `XpLedgerService`'s neighborhood conflates "how much XP do you have"
with "how consistently do you show up," which are different game systems
that will want different rules, different UI, different monetization hooks
(streak freeze is an Economy/Marketplace item, not a Progression concept).

**Does it own too much?** Yes — Progression today is really three engines
wearing a trenchcoat:
1. **XP/Level/Tier** (the actual progression curve) — correctly scoped.
2. **Player Profile** (identity presentation) — arguably fine to stay, but
   borderline; a "Player Identity Card" service is common in AAA backends
   (Riot's player summary service) as its own thin read-model.
3. **Streaks** — should be its own **Habit/Momentum Engine** or folded into
   a broader "Engagement Systems" engine alongside notifications/reminders,
   because streaks are fundamentally a retention mechanic, not a
   progression mechanic, and HABBIT's whole premise is retention through
   habit formation — this deserves to be a first-class engine, not a
   listener bolted onto XP.

**Missing:** **Titles and cosmetic unlocks** are referenced in the original
product spec ("unlock titles") but there is no model for them anywhere —
Achievement Engine grants `AchievementUnlock` rows but nothing renders a
title as equippable player state. This is the first crack of the missing
Inventory concept (§2).

---

### 1.6 Economy Engine

**Single responsibility:** Yes, and the append-only ledger pattern is
correct and should be the template for Inventory too.

**Does it own too much / too little?** Too little, currently — it's a bank
account with no store attached. `PurchaseRecord` exists in the schema but
there is no `StoreItem` content type, no purchase flow, no
`MarketplaceService`. That's fine as a snapshot of "not built yet," but the
architectural question is *where does Marketplace go*, and the answer is
**not** "grow Economy Engine to include it." Economy should stay narrowly
"the ledger and wallet primitive" — debits and credits, nothing else.
**Marketplace/Store/Daily Shop should be their own engine** that *calls into*
Economy for the actual currency movement (via Economy's public
grant/spend API, not by writing ledger rows itself) and *calls into* the
future Inventory engine to actually grant the purchased item. This mirrors
how Steam separates the Wallet service from the Store service from
Inventory — three different systems with different scaling and consistency
requirements (wallet needs strong consistency; store catalog needs to be
heavily cached and can tolerate slight staleness; inventory needs to survive
concurrent trades/equips).

**Hidden coupling risk:** `EconomyEventListener` reacting to `QuestCompleted`
for `coinReward` is fine today. It will not be fine once there are a dozen
sources of currency (battle pass tiers, achievements, marketplace refunds,
daily login bonuses, trading). Each of those becoming its own ad hoc
listener on Economy is how you get "20 places emit currency grants, no two
of which agree on rounding/rate-limiting rules." **Economy needs a single
internal `RewardGrantService` that all currency-granting listeners funnel
through**, so business rules (daily grant caps, anti-farming throttles) live
in one place, not copy-pasted per listener.

---

### 1.7 Achievement Engine

**Single responsibility:** Yes, and the generic rule-DSL approach
(`AchievementRuleEvaluator`) is the right call — this is the one part of
the system already built the way a AAA backend would build it (data-driven
rule evaluation, not per-achievement code).

**What's missing:** The rule evaluator currently re-evaluates *every*
enabled achievement on *every* qualifying event for a user
(`evaluateFor(userId)` loops all definitions). At "millions of users," with
hundreds of achievements, this is an O(achievements) scan on every quest
completion, level-up, and streak extension — for every player, forever. At
scale this needs an **inverted index**: which achievements care about which
event type / stat, computed once when achievements are authored, so a
`QuestCompleted` event only re-evaluates the handful of achievements that
actually reference `quest_completions` or category-specific counters. This
is a real, not hypothetical, performance cliff — it's the kind of thing that
works fine in a demo and falls over at the first "10k achievements complete
in the same minute" event (a launch day, a viral moment).

**Missing entirely:** **Titles, badges as equippable cosmetics** — same gap
as Progression, same root cause (no Inventory).

---

### 1.8 LiveOps Engine

**Single responsibility:** Conceptually yes, but it's currently the
thinnest engine relative to what its name promises. `SeasonService`,
`WorldEventService`, `BattlePassService` exist as read/reconcile stubs with
almost no actual game logic — which is honestly stated as a stub in the code
comments, so this isn't a surprise finding, but it's worth being explicit
that **LiveOps as currently scoped is actually three future engines
pretending to be one**:

1. **Season/Rotation Engine** — activating/deactivating content windows.
   This is legitimately thin and generic; fine to keep small.
2. **World Event Engine** — this needs to become a *real* stateful system:
   aggregate, multi-player, possibly regional (does a "world event" run per-
   region or globally? — this decision has to be made before multi-region
   deployment, not after) counters with contribution tracking per player
   (for reward tiers based on individual contribution, à la Destiny public
   events or Pokémon GO Community Day bonuses). Currently `WorldEventProgress`
   is a single global counter with no per-player contribution ledger — this
   cannot support "top contributors get bonus rewards," which is the entire
   point of the pattern in the games it's modeled on.
3. **Battle Pass Engine** — genuinely deserves to be its own engine, not a
   LiveOps sub-service, because it has real complexity: a parallel XP track,
   tier-gated reward claims (which need Inventory + Economy), free vs.
   premium tracks, and season-boundary migration of unclaimed rewards. This
   is comparable in complexity to Progression Engine itself.

**Verdict: split LiveOps into Season/Rotation (stays small, stays in
LiveOps), World/Dynamic Events (grows into its own engine), and Battle Pass
(becomes its own engine that composes Economy + Inventory + Content
Registry).**

---

### 1.9 Community Engine

**Single responsibility:** No — currently it's "Feed + Leaderboard," which
are only related by both being "social-ish," not by any real shared
ownership. This is the second-most under-designed engine after LiveOps.

At the five-year feature list, "Community" is actually asked to become at
least four different systems:
- **Feed** (current) — posts, likes.
- **Social Graph** (missing) — friends, follows, blocks. As noted in §1.2,
  this arguably belongs in Identity/Account, not here, because it's
  relationship *state*, queried on the hot path, not content.
- **Guilds** (missing) — membership, roles, guild-level progression/
  currency, guild quests. This is a genuinely large system: a guild is
  itself a second "player-like" entity that needs its own XP/currency/
  quest-assignment story, largely *reusing* Quest/Progression/Economy
  patterns but keyed on `guildId` instead of `userId`. This strongly
  suggests those three engines should be designed around a generic
  **"Actor" concept (player OR guild)** from the start, rather than
  hard-coding `userId: String` everywhere the way the current schema does.
  Retrofitting that later means touching every table.
- **Trading** (missing) — this is *not* a Community concern; it's an
  Inventory + Economy concern with a social discovery surface. Community
  might host "who's trading what," but the actual trade execution (escrow,
  two-party atomic exchange) belongs with Inventory for the same reason
  Marketplace belongs with Economy: transactional integrity requirements
  are different from social/content requirements.

**Verdict: Community should shrink to Feed + Social Graph (or lose Social
Graph to Identity/Account) and a new Guild Engine should be split out
explicitly, built on the same Actor abstraction as Quest/Progression/Economy.**

---

### 1.10 Analytics Engine

**Single responsibility:** Yes, correctly read-only, correctly a pure event
consumer. This is the second-best-scoped engine after Quest.

**What's missing for real scale:** Analytics today writes synchronous
aggregate counters (`ContentDifficultyStats`) directly from an in-process
event listener. This is fine at current scale and wrong at "millions of
users" scale for a structural reason: **analytics/telemetry ingestion must
never be able to backpressure or slow down the gameplay event path.** An
in-process `@OnEvent` listener doing a Postgres upsert on every single
`SubmissionVerified` event means a slow analytics write can, in the current
architecture, block the event loop tick that the *gameplay* listeners
(Progression, Achievement) are also on. At scale, Analytics/Telemetry needs
to consume from the **durable outbox relay** (which already exists in
concept — `GameEventLog` — but is not actually wired to a real
publish-to-BullMQ relay yet, it's a table nothing reads from), landing in a
write-optimized store (a proper time-series/columnar store, or at minimum a
dedicated analytics Postgres replica), never the primary OLTP database used
for gameplay reads/writes.

**Missing entirely:** Actual behavioral analytics (funnels, retention
cohorts, session tracking) — what exists is one narrow difficulty-signal
feature, not a general telemetry engine. See §3/§5 (Telemetry as its own
concern, separate from "Analytics" as gameplay-tuning signal derivation).

---

### 1.11 AI Services Engine

**Single responsibility:** Yes for what exists (vision classification
provider abstraction). Correctly promoted out of Verification last pass.

**What's missing:** Everything implied by "AI-generated quests" and "AI NPC
conversations" — there is no generation pipeline, no moderation-before-
publish step for AI-generated content, no conversation/session state for
NPC dialogue. This is fine as a snapshot (the feature isn't built), but the
**architectural** point worth making now: AI-generated content must flow
through the **same Content Registry moderation/draft→active pipeline** as
human-authored content, not a side channel. An AI-drafted quest should land
as a `ContentDefinition` row with `status: 'draft'`, subject to the same
review queue as anything else, specifically *because* AI generation is the
highest-risk content source for producing something exploitable, offensive,
or broken. There is currently no draft/review workflow in Content Registry
at all (everything defaults to `status: 'active'`) — that gap needs to close
before AI generation is safe to turn on, not after.

---

## 2. The load-bearing gap: there is no Inventory

Walk the five-year list again: **Equipment, Crafting, Marketplace, Battle
Pass rewards, Collectibles, Companions, Trading, cosmetic Titles/Badges** —
every one of these is "the player possesses discrete, ownable things,
possibly stackable, possibly equippable, possibly tradeable." None of that
exists. XP is a ledger (a *scalar* resource). Currency is a ledger (also
scalar). There is no concept of a **non-fungible or stackable owned item**
anywhere in the schema.

This is the single most consequential finding in this review, because it is
the one gap that is *expensive to retrofit* — every system above assumed
"reward = XP + maybe coins" and none of them can express "reward = this
specific sword skin" without a new primitive. Building Marketplace, Battle
Pass, Achievements-that-grant-cosmetics, or Crafting on today's schema means
each of those engines invents its own ad hoc "thing the player owns" table,
which is exactly the fragmentation this whole redesign has been trying to
avoid.

**This needs to be designed now** as a new Core-adjacent primitive engine —
see §4's `InventoryEngine`.

---

## 3. Feature-by-feature: does the architecture survive it?

| Feature | Survives as-is? | What's actually needed |
|---|---|---|
| Quest Chains | Partially | `QuestChainState` exists but is linear-only; fine for simple chains |
| Story Campaigns | **No** | Needs branching state, NPC relationship flags — new Narrative Engine (§1.3) |
| NPCs | **No** | No entity model, no dialogue/relationship state — new engine |
| Guilds | **No** | Needs Actor abstraction (§1.9) — significant schema change if retrofitted later |
| Raids | **No** | Needs Guilds + multi-player co-op quest aggregation — depends on Guild Engine existing first |
| Co-op Quests | Partially | Quest Engine's per-user model doesn't support shared-progress assignments; needs an Actor-scoped assignment |
| Dynamic Events | Partially | `WorldEventProgress` is a stub with no per-player contribution ledger (§1.8) |
| Battle Pass | **No** | Stub only; needs own engine composing Economy + Inventory |
| Marketplace | **No** | `PurchaseRecord` exists, no store, no catalog, no Inventory to grant into |
| Inventory | **Does not exist** | New Core-adjacent engine, see §4 |
| Equipment | **No** | Depends entirely on Inventory existing |
| Crafting | **No** | Depends on Inventory (consumes items, produces items) |
| Daily Shop | **No** | Depends on Marketplace + Inventory |
| Seasonal Worlds | Partially | Content Registry's `activeFrom/activeUntil` supports this at the content level; no "world state" concept |
| AI-generated Quests | Partially | AI Services exists; Content Registry has no draft/review workflow (§1.11) — unsafe to ship without it |
| AI NPC conversations | **No** | No NPC engine, no conversation session state |
| Dynamic Difficulty | Partially | `ContentDifficultySignal` exists but nothing consumes it yet; risk of a bad synchronous coupling (§1.3) |
| Adaptive Rewards | **No** | No concept of per-player reward tuning; would build on Analytics signals + Economy |
| Exploration | Partially | GPS verification strategy exists; no "discovered locations" persistent state |
| Collectibles | **No** | Depends on Inventory |
| Reputation | **No** | Needs per-faction/per-NPC scalar tracks — similar ledger pattern to XP, different engine |
| Factions | **No** | New entity type, likely under Narrative or a new Faction Engine |
| Companion System | **No** | Depends on Inventory (companion = owned entity with its own state) |
| Trading | **No** | Depends on Inventory + Economy; needs atomic two-party exchange primitive |
| Notifications | Exists (`Notification` model) but no dedicated engine | Should become explicit Engagement/Notification Engine, not scattered `prisma.notification.create` calls |
| Social Graph | **No** | See §1.2/§1.9 — needs a home, doesn't have one |
| Creator-generated content | **No** | Would build on Content Registry's draft/review pipeline, once that exists |
| Modding support | **No** | Out of scope for backend architecture directly; would need a public Content Registry API + sandboxed execution for any scripted content — significant new surface, not a small addition |
| Live balancing | Partially | Content Registry supports config changes without deploy; no experimentation/flagging layer to control rollout (see next row) |
| Experimentation (A/B) | **No** | Nothing exists; needs a Core `ExperimentAssignmentService` |
| Feature flags | **No** | Nothing exists; needs a Core `FeatureFlagService`, ideally same system as experimentation |
| Remote configuration | Partially | Content Registry is *a* form of this for game content; no generic non-content config (rate limits, thresholds, client-facing config) |
| Telemetry | Partially | Analytics exists but conflates "gameplay-tuning signals" with "raw behavioral telemetry" — these should split (§1.10) |
| Replay / Event sourcing | **No** | `GameEventLog` exists as an outbox but is not retained/queryable as a replay log; no snapshot/replay tooling |
| Anti-cheat / anti-abuse | Partially | Verification-local checks only; no account-level or cross-engine trust engine (§1.4) |
| Moderation | Partially | `ModerationFlag` exists for submissions; no moderation workflow for feed posts, guild names, user-generated text, or (future) creator content |
| Multi-region deployment | **No** | Nothing in the current design considers data residency, region-scoped world events, or cross-region leaderboards — this is a foundational decision, not a feature |

**Reading this table honestly: roughly two-thirds of the target feature list
either doesn't work today or works in a way that will need to be rebuilt.**
That is not a failure of the last two passes — daily/weekly/monthly quests,
XP, verification, and basic achievements are genuinely solid — but it does
mean "we're basically done, just need to add features" is the wrong mental
model. The right mental model is "we built a correct core loop; the RPG
around it doesn't exist yet."

---

## 4. Patterns from large-scale game backends, and why they matter here

- **Riot Games (League/Valorant back-end) — service-per-bounded-context with
  no shared database.** Riot's platform is famous for extreme service
  isolation: inventory, wallet, match history, and social are genuinely
  separate services with separate datastores, communicating only through
  well-versioned APIs/events. The reason: independent scaling and
  independent failure domains — a matchmaking incident cannot take down
  inventory. **HABBIT doesn't need separate databases per engine at current
  scale**, but it does need the *logical* separation (separate tables, no
  cross-engine joins, no direct FK from one engine's table into another's)
  starting now, because migrating from "shared schema, separate engines" to
  "separate schemas" is far cheaper than migrating from "spaghetti FKs" to
  anything.

- **Supercell (Clash of Clans/Royale) — everything server-authoritative,
  client is a view.** Supercell's server holds all state; the client never
  computes rewards or validates its own actions. HABBIT already does this
  correctly (verification pipeline, XP ledger server-side) — worth stating
  explicitly as a principle to defend as AI-generated content and modding
  arrive, since both are natural pressure points for someone proposing
  "let the client suggest the quest" or "let a mod compute its own rewards."
  **Rule: content generation may happen anywhere; reward computation and
  grant must always happen server-side, in the owning engine (Economy/
  Inventory/Progression), never trusted from a client or a mod payload.**

- **Destiny 2 — separate "Account" vs "Character" vs "Profile" scoping,
  and a strict separation between Inventory (Bungie's "Bucket" system) and
  Progression.** Destiny's inventory is famously its own service with strict
  bucket/slot rules, decoupled entirely from the XP/leveling system, which
  is itself decoupled from the seasonal Battle Pass track. This maps almost
  exactly onto the gaps found in §1.5–§1.8: **the fix HABBIT needs (split
  Inventory out, split Battle Pass out, keep Progression to XP/level only)
  is the same shape Destiny converged on**, not a novel idea — it's the
  standard solution once a game has more than one progression track.

- **Genshin Impact / gacha-adjacent live-service — strict separation of
  "Currency," "Item," and "Character/Companion" as three different owned-
  entity types with different rules** (currency is fungible and capped per
  source; items are stackable; characters are unique, levelable, and
  equippable). This is directly relevant to the Companion System and
  Equipment features — HABBIT's future Inventory Engine should model at
  least these three ownership shapes from day one, not just "items."

- **Pokémon GO — regional/world-event state is server-side and
  location-aware, with strong anti-spoofing built into the verification
  layer, not bolted on.** HABBIT's GPS verification strategy is the right
  instinct; the gap is that Pokémon GO treats location-integrity as a
  first-class Trust & Safety concern (device attestation, velocity checks
  across submissions) rather than a per-strategy check — reinforcing §1.4's
  recommendation for a dedicated Trust & Safety engine.

- **Duolingo — streaks, leagues, and gems are explicitly separate systems
  with separate teams internally,** despite looking related from the
  outside. This directly validates §1.5's recommendation to pull streaks out
  of Progression Engine — Duolingo, the closest real-world analog to
  HABBIT's product, does not treat "days in a row" as part of "XP level,"
  and neither should HABBIT.

- **Discord — Social Graph and Presence are core platform services, not a
  feature of any one product surface,** because nearly every other feature
  (notifications, guild/server membership, moderation) needs to query "who
  is connected to whom" cheaply and consistently. This validates pulling
  Social Graph into Identity/Account rather than leaving it under Community.

- **Steam — Inventory and Trading are a dedicated, heavily-hardened
  subsystem separate from the Store,** specifically because item ownership
  and trade integrity have different consistency/fraud requirements than
  browsing a catalog. Directly validates §1.6's Marketplace/Inventory split.

None of these are being copied wholesale — HABBIT is not a match-based
competitive game and doesn't need Riot's matchmaking infrastructure, for
instance. The pattern being borrowed in every case above is the same one:
**separate systems by their consistency/scaling/failure requirements, not
by how related they feel narratively.** XP and streaks feel related
(both are "progress") but have different rules. Currency and Inventory feel
related (both are "rewards") but have different consistency needs. That's
the lens the V5.0 redesign below applies throughout.

---

## 5. Target architecture — HABBIT v5.0

### 5.1 Engine ownership map

```
┌─────────────────────────────────────────────────────────────────────┐
│ CORE (infra + universal primitives only)                             │
│  GameEventBus (durable outbox + relay, actually wired)                │
│  GameClock · Idempotency · Redis · BullMQ · Prisma                    │
│  Feature Flags & Experimentation (NEW)                                │
│  Actor abstraction: ActorRef { type: player|guild, id }  (NEW)        │
└─────────────────────────────────────────────────────────────────────┘
            │ every engine depends on Core; Core depends on nothing
┌───────────┴─────────────────────────────────────────────────────────┐
│ CONTENT PLATFORM (was: Content Registry, now its own layer)          │
│  Per-domain content tables behind one adapter interface (NEW SHAPE)   │
│  Draft → Review → Active → Archived workflow (NEW)                    │
│  Versioning, scheduling, creator/AI submission queue (NEW)            │
└────────────────────────────────────────────────────────────────────┘
            │ every gameplay engine reads content through this
┌───────────┴──────────────┬──────────────┬───────────────┬───────────┐
│ IDENTITY & ACCOUNT         │ TRUST & SAFETY│ QUEST         │ NARRATIVE │
│  Auth · Sessions            │ (NEW)         │  Generator     │ (NEW)     │
│  Social Graph (moved here)  │ Anti-cheat    │  Assignment    │ Campaigns │
│  Ban/suspension              │ Anti-abuse    │  Lifecycle     │ NPCs      │
│                              │ Device trust  │  Scheduler     │ Dialogue  │
└──────────────────────────────┴──────────────┴───────────────┴───────────┘
┌───────────────────────────┬──────────────┬───────────────┬───────────┐
│ VERIFICATION                │ PROGRESSION   │ ENGAGEMENT     │ ACHIEVEMENT│
│  Strategy pipeline           │  XP/Level/Tier │ (NEW, was      │  Rule      │
│  (unchanged shape)            │  Profile       │  streaks in    │  engine +  │
│                               │                │  Progression)  │  inverted  │
│                               │                │  Streaks       │  index     │
│                               │                │  Notifications │            │
└───────────────────────────────┴────────────────┴────────────────┴───────────┘
┌───────────────┬───────────────┬───────────────┬────────────────────┐
│ ECONOMY         │ INVENTORY      │ MARKETPLACE     │ BATTLE PASS (NEW,  │
│  Wallet ledger   │ (NEW)          │ (NEW)           │  split from LiveOps)│
│  Grant/spend API │  Item ownership│  Catalog        │  Track + tiers +    │
│  RewardGrant hub │  Equip slots   │  Purchase flow   │  claim flow          │
│                  │  Stacks/uniques│  Daily Shop      │                      │
│                  │  Trading escrow│                 │                      │
└───────────────────────────────────────────────────────────────────────┘
┌───────────────┬───────────────┬───────────────┬────────────────────┐
│ GUILD (NEW)     │ WORLD EVENTS   │ COMMUNITY       │ ANALYTICS &         │
│  Actor-based     │ (split from    │  Feed only now  │  TELEMETRY           │
│  Guild quests    │  LiveOps)      │  (social graph  │  (split: gameplay    │
│  Raids/co-op     │  Contribution  │   moved out)    │  tuning signals vs   │
│                  │  ledgers       │                 │  raw behavioral      │
│                  │  Regional      │                 │  telemetry)          │
│                  │  scoping       │                 │                      │
└───────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────────────┐
│ AI SERVICES                                                         │
│  Vision (existing) · Quest generation drafting (NEW) · NPC dialogue │
│  (NEW) — all output lands in Content Platform as `draft`, never      │
│  auto-published                                                     │
└───────────────────────────────────────────────────────────────────┘
```

### 5.2 The Actor abstraction (the single highest-leverage change)

Today every table hard-codes `userId: String`. The moment Guilds exist,
"who does this XP/currency/quest-assignment belong to" needs to be *either*
a player *or* a guild. Retrofitting this after Guilds ship means an
`ALTER TABLE` + backfill on every player-scoped table in the system —
`quest_assignments`, `xp_ledger_entries`, `currency_ledger_entries`,
`achievement_unlocks`, all of it.

**Do this now, before Guilds are built:**

```
ActorRef = { actorType: 'player' | 'guild', actorId: string }
```

`QuestAssignment.userId` becomes `QuestAssignment.actorType` +
`QuestAssignment.actorId` (or a single composite `actorRef` column with an
index). `XpLedgerEntry`, `CurrencyLedgerEntry` follow the same shape. This
is a one-time schema decision that costs almost nothing today (there are no
guild actors yet, every row is just `actorType: 'player'`) and saves a
full-system migration later. This is the single most valuable change in
this entire document, because it's the one piece of technical debt that
gets *exponentially* more expensive the longer it's deferred.

### 5.3 Content Platform (was: Content Registry)

Keep the *interface* (`ContentAdapter<T>`, typed per-domain access) exactly
as designed last pass — that part was right. Change the *storage*:

```
quest_content         (id, key, payload, schemaVersion, activeFrom/Until, status, ...)
achievement_content    (same shape)
battle_pass_content
season_content
npc_content
store_item_content
faction_content
...
```

Same columns, same adapter pattern, **different physical tables**, so a
write storm on one content type (say, AI-generated quest drafts flooding in)
cannot lock or bloat indexes for unrelated content (season configs, NPC
scripts). A thin `ContentPlatformService` still provides the shared
draft→review→active→archived state machine and versioning logic across all
of them — the workflow is shared code, the storage is not a shared table.

Add the missing **review workflow** now: every write defaults to
`status: 'draft'`, and only a `publish()` call (human or automated-with-
policy-check) moves it to `active`. This is required *before* AI-generated
quests or creator-generated content can safely exist, so building it as part
of this pass — not after AI generation ships — is the right sequencing.

### 5.4 Inventory Engine (new, Core-adjacent)

```
InventoryItem        — ownerRef (Actor), itemContentId, quantity (null=unique), 
                        acquiredAt, instanceData (JSON, for e.g. crafted-item stats)
EquipmentSlot         — ownerRef, slotType, equippedItemId
TradeOffer            — offering actor, receiving actor, item/currency terms, 
                        status (pending|accepted|cancelled|expired), escrow state
```

Owns: grant/revoke item, equip/unequip, stack management, trade escrow.
Never computes *why* an item is granted (that's Achievement/Battle
Pass/Marketplace's job) — same separation of concerns as Economy already
has for currency. Marketplace, Crafting, Battle Pass, Achievement cosmetics,
and Companions all become *callers* of this one engine instead of five
different ad hoc ownership tables.

### 5.5 Event flow example — five years out (buying a battle-pass-exclusive item and equipping it)

```
Client → Marketplace.purchase(storeItemId)
  Marketplace: validate catalog entry (Content Platform), check eligibility
    (battle pass tier via Battle Pass Engine, region via Actor context)
  Marketplace → Economy.spend(actor, currency, amount, idempotencyKey)
    Economy: append ledger row, emit CurrencySpent
  Marketplace → Inventory.grant(actor, itemContentId, idempotencyKey)
    Inventory: create InventoryItem row, emit ItemGranted
  Marketplace emits PurchaseCompleted (durable, outbox)
    ↳ Analytics/Telemetry: records funnel event (async, off gameplay path)
    ↳ Achievement: re-evaluates "own N items" rules (inverted index, cheap)
    ↳ Notification (Engagement Engine): "purchase confirmed" push

Client → Inventory.equip(actor, itemId, slotType)
  Inventory: validate ownership + slot rules, update EquipmentSlot
  Inventory emits ItemEquipped
    ↳ Community/Feed (optional): "equipped a new title" if opted in
    ↳ Analytics: cosmetic-usage telemetry
```

No engine in this chain calls another engine's internals directly. Every
arrow is either "call the owning engine's narrow public API for a state
change that must be transactionally correct" (spend, grant, equip) or "react
to a durable event" (everything downstream of it). This is the same
discipline the current architecture already has for Quest↔Verification —
it just needs to extend to the new engines rather than being reinvented.

### 5.6 Multi-region

Not solved by sharding the database later — solved by deciding **now** which
data is global and which is region-scoped:
- **Global, strongly consistent:** account identity, inventory ownership,
  currency ledger (a player's wallet must be single-source-of-truth
  regardless of region, or duplication/fraud follows immediately).
- **Region-scoped:** World Events (a "world" can reasonably be per-region),
  leaderboards (global *and* regional views, computed from the same
  underlying ledger but cached separately per region), content delivery
  (Content Platform reads can be replicated/cached per region; writes go to
  a primary).

This doesn't need to be built now, but the Actor/ledger-everywhere pattern
in §5.2 and §5.4 is exactly what makes it *buildable later without a
rewrite* — region becomes another dimension on the same append-only ledger
pattern, not a new architecture.

---

## 6. Migration plan

This is sequenced by "what unlocks the most future work per unit of
migration pain," not by feature priority.

**Phase 1 — Foundational schema changes (do before building any new engine
listed below; these get more expensive every month they're deferred):**
1. Introduce the Actor abstraction; migrate `userId` columns to
   `actorType`/`actorId` across Quest, Progression, Economy, Achievement.
   Every existing row becomes `actorType: 'player'` — zero behavior change,
   pure schema/type widening.
2. Split Content Registry's single table into per-domain content tables
   behind the unchanged adapter interface. Mechanical migration, no engine
   logic changes.
3. Add draft/review status workflow to Content Platform (currently
   everything is implicitly `active`).
4. Wire the outbox relay that already exists in concept (`GameEventLog`) to
   an actual BullMQ publish job, so Analytics/Telemetry can move off the
   in-process listener path.

**Phase 2 — Split the overloaded engines (each is a "move code, don't
rewrite logic" migration):**
5. Extract Streaks + Notifications out of Progression into a new Engagement
   Engine.
6. Extract Social Graph out of (planned) Community into Identity & Account.
7. Split LiveOps into Season/Rotation (stays), World Events (grows), Battle
   Pass (becomes its own engine — mostly new code, since it's currently a
   stub).

**Phase 3 — Build the missing load-bearing primitive:**
8. Build Inventory Engine (grant/equip/trade-escrow). This unblocks
   Equipment, Collectibles, Companions, Crafting, and Marketplace reward
   fulfillment all at once — it's the single highest-leverage net-new build.
9. Build Marketplace Engine on top of Economy + Inventory + Content
   Platform.

**Phase 4 — New gameplay surface area, now unblocked by Phases 1–3:**
10. Guild Engine (on the Actor abstraction from Phase 1).
11. Narrative/Campaign Engine + NPC entities (on Content Platform's
    draft/review workflow from Phase 1, for eventual AI-authored dialogue).
12. Trust & Safety Engine (consumes the same durable event stream Analytics
    already reads from Phase 1's outbox relay).
13. Feature Flags + Experimentation in Core.

**Phase 5 — Operational maturity:**
14. Split Analytics into gameplay-tuning-signal derivation (stays close to
    engines) vs. raw behavioral telemetry (moves to a dedicated
    write-optimized store, off the primary OLTP database).
15. Multi-region: promote the region dimension already implicit in Phase 1's
    ledger pattern into actual regional deployment topology.

Each phase is independently shippable and each one is a strict prerequisite
for the phase after it — this ordering is deliberate, not just a priority
list. Building Guilds (Phase 4) before the Actor abstraction (Phase 1) is
exactly the mistake that costs a full-system migration instead of a
type-widening one.
