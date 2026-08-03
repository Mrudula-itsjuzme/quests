# HABBIT as a World — Game Design Systems Review & Clean-Slate Redesign

## 0. The question underneath the question

Every previous pass of this architecture answered "how do we structure the
code so it scales and stays maintainable." That's a necessary question and
the answers so far (event bus, engines, ledgers, content registry) are
still correct *as engineering*. But it's the wrong question to lead with,
because HABBIT isn't trying to be correctly-engineered plumbing — it's
trying to make a person feel, at 6:45am, that walking to get coffee is an
*expedition*, that a streak isn't a UI number but a small flame they don't
want to let die, that finding a yellow flower is a genuine little discovery
and not a checkbox with a reward attached.

So this document asks a different first question of every system: **what
does a player feel, and what story can they later tell, because this system
exists?** Engineering constraints come second — but they still come,
because a feeling nobody can afford to run at scale isn't a real feeling,
it's a demo.

---

## 1. What "a world" requires that "a habit tracker" doesn't

A habit tracker has *tasks*. A world has:

- **Persistence that isn't just data persistence** — the world remembers
  you specifically. Not "your stats are saved" but "the librarian NPC
  recognizes you've read here eleven mornings in a row." That's the same
  underlying database row, but it is not the same *feeling*, and the
  feeling is the product.
- **Causality that crosses systems** — rain today should mean different
  quests than a clear morning. A guild's collective effort should change
  what the *world* offers everyone in the next season, not just what one
  guild member sees. If every system only reacts to its own inputs, the
  world feels like a spreadsheet with skins on it. If systems visibly
  influence each other, it feels alive.
- **Asymmetric, discoverable content** — not everyone should see the same
  quest pool, and not everything should be explained. A rare Legendary
  Discovery quest that only appears at dawn, only in certain weather, only
  if you haven't seen it in 90 days, is not just a cooldown rule (though it
  is that) — it's the mechanism of *mystery*. The architecture needs to be
  able to hide its own rules from the player without hiding them from
  itself.
- **A sense of a place, not just a menu** — "quests" as a flat list is a
  to-do app. A **Region/Realm** concept — Mind, Body, and Discovery as
  actual *places* with their own NPCs, weather, seasonal dressing, and
  localized events — is what turns three category tabs into three
  countries you can come to know.
- **Things that are earned and *kept*, not just counted** — this is the
  Inventory gap from the last review, but seen from the player's side: a
  badge that only exists as a row in `achievement_unlocks` is a fact about
  you. A badge that is a *glowing object* you can look at, that appears in
  a case in your personal sanctuary, that an NPC comments on when they see
  it — is a *memory*. Same data. Different architecture required to make it
  presentable as a possession rather than a fact.

None of this changes "we need an event bus and ledgers." It changes *what
the events are about* and *what the ledgers are ledgers of*.

---

## 2. Systems designed for feeling, and the loops they form

Below, each system is named by the emotion it exists to produce, with the
mechanical system underneath it named second — because the ordering itself
is the point.

### 2.1 Wonder → **The Living World System**

**Feeling:** the world has weather, time of day, and a pulse independent of
you. You didn't cause the sunrise; you just happened to be awake for it.

**Mechanics:** a `WorldState` service (new — doesn't exist in any prior
pass) tracks time-of-day, a simulated weather cycle (seeded, deterministic,
regionally varied so "New York HABBIT" and "Tokyo HABBIT" don't feel
identical), and season. This is not cosmetic. It **feeds Quest Engine's
generation weights directly**: a "Watch a sunrise" quest is only offered
near actual local dawn; "Find a rainbow" only surfaces after rain in that
region; a Discovery quest pool can be reweighted toward "shelter/cozy"
subjects on a simulated storm day. This is the first interconnection loop
in the system: **Weather → Quest Pool Weighting**, a real dependency, not a
metaphor.

**Why this must be architected in from the start, not bolted on:** if Quest
Generation only ever reads from Content Registry + cooldown history (as it
does today), there's no seam for "the world" to influence quest selection
at all — weather-aware quests become a special case hacked into the
generator instead of just another weighting input the generator already
knows how to accept. The fix is small and should happen now: `QuestGenerator`
already takes a weighting function as a parameter; `WorldState` becomes
another input to that function, not a new code path.

### 2.2 Discovery / Curiosity → **The Field Journal (Codex) System**

**Feeling:** the joy of a naturalist's notebook — you don't just "complete"
a Discovery quest, you *catalog* what you found. Seeing "47 of 200 species
discovered" is a completely different motivational hook than a quest
counter, because it implies a *world that is bigger than you've seen*, on
purpose.

**Mechanics:** every Discovery-category `ContentDefinition` (orange cat,
rainbow, banyan tree...) is simultaneously a **Codex Entry** — a
collectible, not just a quest. First-time completion unlocks the entry
permanently (an Inventory-engine "unique, non-fungible, never removable"
item — this is exactly the Inventory gap from the prior review, now
motivated by feel instead of by "well marketplace needs it eventually").
Subsequent completions are just quest repeats; the Codex entry itself is
forever. This is the same underlying data as "achievement unlocks," but
architected as a *browsable collection with its own screen*, because a list
you can page through and admire is a different object in the player's mind
than a percentage in a profile summary.

**Loop it creates:** Codex completion rate per region feeds back into
**dynamic rarity** — if 90% of players in a region have found the orange
cat, the *system* (not a human designer) can quietly promote a rarer
regional variant into rotation. Discovery becomes self-refreshing without
manual content ops.

### 2.3 Mastery → **Paths, not just Levels**

**Feeling:** "I am becoming a person who reads" is a different, better
feeling than "I am Level 34." Levels measure time invested. **Paths**
measure *identity*.

**Mechanics:** alongside the account-wide XP/Level (kept — it's still the
right universal progress signal, per the last review), each of the three
Realms (Mind/Body/Discovery) has its own **Mastery Track** — a separate,
visible progression bar per realm, with its own tier names ("Apprentice
Reader → Scholar → Sage" for Mind; different vocabulary per realm). A
player who does mostly Body quests should visibly *become* something —
"Wayfarer, Level 3" — distinct from their account level. This is
mechanically "three more progression curves," which the ledger-per-track
pattern from the last review already supports (it was designed for exactly
this — multiple XP tracks was explicitly named as a reason to keep the
curve formula out of Core and make it a proper per-track service). The
design insight this pass adds: **the three Mastery Tracks should visibly
compete for the player's narrative attention** — the UI/copy layer should
occasionally say "Your Body mastery is close to surpassing your Mind
mastery" — because *rivalry with yourself* is a motivational loop humans
respond to strongly, and it costs nothing extra architecturally once
per-track ledgers exist.

### 2.4 Identity / Player Expression → **The Sanctuary**

**Feeling:** a place that is *yours*. Not a settings page — a personal space
in the world (a garden, a study, a camp — thematically fits "adventure
RPG") that visibly changes as you play: plants that grow with Body-quest
streaks, books that appear on a shelf for Mind achievements, a collection
case for Codex entries, a companion animal that levels up alongside you.

**Mechanics:** this is the single richest payoff of building the Inventory
Engine, and it reframes *why* to build it. Inventory wasn't just "the
missing primitive for a store" — it's the mechanism that makes every reward
in the game **displayable and arrangeable**, which is what turns "I have 40
badges" into "look at my garden." Equipment slots aren't just "gear for
combat" (HABBIT has no combat) — they're **display slots**: an equipped
title, an equipped companion, a featured badge. The same Inventory schema
serves both a future Marketplace *and* today's emotional need for a
personal space, and the Sanctuary should exist well before Marketplace does,
because it's pure payoff with no monetization complexity attached.

### 2.5 Social Belonging → **Guilds as Micro-Cultures, not Leaderboards**

**Feeling:** leaderboards produce *competition anxiety* for most players and
motivation for a few. Belonging produces motivation for nearly everyone.
The design goal for Guilds should explicitly not be "compete with your
guild" but **"build something with your guild that outlives any one
person's bad week."**

**Mechanics:** a Guild has its own Mastery Track (guild-level Discovery
Codex — "our guild has collectively found 340 unique things"), fed by
member contributions the same way World Events are (per-member contribution
ledgers, per the prior review's fix to `WorldEventProgress`). Guild identity
should be expressible — a guild banner built from members' equipped
Sanctuary items, a guild "expedition" (a multi-week co-op quest chain the
whole guild advances together, visible as a shared map that fills in).
This is precisely why the Actor abstraction (player OR guild as the owner
of ledgers/quests/inventory) from the last review is not just clean
architecture — it's the *only* way a guild can meaningfully "own" a shared
Codex, a shared Mastery Track, and a shared Expedition without every one of
those becoming a bespoke one-off system.

### 2.6 Ritual → **The Return, not just the Streak**

**Feeling:** a streak number is a countdown to failure. A **ritual** is a
small ceremony that feels good to repeat, whether or not you're "still
counting." Duolingo's genius is treating the streak as sacred; HABBIT's
opportunity is treating the *daily return itself* — not just the unbroken
count — as the ritual.

**Mechanics:** the previous review correctly split Streaks out of
Progression into an Engagement Engine. The design addition here: the daily
reset shouldn't just regenerate quests — it should stage a small **"Dawn
Moment"**: a one-line world-flavor text tied to `WorldState` (weather,
season, guild news, a Codex near-completion nudge — "you're one Discovery
away from completing the Autumn collection"), shown once, at the first
open of the day, before quests even render. This costs almost nothing
architecturally (Engagement Engine already owns the daily-reset moment; it
just also composes a short read-model from WorldState + Codex progress +
Guild news) and is disproportionately valuable to the feeling of "this
world exists and thought about me overnight."

### 2.7 Mystery → **Rumors and Foreshadowing**

**Feeling:** knowing something is coming, without knowing what.

**Mechanics:** LiveOps' Content Platform draft/review pipeline (from the
prior review) has an underused superpower: a `ContentDefinition` in
`status: 'scheduled'` with a future `activeFrom` is *already* a thing the
system knows about before players can access it. The design use: let NPCs
or the Dawn Moment reference scheduled-but-not-yet-active content
obliquely ("the librarian mentions strange lights over the eastern hills
lately...") days before a World Event with that theme goes live. This is
zero new infrastructure — it's a **narrative read** against data that
already exists for operational reasons, repurposed for anticipation. This
is exactly the kind of "systems interact to create meaning that neither
system intended alone" the brief is asking for.

### 2.8 Emergent Gameplay → **Reputation and Faction Standing**

**Feeling:** the world reacts differently to who you've become, not just
what you've done today.

**Mechanics:** a `Reputation` ledger (same append-only pattern as XP/
currency — this is now the *third* time the ledger pattern has been the
right answer, which says something about how load-bearing that one pattern
is) per Faction (e.g., "The Wanderer's Guild," "The Quiet Library," a
handful of in-world factions tied loosely to the three Realms but not
identical to them). Reputation gates *dialogue*, not just rewards — an NPC
with high reputation offers a different quest chain branch, references past
interactions, eventually offers a **Companion** as a relationship
milestone, not a purchase. This is where **Narrative Engine + NPC state +
Reputation + Quest Engine** genuinely interlock: a quest chain's next
chapter should sometimes be *chosen by the system* based on which faction
you've favored, not by the player picking from a menu. That's what makes it
feel like the world is responding to *you specifically*, not serving you a
predetermined story with your name inserted.

### 2.9 Long-term Motivation → **Seasons as Chapters, not Resets**

**Feeling:** a season shouldn't feel like "the old stuff got taken away and
new stuff appeared." It should feel like **turning a page** — last season's
Codex entries stay in your Sanctuary forever; last season's guild
Expedition map stays visible as a completed memory; only the *active*
opportunities rotate.

**Mechanics:** this is a policy decision more than a new system — LiveOps'
Season/Rotation engine (from the prior review) needs an explicit rule:
**nothing a player earned is ever hidden or devalued by a season ending.**
Battle Pass tracks reset (that's the mechanic), but Codex entries,
Sanctuary items, Reputation, and Mastery Tracks are permanent. This
architectural commitment (append-only ledgers, never deleted, never
"season-scoped" for anything that was actually *earned* rather than
rented) is what separates "engaging live-service" from "engagement-metric
treadmill," and it should be a stated design law, not an emergent property
of whatever each engine happens to do.

---

## 3. The interconnected-loops map (narrative version, before the formal graph)

```
Weather/Time (Living World)
   → weights Quest generation (Discovery pool especially)
   → flavors the Dawn Moment ritual text

Quest completion
   → advances Realm Mastery Track (Progression)
   → advances Codex entry (Inventory, first-time only)
   → advances Faction Reputation (if quest tagged to a faction)
   → advances Guild Expedition (if quest is guild-flagged)
   → feeds Analytics' difficulty signal
   → feeds World Event contribution (if one is active)

Codex progress
   → unlocks Sanctuary display items
   → triggers dynamic-rarity promotion of new Discovery content
   → feeds the Dawn Moment ("one away from completing...")

Faction Reputation
   → branches NPC dialogue
   → unlocks Companion relationship milestones
   → unlocks faction-specific quest chain branches (Narrative Engine)

Guild Expedition progress
   → visible to all members as a shared, filling-in map
   → can unlock a Guild-wide Codex bonus or seasonal cosmetic

Season transition
   → archives (never deletes) the current Battle Pass track
   → keeps Codex/Sanctuary/Reputation/Mastery fully intact
   → seeds next season's Rumors via scheduled-but-inactive content

AI Services (quest/NPC dialogue generation)
   → drafts land in Content Platform as 'draft'
   → human/policy review promotes to 'scheduled' or 'active'
   → once active, participates in every loop above exactly like
     hand-authored content — the player can never tell the difference,
     which is the entire point
```

This is what "interconnected systems, not isolated modules" looks like in
practice: **almost nothing above required a new kind of dependency the
prior engineering review didn't already anticipate** (events, ledgers,
Content Registry, Actor abstraction). What changed is which events carry
narrative weight and which read-models get composed from them — proof that
the engineering foundation from the last two passes was sound; it just
needed to be pointed at feeling, not just correctness.

---

## 4. Formal system interaction map

Legend: **sync** = caller blocks on an authoritative response (must be
strongly consistent, e.g. spending currency). **async** = event-driven,
eventually consistent. **read** = queries another system's data without
owning or mutating it. **own** = the arrow's target is authoritative for
that data; nothing else may write it.

| # | From → To | Why it exists | Data owner | Events crossing | Sync/Async | Read/Own | Future distributed service? |
|---|---|---|---|---|---|---|---|
| 1 | Living World → Quest Engine | Weather/time/season should shape which quests are offered | Living World owns `WorldState`; Quest owns selection | `WorldStateChanged` (weather/season shifts) | Async (Quest reads latest `WorldState` at generation time) | Read | Yes — World simulation is CPU-light but latency-sensitive for "is it dawn right now"; a small dedicated service per region is natural at scale |
| 2 | Quest Engine → Verification Engine | A submission needs judging before it can complete | Quest owns assignment state; Verification owns judgment | `QuestSubmissionReceived` → `SubmissionVerified` | Async (already true today) | Ownership handoff, not a read | Yes — already the most "worker pool" shaped engine; first candidate for its own deployable |
| 3 | Verification Engine → Quest Engine | A verdict must advance or fail the assignment | Quest owns the state transition | `SubmissionVerified` | Async | Ownership handoff | Same service pair as #2 |
| 4 | Quest Engine → Progression Engine | Completing a quest earns XP on one or more tracks (account + realm) | Progression owns all XP ledgers | `QuestCompleted` | Async | Ownership handoff (Progression writes; Quest never touches XP tables) | Progression's ledger-write path is the hottest write path in the whole system at scale — strong candidate for its own service + dedicated DB early |
| 5 | Quest Engine → Inventory Engine | First-time Discovery completion grants a permanent Codex entry | Inventory owns all ownership records | `QuestCompleted` (with `firstTimeCompletion: true`) | Async | Ownership handoff | Yes — inventory/trade integrity wants isolation for the same reason Steam isolates it |
| 6 | Quest Engine → Reputation (new, sits near Progression) | Faction-tagged quests move standing | Reputation owns faction ledgers | `QuestCompleted` (with `factionId`) | Async | Ownership handoff | Could stay co-located with Progression; same ledger shape, low volume |
| 7 | Quest Engine → World Events / Guild Expeditions | A completion may count toward an active communal goal | World Events/Guild own contribution ledgers | `QuestCompleted` | Async | Ownership handoff | World Events likely regional — natural sharding boundary for multi-region |
| 8 | Progression Engine → Achievement Engine | Level-ups and track milestones can unlock achievements | Achievement owns unlock records | `LevelUp`, `TierPromoted` | Async | Read (Achievement reads a stats snapshot; doesn't touch Progression's ledger) | Achievement's inverted-index evaluation is CPU-bound, not I/O-bound — good horizontal-scale candidate |
| 9 | Reputation → Narrative Engine | Standing gates which dialogue/chain branch is offered | Narrative owns dialogue/branch state | (read, not event-driven — Narrative queries current standing when composing a conversation) | **Sync read** at conversation-start time only | Read | Narrative's read of Reputation should be a cached snapshot, not a live cross-service call, once these are physically separate |
| 10 | Codex (Inventory) → Sanctuary display | Owned items need to be arrangeable/visible | Inventory owns items; Sanctuary is a read-model/UI composition, not a new owner | (read) | Sync read (it's a profile page) | Read | Sanctuary is presentation, never its own service — it's a view over Inventory + Progression + Achievement |
| 11 | Guild Engine → LiveOps (World Events/Seasons) | Guild-wide goals should be able to unlock seasonal content early or exclusively | LiveOps owns season/event activation | `GuildMilestoneReached` | Async | Read (LiveOps reads guild milestone state to decide activation) | Guild and LiveOps both regional-shardable; keep the event contract stable so they can be split independently |
| 12 | AI Services → Content Platform | AI-drafted quests/dialogue must enter the same review pipeline as human content | Content Platform owns all content state incl. drafts | `ContentDraftSubmitted` → (review) → `ContentPublished` | Async | Ownership handoff | AI Services is naturally its own deployable already (different scaling shape — bursty, GPU/API-bound) |
| 13 | Content Platform → every gameplay engine | All engines read quest/achievement/season/NPC definitions from here | Content Platform owns definitions | (read, cached aggressively) | Sync read, heavily cached | Read | Content Platform is the one system every other engine depends on — it should be the *first* thing given a dedicated read-replica/CDN-style cache layer, because its read volume dwarfs everything else combined |
| 14 | Analytics/Telemetry → (everything, read-only) | Tuning signals and behavioral data come from watching, not participating | Analytics owns derived stats only | (subscribes to all events) | Async, off the durable outbox relay, never in the gameplay-blocking path | Read | Should be its own service from day one of building it for real — this is the one place where "never let it slow down gameplay" is a hard requirement, not a nice-to-have |
| 15 | Trust & Safety → Identity, Verification | Suspicious behavior across engines should be able to force a suspension or force manual review | Trust & Safety owns trust scores; Identity owns account state; Verification owns review-queue state | `TrustSignalRaised` | Async, but the *action* it triggers (suspend) should be treated as high-priority/low-latency even though the detection is async | Ownership handoff for the trust score itself; **acts on** Identity/Verification via events, never writes their tables directly | Yes — this is exactly the kind of cross-cutting service that benefits from being separate and specialized (similar shape to a fraud-detection service in any large platform) |
| 16 | Economy ↔ Inventory (Marketplace purchase) | Buying an item must atomically move currency and grant the item | Economy owns currency; Inventory owns items | `CurrencySpent`, `ItemGranted` (both must succeed or the purchase is rolled back — see note) | **Sync** for the transaction itself (Marketplace orchestrates a two-phase call), **async** for downstream reactions | Ownership handoff for both | This pair needs the most careful consistency design in the whole system — see §5 |

**Note on #16** — this is the one place in the whole map where "just use
events and eventual consistency" is the wrong answer, and it's worth being
explicit about why, since everything else in this document has celebrated
async decoupling: a player must never be charged without receiving the
item, and must never receive the item for free because a downstream event
was dropped. Marketplace should call Economy's `spend()` and Inventory's
`grant()` inside one explicit saga (or, at current scale, one database
transaction if Economy and Inventory still share a physical database) with
compensating rollback on partial failure — not "fire CurrencySpent and hope
Inventory's listener eventually grants the item." This is the single
exception to "everything is async events" in this entire document, and it
should stay an explicit, named exception, not something later engineers
have to rediscover the hard way.

---

## 5. The final challenge: if I started today, with nothing built

**Would the engine-and-event-bus shape survive a from-scratch rebuild?**
Yes — and I want to be precise about *why*, rather than defending it out of
inertia. The alternative shapes worth seriously considering and rejecting:

- **A single monolithic "GameState" service with one big state machine.**
  This is genuinely how some smaller live-service games start (and it's not
  wrong for the first six months of a startup). It fails HABBIT specifically
  because the five-year list — Guilds, Marketplace, AI content, multi-region
  — needs independently scalable, independently deployable pieces, and
  retrofitting boundaries into a monolith is far more painful than the
  reverse. **Rejected, correctly, by every prior pass.**
- **Pure microservices from day one, one service per noun (User Service,
  Quest Service, Item Service...).** This is the "Riot-style" extreme. It's
  *architecturally* appealing but operationally wrong for HABBIT's actual
  current stage — a handful of engineers do not want to operate twenty
  deployables, twenty databases, and a service mesh before there are enough
  users to need it. The engine-module-in-one-deployable shape (what exists
  today) gives the *logical* isolation (separate schemas, event-only
  communication, no cross-engine imports) that makes the *physical* split
  into real services a later, low-drama migration — each row in §4's "future
  distributed service?" column becomes a service extraction, not a rewrite,
  specifically because the boundaries were already honest. **This is the
  correct choice and I would make it again.**
- **Event sourcing as the primary persistence model everywhere** (every
  engine derives all state by replaying its event log, no direct table
  writes). This is genuinely attractive for a "world with history and
  memory" — it would make "what did this player's world look like on this
  date" trivially answerable, which is a real emotional/narrative feature
  (imagine a "look back at your journey" year-in-review). But full event
  sourcing for *every* engine is a large operational cost (snapshotting,
  replay performance, schema evolution of events themselves) for benefit
  that only a few systems actually need. **The right middle ground, which I
  would design in from day one this time rather than retrofit:** keep
  normal table-based state for engines that don't need history-as-a-feature
  (Verification, Achievement's unlock records), but make the **ledger
  pattern** (already used for XP, currency, and now Reputation) the
  *explicit, named* lightweight event-sourcing lane — because a ledger *is*
  a restricted, single-purpose event log, and three separate engines
  independently converging on the same pattern is a strong signal it should
  be a named, reusable Core primitive (`AppendOnlyLedger<T>`) rather than
  three parallel implementations. This is a genuine gap in every prior
  pass — the pattern was repeatedly rediscovered instead of built once.
- **A generic "Entity-Component" model for all game objects** (the way many
  actual game engines model NPCs, items, players, guilds as component bags)
  instead of named domain tables per concept. This is tempting given how
  many "owned, leveled, equippable" concepts have emerged (players, guilds,
  companions, possibly NPCs-as-relationship-objects). I considered
  recommending it and am rejecting it: ECS earns its complexity when you
  need runtime composition of arbitrary behavior on arbitrary objects (a
  real-time game engine's actual entities). HABBIT's "entities" are a small,
  known, slowly-growing set (Player, Guild, Companion, NPC) — modeling them
  as the Actor abstraction plus a handful of named tables is simpler to
  reason about, simpler to query, and loses almost nothing, because the
  *behavioral* variation HABBIT actually needs (what quests can this Actor
  receive, what can this Actor equip) is already served by the Content
  Registry's data-driven definitions, not by needing components-at-runtime.
  **Rejected — the complexity isn't earned here.**

**What I would change, starting fresh, that the prior passes didn't get to:**

1. **Name the ledger pattern as a first-class Core primitive on day one**,
   instead of discovering it three separate times (XP, Currency, now
   Reputation). This is the clearest "I would do this differently" finding
   in this whole review.
2. **Build Living World and the Dawn Moment ritual composition *before*
   Guilds or Marketplace**, not after. The prior reviews correctly sequenced
   by engineering leverage (Actor abstraction, Content table split,
   Inventory) — this pass adds that **feeling-leverage** should weight the
   sequencing too: Living World + Dawn Moment + Codex are cheap, don't
   depend on Inventory/Guild being fully built, and are the highest
   emotional-return-per-engineering-hour items in the entire five-year list.
   They should move earlier in the phased plan, not wait for "foundational"
   work that a player will never directly perceive.
3. **Treat the Content Platform's draft/review pipeline as a narrative tool
   from the start** (§2.7's Rumors mechanic), not just a safety mechanism
   for AI content. This costs nothing extra to build once the pipeline
   exists — it was simply not imagined as a feature in the purely
   engineering-driven review, which is exactly the blind spot this pass
   exists to correct.
4. **Make "nothing earned is ever taken away" an explicit, written law**
   (§2.9), not an inferred property of using append-only ledgers. The
   engineering pattern already protects this; the *product* commitment
   needs to be stated so no future feature (a season reset, a rebalance) is
   ever built casually in a way that violates it.

**What I would not change:** the engine boundaries themselves, the
event-only communication rule, the Actor abstraction, the Content Registry
split, and the Inventory-as-missing-primitive finding from the prior
review. Those were derived from the right question ("what are the actual
consistency and ownership boundaries") and re-deriving them from the
feeling-first question in this pass landed in the same place — which is
itself the useful confirmation: **a world-shaped architecture and a
correctly-engineered architecture turned out to be the same architecture.**
The feeling-first pass didn't overturn the structure; it told me which
parts of the structure to build first, and named one real gap (the ledger
primitive) and one real opportunity (Rumors, for free) that pure
engineering reasoning had no way to surface on its own.
