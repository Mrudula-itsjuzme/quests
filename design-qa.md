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

### Narrow render correction

- User-reported narrow render: 551 x 892
- Corrected scaled-canvas evidence: `/tmp/dashboard-scaled-reference.png`

The narrow Dashboard now preserves the 944px reference composition and scales it proportionally rather than switching to a simplified mobile reflow. The hero, split quest/progression region, typography, artwork, and five-item navigation retain the same relative geometry. Lower-page cropping is expected because the supplied reference has a taller aspect ratio than the 551 x 892 render viewport; content remains scrollable and is not vertically distorted.

## Rewards reference rebuild

- Source visual truth: user-provided Rewards dashboard reference image in the current conversation
- Full-frame evidence: `/tmp/rewards-reference-full.png`
- Narrow scaled-canvas evidence: `/tmp/rewards-reference-narrow.png`
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
