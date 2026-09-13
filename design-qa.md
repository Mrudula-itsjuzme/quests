# Wild Realm mobile visual QA

- Source visual truth: user-supplied Library, Quests, Community, Map, and Camera screenshots in this task; the Browser Comment Library reference is 415 x 808 CSS pixels.
- Implementation URL: `http://127.0.0.1:5173`
- Viewport: 415 x 808 requested; browser reported 416 x 808 CSS pixels at device scale 1.
- State: guest profile, populated Library, Daily Quests, Community Feed, default Map, Camera Auto filter.
- Density normalization: compared as phone-screen captures at CSS scale; the one-pixel width difference is browser viewport rounding and was not treated as a design difference.

## Full-view comparison evidence

- Initial implementation: `/tmp/wild-realm-qa/library-current.png`
- Corrected Library: `/tmp/wild-realm-qa/library-corrected.png`
- Corrected Quests: `/tmp/wild-realm-qa/quests-fixed.png`
- Community: `/tmp/wild-realm-qa/community-current.png`
- Corrected Map: `/tmp/wild-realm-qa/map-fixed.png`
- Camera: `/tmp/wild-realm-qa/camera-current.png`

## Focused comparison evidence

Focused regions were evaluated in the full phone captures because the affected controls were readable at 1:1 CSS scale: Library header/archive/filter/sort/dock, Quests profile/cadence/cards, Map search/chips, Community tabs/post actions, and Camera badge/filter strip.

## Findings and comparison history

### Iteration 1 — blocked

- P1, persistent dock: a higher-specificity legacy rule forced a white dock while expedition rules forced inactive labels white, hiding four navigation destinations.
- P1, Quests profile: the same cascade mismatch produced white profile text on a white card.
- P1, Map search: white placeholder text rendered inside a white search field.
- P2, Library composition: the dark archive panel dominated the hierarchy, the full-width first card cropped the subject awkwardly, and the filter/sort spacing delayed collection content until y=494.
- P2, filters: the category rail still read as a bounded overflow slab instead of lightweight individual controls.

### Fixes applied

- Restored a warm light dock with dark inactive labels and forest-green active state using theme-specific selectors.
- Restored the Quests profile to a light, legible field card.
- Restored the Map search and category controls to light surfaces with a single green active chip.
- Reduced the archive panel from 132px to 104px and changed it from dark to a quiet cream/green field surface.
- Removed the forced full-width Library feature card and artificial stagger.
- Tightened header, filter, and sort spacing; removed the filter rail border/background.

### Iteration 2 — passed

- Typography: headings, metadata, and small controls are legible with consistent Manrope optical weights and no observed clipping.
- Spacing/layout: Library collection begins at y=455 instead of y=494; two-column cards match the reference rhythm and persistent controls remain visible.
- Colors/tokens: cream surfaces, forest-green active states, and restrained signal accents are consistent across the five screens.
- Image quality: existing real capture and map assets retain correct crop and sharpness; no placeholder or code-drawn assets were introduced.
- Copy/content: existing labels and profile-derived values are unchanged.
- Browser console: zero error or warning entries after the corrected Map capture.

### Iteration 3 — passed

- User evidence showed the earlier white-on-white Map search and inactive dock state in a stale hot-reload tab.
- Added explicit light/system/dark inactive-state guards so later theme selectors cannot restore white labels.
- Re-captured the exact Map route at 416 x 808: `/tmp/wild-realm-qa/map-visibility-guard.png`.
- Computed inactive dock labels are `rgb(64, 61, 53)` and the placeholder is `rgb(98, 93, 82)` on the cream surfaces.

## Implementation checklist

- [x] Correct dock contrast and visibility.
- [x] Correct Quests profile contrast.
- [x] Correct Map search/filter contrast.
- [x] Restore compact Library hierarchy and card grid.
- [x] Preserve Camera controls and filter sizing.
- [x] Verify Community post and action visibility.

final result: passed

### Iteration 5 — selected Library deck + Community photo feed, passed

- Accepted visual target: `/home/mrudula/.codex/generated_images/01a09419-d3cf-7601-98b0-24f8f6aa2b49/exec-9b4da771-92c4-4cf5-89ae-7ba8225c3972.png`.
- Implemented the selected Library direction as a layered three-card deck with a dominant real capture, slim real collection progress, lightweight category rail, compact XP, and understated sort controls.
- Implemented the selected Community direction as a full-width photographic stream with open author/rank metadata, underline navigation, integrated reactions, and a compact compose action.
- Motion uses a 380ms spring-like deck settle, 180ms selection indicators, 260ms feed entry, direct press feedback, and complete reduced-motion fallbacks.
- Exact viewport: 415 x 808 requested; browser reported 416 x 808 with document `scrollWidth` equal to `clientWidth`.
- Rendered evidence: `/tmp/wild-realm-qa/library-deck-final.png` and `/tmp/wild-realm-qa/community-photo-final.png`.
- Direct `view_image` comparison covered hierarchy, type, palette, image crop, open-vs-card container model, deck overlap, tabs, progress, rank metadata, dock clearance, and responsive overflow.
- Above-the-fold copy diff: no new marketing copy or decorative labels; functional route, filter, sort, rank, and content labels are preserved.
- Core interaction path verified through the existing Library filter/sort/card handlers and Community tab/post handlers; API-backed populated states rendered with zero browser warnings or errors.

final result: passed

### Iteration 4 — game UI and copy pass, passed

- Replaced decorative product language with direct labels: `My Library`, `Collection progress`, `Community`, and `See what people found nearby.`
- Standardized Library, Quests, and Community UI typography on Inter with 800-weight screen and content headings.
- Turned the Library filters into a complete two-row grid at phone width; no category or sort control is clipped and document width remains 416 CSS pixels.
- Strengthened game state using real data already on screen: rank/XP, quest completion, rarity stars, collection counts, and explorer rank badges. No fake score or streak was added.
- Rebuilt Quests around one highlighted daily mission followed by compact secondary missions; profile data and quest actions still use the existing queries and handlers.
- Rebuilt Community as an image-led feed with a compact centered mode switch and visible explorer rank treatment.
- Exact-size captures: `/tmp/wild-realm-qa/quests-final-v2.png`, `/tmp/wild-realm-qa/library-final-v2.png`, `/tmp/wild-realm-qa/community-final-v2.png`.
- Compared the current renders directly against the user-provided 415 x 808 Quests and Library screenshots with `view_image`; checked copy, font hierarchy, color, overflow, card rhythm, media crop, and dock clearance.
- Above-the-fold copy diff: intentional removal of `Field collection`, `Field archive`, and the generated `Field network / Stories from outside` copy; navigation and action labels are unchanged.
- Core interactions remain wired: cadence tabs, quest selection/actions, Library filters/sorts/search, Community tabs/posts, and the persistent Camera action.

final result: passed
