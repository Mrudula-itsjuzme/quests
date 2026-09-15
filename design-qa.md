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
