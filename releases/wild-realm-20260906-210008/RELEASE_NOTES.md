# Wild Realm Local Build 20260906-210008

Commit base: 0ae3b6d

## Artifacts

- `wild-realm-debug-20260906.apk`
- `wild-realm-release-unsigned-20260906.apk`

## Verification

- `npm run test:ci -- api/server.test.js src/lib/discoveryHotspots.test.js src/App.test.jsx` passed: 116 tests.
- `npm run build` passed.
- `npx cap sync android` passed using Node 24.19.0.
- `./gradlew assembleDebug` passed.
- `./gradlew assembleRelease` passed.
- `.env` has `DATABASE_URL` set.
- `.env` has `VISION_PROVIDER=openrouter`.
- `.env` has `OPENROUTER_API_KEY` set.
- `.env` does not have `OPENAI_API_KEY`.
- Read-only API checks returned database configured and Postgres ready.

## Release Limitations

- The release APK is unsigned because no Android release signing config is present.
- iOS `.ipa` was not produced because this Linux machine cannot run Xcode signing/archive.
- GitHub Release upload was not performed because the local `gh` token is invalid.
