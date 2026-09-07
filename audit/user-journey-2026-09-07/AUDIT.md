# Wild Realm mobile user-journey audit

Viewport: 390 × 844. Audited from a fresh guest entry on 2026-09-07.

## Flow health

1. **Sign up — healthy after correction.** The cinematic background, compact panel, readable provider actions, password visibility control, and guest route fit the viewport without horizontal overflow. Evidence: `01-sign-up.png`.
2. **Map entry — improved, with an external-tile limit.** Search and core navigation are clear. The web-only step button was a dead control and is now hidden; native builds retain the real pedometer. A photographic fallback now prevents an empty grid when OpenStreetMap tiles are slow or unavailable. Evidence: `02-app-entry.png`, `15-map-final.png`.
3. **Quests — corrected.** The completed card had dark text on a nearly black surface. Contrast is restored. Generic personal-habit copy was replaced in the guest journey with local observation, landmark-loop, and golden-hour exploration quests. Evidence: `03-quests.png`, `10-quests-fixed.png`.
4. **Library — healthy, one continuity gap retained.** Cards, filters, sort, and collection hierarchy are usable. Guest capture XP no longer incorrectly reports zero when legacy fixtures omit an explicit XP field. A dedicated before/after photo-revisit experience remains future work. Evidence: `04-library.png`.
5. **Community feed — healthy.** Stories, profiles, reactions, comments, reporting, and sharing are discoverable. The first viewport prioritizes visual discoveries and social proof without competing CTAs. Evidence: `05-community.png`.
6. **Story progression — corrected.** Previous/next actions worked semantically but were invisible. They now use visible, high-contrast chevron controls while swipe navigation remains available. Evidence: `06-story.png`, `07-story-next.png`, `11-story-fixed.png`.
7. **Profile — corrected.** The fixed-height app shell clipped the rarity breakdown and menu, creating a large apparent dead area. Profile now owns vertical scrolling and leaves room above the persistent dock. Evidence: `08-profile.png`, `12-profile-fixed.png`.
8. **Settings — corrected structurally.** The modal now layers above the dock and retains an independent scroll body, preventing account/footer controls from being trapped behind navigation. Evidence: `09-settings.png`.
9. **Rewards — usable but too long.** Claimable status and progress are clear, and unavailable store actions are honestly disabled. The screen remains content-heavy and should eventually collapse lower-priority grade/inventory sections. Evidence: `14-rewards-stable.png`.

## Retention assessment

The strongest loop is now coherent: discover a nearby place → accept an exploration-specific quest → capture → keep it in Library → share/view stories → return via streak, saved places, rewards, or another outing. Public saves and hotspot ratings add lightweight commitment and social proof without requiring a heavy social graph.

Remaining structural retention opportunities:

- A real **photo revisit** card comparing the same place across dates or seasons.
- **Mini expeditions** with a defined start/end, participant privacy, and completion rule.
- **Seasonal collections** backed by server dates and capture taxonomy rather than decorative badges.
- A visible **Saved places** collection in the user's own profile; the public API exists, but the profile surface is not built yet.
- Push/reminder policy and notification preferences; retention should not depend on unconfigurable alerts.

## Accessibility limits

Screenshots and DOM inspection confirmed labels for major controls, readable reflow at the tested viewport, explicit disabled states, and visible story navigation. This does not prove WCAG conformance. Screen-reader order, switch semantics, focus trapping/restoration, keyboard-only use, 200% zoom, color contrast measurements, and physical-device touch behavior still need dedicated testing.
