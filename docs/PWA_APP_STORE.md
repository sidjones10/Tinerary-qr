# PWA & App Store Submission

Tinerary ships as a Progressive Web App. This doc covers what's wired up
in the repo and the steps to package it for the Google Play Store via a
Trusted Web Activity (TWA).

## What's in the repo

| Piece | Location |
| --- | --- |
| Web App Manifest | `public/manifest.json` |
| Service worker | `public/sw.js` |
| Service worker registration | `components/pwa-register.tsx` (mounted in `app/layout.tsx`) |
| Icons (192, 512, maskable, apple-touch) | `public/icons/` |
| Offline fallback page | `app/offline/page.tsx` |
| Digital Asset Links (TWA) | `public/.well-known/assetlinks.json` |

The service worker:
- Pre-caches `/`, `/offline`, the manifest, and core icons on install.
- Network-first for navigations and `/api/*`, falling back to `/offline`
  when the network fails and no cached response exists.
- Cache-first for hashed `_next/static`, images, and fonts.
- Handles `push` and `notificationclick` events.

Bump `CACHE_NAME` in `public/sw.js` whenever the precache list changes,
otherwise old clients keep stale assets.

## Verifying the PWA locally

```bash
pnpm build && pnpm start
# Open http://localhost:3000 in Chrome
# DevTools → Application → Manifest  (no errors, icons render)
# DevTools → Application → Service Workers  (sw.js activated)
# DevTools → Lighthouse → "Progressive Web App" category  (target ≥ 90)
```

To test offline: DevTools → Network → "Offline" → reload. You should
see the `/offline` page rather than the browser's dino.

## Required artwork before store submission

- **Manifest screenshots** — drop the following into `public/screenshots/`:
  - `mobile-1.png`, `mobile-2.png` — 1080×1920 (portrait, `form_factor: "narrow"`)
  - `desktop-1.png` — 1920×1080 (landscape, `form_factor: "wide"`)
- **Play Store listing assets**:
  - Feature graphic 1024×500
  - At least 2 phone screenshots (min 320 px short side)
  - High-res icon 512×512 (we already have `public/icons/icon-512x512.png`)

Manifest screenshots are what powers the rich install prompt on Android
Chrome and the Play Store listing preview.

## Google Play via Bubblewrap (recommended path)

[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) is the
official CLI for generating a TWA from a manifest URL.

### 1. Generate the project

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://tinerary.app/manifest.json
```

Answer the prompts:
- Application ID: `app.tinerary.twa` (must match `assetlinks.json`)
- Display mode: `standalone`
- Orientation: `portrait`
- Status bar color: `#E11D48`

### 2. Build a signed bundle

```bash
bubblewrap build
```

This produces `app-release-bundle.aab` and a signing key
(`android.keystore`). **Keep the keystore in a password manager** — losing
it means you can never publish updates under the same listing.

### 3. Wire up Digital Asset Links

Get the SHA-256 fingerprint of your signing key:

```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

Open `public/.well-known/assetlinks.json` and replace
`REPLACE_WITH_YOUR_SIGNING_KEY_SHA256_FINGERPRINT` with the fingerprint
(keep the colons). Deploy. Verify it's reachable:

```bash
curl https://tinerary.app/.well-known/assetlinks.json
```

If you opt into Play App Signing (recommended), Google re-signs your
bundle and you must add Google's upload-cert fingerprint to the same
JSON array — grab it from Play Console → Setup → App integrity.

### 4. Upload to Play Console

- Create a new app at <https://play.google.com/console> ($25 one-time
  developer fee).
- Upload `app-release-bundle.aab` to an Internal Testing track first.
- Install via the testing link on a real Android device and confirm the
  app opens **without** the Chrome address bar at the top — that bar
  means asset-link verification failed.
- Once verified, promote to Production.

## Alternative: PWABuilder.com

If you'd rather not run Bubblewrap locally, paste
`https://tinerary.app` into <https://www.pwabuilder.com>. It scores the
manifest, surfaces fixes, and packages an Android `.aab` (and an iOS
project, with caveats — see below). The output is functionally identical
to Bubblewrap.

## iOS App Store (deferred)

iOS is intentionally not included here. Apple does not accept TWAs, and
a pure WKWebView wrapper risks rejection under guideline 4.2 ("Minimum
Functionality"). When we're ready, options are:

1. **PWABuilder iOS package** — fastest, ships a WKWebView shell. Add
   at least one native capability (push, share-sheet, camera) to clear
   review.
2. **Capacitor** — bigger lift, gives a real native shell with plugin
   access. Requires a Mac, Xcode, and a $99/yr Apple Developer account.

## Updating the PWA after launch

- For web changes: deploy as normal. Service worker auto-updates on next
  visit (we call `skipWaiting()` and `clients.claim()`).
- For TWA changes: only required when the manifest URL, package ID, or
  signing key changes. Pure web updates flow through automatically.
