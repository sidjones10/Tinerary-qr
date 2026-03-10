# Getting Tinerary on the App Stores

Tinerary is a Next.js web app. To publish it on the Google Play Store and Apple App Store, you need to wrap it in a native shell. Below are your options, ranked by effort.

---

## Option 1: Capacitor (Recommended)

[Capacitor](https://capacitorjs.com/) wraps your existing Next.js app in a native WebView with access to native APIs. Minimal code changes required.

### Setup

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Tinerary com.tinerary.app --web-dir=out

# Add platforms
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### Update `next.config.mjs`

Add static export support:

```js
const nextConfig = {
  output: 'export',
  // ... existing config
};
```

### Build & Sync

```bash
npm run build          # generates static export in /out
npx cap sync           # copies web assets into native projects
npx cap open android   # opens Android Studio
npx cap open ios       # opens Xcode
```

### What to Watch Out For

- **Server-side features** (API routes, middleware, SSR) won't work in a static export. You'll need to move API routes to your Supabase backend or edge functions.
- **`next/image`** with the default loader needs to be replaced with `unoptimized: true` or a custom loader.
- **Middleware** (auth redirects) must be handled client-side instead.

---

## Option 2: PWA (No App Store — Easiest)

Your app already has a `manifest.json` configured. You can make it installable from the browser without the app stores.

### What's Already Done
- Web manifest at `/public/manifest.json`
- Icons at 192x192 and 512x512

### What's Needed
- A service worker for offline support (use `next-pwa` package)
- HTTPS (already handled by Vercel)

```bash
npm install next-pwa
```

**Pros:** No app store fees, instant updates, no review process.
**Cons:** Not in app stores, limited native API access, iOS Safari limitations.

---

## Option 3: PWABuilder (Play Store Only — Easy)

[PWABuilder](https://www.pwabuilder.com/) can package your PWA as a Trusted Web Activity (TWA) for the Google Play Store.

1. Deploy your PWA to Vercel
2. Go to https://www.pwabuilder.com/
3. Enter your URL
4. Generate an Android package
5. Upload to Google Play Console

**Note:** This only works for Android. Apple does not support TWAs.

---

## Google Play Store Submission

### Prerequisites
1. [Google Play Developer account](https://play.google.com/console/) — $25 one-time fee
2. Android app bundle (`.aab`) generated from Capacitor/Android Studio or PWABuilder

### Steps
1. Sign in to [Google Play Console](https://play.google.com/console/)
2. Click **Create app**
3. Fill in app details (name, language, app/game, free/paid)
4. Complete the **Store listing**:
   - App name: Tinerary
   - Short description (80 chars): "Plan, share, and discover travel itineraries"
   - Full description (4000 chars): Describe all features
   - Screenshots: Phone (min 2), 7-inch tablet, 10-inch tablet
   - Feature graphic: 1024x500 px
   - App icon: 512x512 px
5. Complete the **Content rating** questionnaire
6. Set up **Pricing & distribution**
7. Complete the **Data safety** form (declare Supabase data collection)
8. Upload your `.aab` to **Production** > **Create new release**
9. Submit for review (typically 1-3 days)

### Required Assets
| Asset | Dimensions | Format |
|-------|-----------|--------|
| App icon | 512x512 px | PNG (32-bit, no alpha) |
| Feature graphic | 1024x500 px | PNG or JPEG |
| Phone screenshots | 16:9 or 9:16 | PNG or JPEG (min 2) |
| Tablet screenshots | 16:9 or 9:16 | PNG or JPEG |

---

## Apple App Store Submission

### Prerequisites
1. [Apple Developer Program](https://developer.apple.com/programs/) — $99/year
2. A Mac with Xcode installed
3. iOS app archive (`.ipa`) generated from Capacitor/Xcode

### Steps
1. Sign in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps** > **+** > **New App**
3. Fill in app information:
   - Platform: iOS
   - Name: Tinerary
   - Bundle ID: `com.tinerary.app`
   - SKU: `tinerary-001`
4. Complete the **App Information** tab:
   - Privacy Policy URL (required)
   - Category: Travel
5. Upload **Screenshots** for each device size:
   - iPhone 6.7" (required)
   - iPhone 6.5"
   - iPhone 5.5"
   - iPad Pro 12.9"
6. Fill in **Description**, **Keywords**, **Support URL**
7. Set **Pricing** (free or paid)
8. Complete **App Privacy** (data collection disclosure)
9. In Xcode: **Product** > **Archive** > **Distribute App** > **App Store Connect**
10. In App Store Connect, select the build and submit for review (typically 1-2 days)

### Required Assets
| Asset | Dimensions | Format |
|-------|-----------|--------|
| App icon | 1024x1024 px | PNG (no alpha, no rounded corners) |
| iPhone 6.7" screenshots | 1290x2796 px | PNG or JPEG (min 3) |
| iPhone 6.5" screenshots | 1284x2778 px | PNG or JPEG |
| iPad Pro screenshots | 2048x2732 px | PNG or JPEG |

### Important Apple Requirements
- **Privacy Policy** — You must have a publicly accessible privacy policy URL
- **Sign in with Apple** — If you offer third-party sign-in (Google, etc.), you must also offer Sign in with Apple
- **App Transport Security** — All network calls must use HTTPS (already handled)
- **Human Interface Guidelines** — Follow Apple's design guidelines

---

## Recommended Path

For Tinerary specifically, here's the suggested approach:

1. **Short term:** Deploy as a PWA on Vercel (you're mostly there already)
2. **Medium term:** Use Capacitor to wrap the app for both stores
3. **Before submission:** Address these items:
   - Move API routes to Supabase Edge Functions (required for static export)
   - Add a privacy policy page
   - Implement Sign in with Apple (required by Apple if you have social login)
   - Create app store screenshots and marketing assets
   - Set up code signing (Android keystore + Apple certificates)

---

## Estimated Costs

| Item | Cost |
|------|------|
| Google Play Developer account | $25 (one-time) |
| Apple Developer Program | $99/year |
| Vercel hosting (backend) | Free tier or $20/month |
| **Total to start** | **$124** |
