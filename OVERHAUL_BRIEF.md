# Quests — Full Product UI + Motion + Interaction Overhaul

## Session handoff
Scoped in a prior session that ran from the wrong directory. Two decisions were locked
by the user there; treat them as settled:

1. **Work happens in this repo** (`/home/mrudula/Downloads/HABBIT/quests`,
   branch `wild-realm-alignment`).
2. **Wild Realm blueprint features are IN SCOPE** — not just visual reference.
   Implement blueprint systems (capture/camera pipeline, rarity engine, seasons,
   chests/events, community, verification) alongside the UI/motion/interaction work.
   The blueprint PDF ("Wild Realm Blueprint v2", 34pp, author: Sam) is the build
   contract and the single source of truth. Ask the user to re-attach it — it is not
   in the repo.

## Do this first
The branch is already mid-stream. Recent commits show blueprint work landing:
rarity data in discovery card/collection/rewards, explore hotspots from real capture
locations, coin wallet + community SQL, desktop layout + visual audit corrections.

So: **audit before building.** Read `src/wild-realm.css`, `src/components/motion/`,
`design-qa.md`, `docs/`, and the feature dirs under `src/features/` (auth, gallery,
guild, onboarding, profile, quests, rewards, world). Establish what already exists
before creating anything new. Reuse existing primitives; refactor only where they
actively block quality.

## Stack
React 18 + Vite, react-router-dom 6, framer-motion 12, @tanstack/react-query 5,
three + @react-three/fiber, lucide-react, Supabase + Express/pg backend,
Capacitor 8 (Android), zod. Fonts: Cormorant Garamond + Manrope.
~72 source files under `src/`. Also: `api/`, `server/`, `db/`, `mobile_flutter/`,
`android/`, `scripts/`.

## Identity — preserve, elevate
Dark Wild Realm / nature-exploration questing. Forest tones, amber/gold accents,
atmospheric surfaces, XP, realms (Mind/Body/Discovery), rarity, game-like progression.
NOT a generic SaaS dashboard. The result should read as obsessively crafted, not
generated from a component library.

## Blueprint anchors (from the PDF — reconfirm against the document)
- Element canonical name is **Sky** in code; "Air"/"Wind" is display-only art copy.
- Six Explorer Tiers: Bronze -> Silver -> Gold -> Platinum -> Diamond -> Adamantium,
  sub-levels I-V. No "Master".
- 5 destinations, Capture as raised center FAB. Map lives inside Community/Explore,
  not a root tab.
- Rarity: 0-100 score -> D/C/B/A/S. stars = clamp(round(score/20), 1, 5).
  A and S require human verification (minted provisional until approved).
- Grade -> XP/coins: D 50/5, C 120/15, B 250/40, A 500/100, S 850/250.
- Rarity weights and grade bands MUST be live-tunable config, never constants.
  Persist weightSetVersion on each Discovery.
- Server is authoritative for all XP, coins, grades, quest claims. Client never asserts.
- Coin wallet is an append-only Transactions ledger, not a mutable balance field.
- captureId is the end-to-end idempotency key.
- Sensitive-species coordinate obfuscation is server-enforced.

## Work in passes — render and inspect after each
1. App shell + navigation + responsive foundation
2. Quest board + cards + swipe deck
3. Quest detail + completion + XP
4. Profile + progression + achievements
5. Settings + secondary flows
6. Modals + sheets + forms + keyboard
7. Loading + empty + error states
8. Motion polish
9. Cross-device responsive QA
10. Final visual polish

Do not endlessly polish details while layout problems remain.

## Motion system
Build a coherent motion language on shared primitives, not per-component one-offs.
Use existing tokens in `src/components/motion/` where they exist.
Micro ~100-180ms (tap, toggle) | Quick ~180-280ms (cards) |
Standard ~280-450ms (nav, panels) | Considered ~450-700ms (sheets) |
Reward ~600-1200ms (XP, completion, level-up).

Principles: cause, continuity, hierarchy, weight, direction, reward.
Do not animate everything — if everything moves, nothing matters.

## Mobile
Mobile is not a reduced desktop. Bottom dock must feel like a physical control
surface: fixed, safe-area aware, tactile press, elevated center action, no clipping,
stable across widths. Use env(safe-area-inset-*) and dynamic viewport units.
Test 320x568, 360x800, 375x812, 390x844, 393x852, 414x896, 430x932,
landscape 844x390 / 932x430, desktop 1280x720 / 1440x900 / 1920x1080.

## Guardrails
- Respect `prefers-reduced-motion` — reduce movement, don't destroy the interface.
- Keyboard nav, focus states, screen-reader semantics, contrast, touch targets.
- Performance: prefer transform/opacity. Audit blur, backdrop-filter, large shadows,
  continuous animation, scroll/resize listeners, React re-renders.
  60fps interaction beats decorative eye candy — if an effect costs smooth scrolling,
  remove it.
- No particles everywhere, no glow on everything, no gratuitous 3D or parallax.
  The best moments stand out because the rest is controlled.

## Done means
One coherent world. Navigation connected. Quests tactile. Completion rewarding.
Progression meaningful. Mobile intentional. Desktop spacious. Motion physical.
Not "it compiles and buttons animate."

## Final report
Product changes | Visual changes | Motion system | Mobile | Architecture |
Performance | Accessibility | Testing (viewports + flows) | Genuine remaining issues.
