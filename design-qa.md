# Design QA

- Source visual truth: user-provided Quest dashboard reference image in the current conversation
- Implementation screenshot: `/tmp/quests-reference-final3.png`
- Viewport: 944 x 1672 CSS px
- Source pixels: 944 x 1672
- Implementation pixels: 944 x 1672
- Density normalization: both artifacts compared at 1x and equal pixel dimensions
- State: Quest page, Daily tab, populated local development identity
- Primary interactions represented: cadence tabs, quest selection rows, accept-quest actions, header actions, and navigation remain live
- Console/runtime check: page and all API-backed regions rendered without an error state; production build and automated tests are recorded separately

## Full-view comparison evidence

The final implementation capture reproduces the reference's vertical composition at the same 944 x 1672 frame:

- profile/header block
- illustrated focus hero
- four-part cadence control
- active-quest list with two-card progression rail
- three-column available-quest grid
- fixed five-item bottom navigation

The generated scholar artwork has the same right-weighted character placement, dark mountain-city setting, green cloak, and warm antique-gold lighting as the source. App text remains live rather than rasterized.

## Focused region comparison evidence

- Hero: right-aligned scholar, left-side circular progress emblem, central objective copy, and lower-right dialogue card all remain readable without collision.
- Quest content: active rows retain the source's emblem/copy/progress/reward hierarchy; progression cards remain aligned in the right rail.
- Lower frame: all three available cards and their Accept Quest actions appear above the fixed navigation at the target viewport.

## Required fidelity surfaces

- Fonts and typography: Cormorant Garamond provides the high-contrast fantasy display voice; Manrope remains limited to functional supporting text. Hierarchy and wrapping are stable at the target viewport.
- Spacing and layout rhythm: the target's header, hero, tabs, two-column content region, available cards, and fixed navigation all fit within the same frame.
- Colors and visual tokens: deep blue-black, warm cream, and antique gold closely track the supplied reference.
- Image quality and asset fidelity: the prior CSS-drawn figure was replaced with a dedicated high-resolution painted scholar/city asset. The final crop is sharp and correctly weighted.
- Copy and content: structure matches the reference while player values and quest content remain backed by the app's real local state.

## Comparison history

1. Initial capture: blocked by an incorrect local API target.
   - Fix: pointed Vite at the documented `127.0.0.1:3001` development API.
2. Second capture: blocked by authentication/onboarding state.
   - Fix: enabled the documented development identity, completed local-only onboarding, and generated local sample quests.
3. First populated comparison:
   - P1: shared development banner and top bar appeared above the Quest design.
   - P2: excess shell height pushed Available Quests below the target frame.
   - Fix: hid shared shell chrome only when `.quest-reference` is active and constrained the Quest surface to the reference width.
4. Second populated comparison:
   - P2: hero height and available-card density remained too tall; dialogue card was missing at the target width.
   - Fix: tightened the hero and cards and restored the lower-right dialogue card.
5. Final comparison: `/tmp/quests-reference-final3.png`
   - No remaining actionable P0, P1, or P2 differences.

## Follow-up polish

- P3: live local quest titles and zero-progress values intentionally differ from the static sample data in the reference.
- P3: generated character art is an original close match rather than a pixel-identical copy of the source character.

final result: passed

## Cross-app theme extension

The Quest visual system was subsequently extended across the rest of the application.

- Home desktop/tablet: `/tmp/theme-home.png`
- Home mobile: `/tmp/home-mobile-final.png`
- Guild: `/tmp/theme-guild.png`
- Rewards: `/tmp/theme-rewards.png`
- Gallery: `/tmp/gallery-final.png`
- Profile desktop/tablet: `/tmp/theme-profile.png`
- Profile mobile: `/tmp/profile-mobile.png`

Verified shared surfaces:

- dark blue-black engraved panels and antique-gold borders
- Cormorant display hierarchy and muted cream supporting text
- six-state shared navigation including Gallery
- single-column mobile dashboard reflow
- generated scholar artwork reused consistently in Quest, Profile, and Landing
- dark themed forms, dialogs, filters, empty states, quest details, and feedback surfaces

Cross-app final result: passed

## Dashboard reference rebuild

- Source visual truth: user-provided Quest dashboard reference image in the current conversation
- Previous Dashboard evidence: user-provided 551 x 892 render
- Rebuilt Dashboard mobile evidence: `/tmp/dashboard-reference-pass1.png`
- Rebuilt Dashboard full-frame evidence: `/tmp/dashboard-reference-final.png`
- Comparison viewport: 944 x 1672 CSS px at 1x

The old parchment-style Home card stack was replaced with the reference composition:

- player medallion header and action orbits
- painted scholar focus hero
- circular quest-progress emblem
- central objective/progress copy
- lower-right character dialogue
- four-segment shortcut strip
- dense active-quest list and progression rail
- full-width ornate overview panel
- fixed shared navigation

Live quest, XP, level, streak, and rank data remain connected. Quest rows open the existing actionable detail dialog, and all shortcut and progression actions navigate to real routes.

Dashboard final result: passed

### Native mobile readability correction

- User-reported narrow render: 551 x 892
- Corrected native-width Dashboard evidence: `/tmp/dashboard-native-mobile.png`

The narrow Dashboard no longer scales a 944px desktop canvas. It now composes
directly at the phone viewport width, with a 42px page title, 48px feature
title, 20px section titles, and readable supporting text. The hero, active
quests, progression cards, overview, and five-item navigation retain the
reference hierarchy without horizontal overflow.

## Rewards reference rebuild

- Source visual truth: user-provided Rewards dashboard reference image in the current conversation
- Full-frame evidence: `/tmp/rewards-reference-full.png`
- Native-width readable evidence: `/tmp/rewards-native-mobile.png`
- Comparison viewports: 944 x 1672 and 551 x 892

Verified reference structure:

- player header and action orbits
- generated black-iron and antique-gold season chest hero
- presenting scholar character and dialogue card
- reward track and badge panels
- rare loot and chest collection panels
- claimable rewards and current rank panels
- five-item Rewards-active navigation

XP, level, rank, badge, collectible, rarity, and chest counts are derived from live app state. Inventory, reward-claiming, and leaderboard actions return explicit unavailable notices because those backend operations do not exist.

Rewards final result: passed

### Rewards mobile typography gate

At 551 CSS pixels, browser inspection confirmed:

- document width: 551px; scroll width: 551px
- page heading: 42.4px
- vault statement: 43.2px
- panel headings: 20px
- navigation and panel actions: 16px
- supporting labels: 14.4px or larger

The Rewards lower grid changes to a single column on phones, removing the
source of the miniature two-column text while preserving the visual order and
ornate card treatment. Primary navigation and Quest cadence controls were
rechecked in the running app.

Mobile readability final result: passed

## Compact mobile height correction

- User-reported viewport: approximately 410 x 844
- Corrected evidence: `/tmp/dashboard-compact-mobile.png`
- Header height: 123px
- Focus hero height: 430px
- Shortcut strip height: 61px
- Horizontal overflow: none

The dialogue is now overlaid within the bottom of the hero instead of adding a
separate grid row. Header spacing, progress emblem, feature copy, and shortcut
height were tightened without reintroducing scaled or miniature typography.
The first Active Quests card is visible in the initial phone viewport.

Compact mobile final result: passed

## Phone Quest-board hierarchy

- Corrected evidence: `/tmp/quests-phone-board.png`
- Comparison viewport: 410 x 844
- Repeated Quest hero: removed on phone
- Player header height: 113px
- Cadence tabs height: 58px
- Active Quests begins: 189px from viewport top
- Horizontal overflow: none

The cinematic focus hero remains on Dashboard, where it communicates the
current focus. Quests now opens directly into cadence selection and real active
quest controls, avoiding duplicated artwork and shortening the main workflow.
Available quests remain a readable horizontal card rail below progression.

Phone Quest hierarchy final result: passed

## Interactive Quest Deck — selected concept 3

- Visual target: third displayed ImageGen direction from the latest ideation set
- Target image: `/home/mrudula/.codex/generated_images/019f9d9a-eeeb-7771-a217-3c9bed9f0640/call_nAVjljrPwOFh6Uow8pVaO9lg.png`
- Implemented capture: `/tmp/quests-option3-implemented.png`
- Comparison viewport: 390 x 844

Verified visual structure:

- compact player identity and notification action
- four-part cadence selector
- foreground quest deck with visible next-card preview
- category emblem, large title, objective, progress, and XP
- primary Resume and secondary Details actions
- previous/next arrows and direct position dots
- concise Today summary
- horizontally scrollable Available Quests rail
- five-item Quests-active bottom navigation

Verified behavior:

- Next changed the foreground quest from Deep Work to Stretch Session
- direct deck position buttons are exposed with accessible quest names
- Resume and Details open the real QuestDetail dialog
- cadence controls remain real tabs backed by active quest data
- Available Quest acceptance uses the existing generation mutations
- no horizontal overflow or runtime error state at 390 x 844

Differences retained intentionally:

- P3: live quest titles, XP, and progress reflect current server state rather
  than the concept's illustrative sample data.
- P3: existing app icon assets are retained instead of copying ornamental
  concept symbols literally.

Interactive Quest Deck final result: passed
