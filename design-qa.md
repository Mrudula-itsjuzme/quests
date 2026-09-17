# Wild Realm reference UI review

## Outcome

The reference layout has been substantially implemented and checked in a 393 × 852 phone viewport. This is not a pixel-perfect thirteen-screen certification: the exact original photography is unavailable, populated live place results were unavailable, and native camera/identification still need device verification.

## Design authority

The user's thirteen-screen image governs visual conflicts with the manuals, including serif screen headings. The manuals are supporting design material. Their Expo setup and publishing instructions did not authorize replacing the existing React/Capacitor framework or publishing a release.

## Implemented

- Misty forest splash, deer photo introduction with working pagination/skip, and leafy sign-in with expandable email form.
- Cream surfaces, serif headings, forest-green controls, outline icons, and Explore / Community / central camera / Journal / Profile dock.
- Satellite Explore imagery, Places/Wildlife/Trails filters, photo pins, and photographic place-detail header. Street tiles remain a fallback; map CSP allows both providers.
- Three-column journal with actual capture statistics, category filters, account-scoped device favourites, and a photo detail sheet with working About/Gallery/Sightings/Similar tabs.
- Full-screen camera controls, rear/front stream lifecycle handling, collapsed filters, and photographic identification results with independent edit/share/save actions.
- Compact community tabs/feed and guest-labelled sample Trips with functional category filters. Signed-in accounts receive an honest empty state while no trip service exists.
- Profile statistics, edit form, achievement presentation, and Recently Viewed from actual opened journal entries.
- Settings menu, preferences, and explicit account-deletion request confirmation wired to the existing API. Opening the deletion row does not submit a request.

## Browser verification

Phone screenshots are in `/tmp/wild-match-qa/`: `splash.png`, `welcome.png`, `signin.png`, `explore.png`, `journal.png`, `species.png`, `community.png`, `trips.png`, `profile.png`, `settings.png`, and `camera.png`.

CDP device metrics normalized the browser to 393 × 852; earlier 491-pixel captures are not used as final evidence. Checks found and fixed photo/title stacking, camera/dock stacking, wrapping community tabs, low-contrast onboarding text, and narrow sign-in controls. Some screenshots precede final minor text-color corrections.

Verified introduction progression, email expansion, journal detail tabs, recently viewed history, settings navigation, camera opening/closing, and guest logout/return. No capture, post, real trip booking, account deletion, or OAuth authentication was submitted during visual QA.

## Code verification

- Frontend suite: 9 files, 65 tests passed.
- ESLint passed.
- TypeScript check passed.
- Production build passed; existing chunk-size and Capacitor mixed-import warnings remain.
- Diff whitespace check passed.

Frontend tests cover camera stream races/cleanup, settings actions, navigation, detail selection, and separate identification edit/share/save callbacks. They do not prove native camera or live backend readiness. Earlier API tests encountered sandbox listener restrictions; no full backend pass is claimed.

## Remaining differences / limits

- New splash/onboarding/sign-in photographs approximate the composition; they are not the original board assets. Journal/feed show existing account content rather than substituted reference examples.
- Community retains working stories/chats and existing post actions. Its content is not an exact copy of the board's sample feed.
- Live scenic search reported unavailable, so populated place-detail layout was not browser-verified.
- Trips are explicitly guest previews; there is no real booking/membership integration.
- PHOTO is supported; video recording is not implemented.
- Identification result actions are tested at component level; a real native capture/result, camera flip/torch, system keyboard, and OAuth completion remain unverified.
- Favourites/recently viewed are local to the account on this device, not cloud-synced.

The Android generated files were left untouched by this visual pass. No deployment, commit, or push was performed.

## Follow-up: Community viewport fit

Removed nested feed gutters, oversized story/author spacing and the page transform. The feed and tabs now share a 20px gutter. Photo height adapts to short screens; the final post retains bottom navigation clearance through page padding. Verified no page-wide horizontal overflow at 360, 393 and 514px widths, with first-post engagement actions above the dock at the tested 740, 852 and 836px heights respectively. Stories keep their own horizontal scrolling. Evidence: `/tmp/wild-match-qa/community-fit-360.png` and `community-fit-514.png`. Production build and whitespace check passed.

## Follow-up: Explore, Quests and camera review flow

- Bottom navigation now ends with Quests. Explore has a circular top-right Profile button using the account photo or initial.
- Explore uses aligned search/categories, compact photo-and-text place cards, and a scrollable place-detail sheet with separated photo/title layers. Verified the Hebbal Lake sheet shows description, likely finds, social actions and Capture here above the dock.
- Quests has a leafy progress header, daily/weekly/monthly controls and cream adventure cards. Keyboard activation opens quest details; existing completion submissions remain connected.
- Camera files/live photos/native photos now enter a review stage before identification. Review offers named filters, Retake, My Journal or For a Quest. The quest choice hands the original File to active photo quests for explicit submission.
- Identification details support title/notes editing, a visible AI-accuracy notice, community posting off by default, and a separate share-to-other-apps action. Device sharing uses Web Share where available, with photo download fallback. Quest proofs also default to community sharing off.
- Camera filter effects are visual preview effects; quest proof and external export use the original photo. No crop/drawing editor was added.
- Save/edit failures keep the result open instead of silently closing it.

Phone screenshots: `/tmp/wild-match-qa/explore-updated.png`, `quests-updated.png`, and `place-updated.png`. Browser verified avatar navigation, quest filters and location detail layout at 393 × 852. Photo-picker automation was blocked by the Chrome extension's file-URL access setting; no bypass was used. Camera preview/no-submit, original-photo quest handoff, opt-in defaults and explicit quest submission are verified by component tests. Real device camera and native social-share completion remain unverified.

Validation: 69 frontend tests; build, lint and typecheck pass. Existing build chunk/import warnings remain.

## Interaction and data integrity pass — 2026-09-16
- Removed automatic development social seeding from signed-in read endpoints and fabricated comment fallback replies. Previously persisted demo records are not deleted by this change; audit the deployment database separately.
- Guest photo captures no longer invent identification, rarity, or XP. Guest browsing still contains explicit demo fixtures in the guest data layer.
- Fixed level-up render crash; added focused keyboard dismissal, subtle entrance, like feedback, and reduced-motion handling. Quest completion wording no longer suggests claiming rewards twice.
- Camera opens with named filter choices; selecting an already selected filter does not trigger the shutter. Unavailable-camera sample background is labelled. These are color filters, not face-tracking AR lenses.
- Friends can be searched and profiles opened. Private messaging is not implemented; UI now states that instead of offering a no-op Message action. Comments show actual returned replies with show-all/show-fewer controls.
- Browser review at 390×844: Community feed and camera controls fit; filter selection updates aria-pressed. Physical camera capture, signed-in deployment data, and 1,000-user load remain unverified.
- Validation: lint/typecheck/production build passed; full regression run had only four obsolete hidden-filter expectations failing (222 passed, 35 skipped). Updated expectations and reran all affected suites: 29 passed. Existing jsdom window.scrollTo warnings remain.
