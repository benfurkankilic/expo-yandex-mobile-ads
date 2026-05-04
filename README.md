# @benfurkankilic/expo-yandex-mobile-ads

> Expo config plugin for **Yandex Mobile Ads SDK 8** — auto-configures `Info.plist`, `AndroidManifest.xml`, and the full SKAdNetwork list so you can integrate Yandex ads in an Expo app in **under 2 minutes**.

[![npm](https://img.shields.io/npm/v/@benfurkankilic/expo-yandex-mobile-ads.svg)](https://www.npmjs.com/package/@benfurkankilic/expo-yandex-mobile-ads)
[![license](https://img.shields.io/npm/l/@benfurkankilic/expo-yandex-mobile-ads.svg)](./LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052%2B-000020.svg)](https://expo.dev)
[![Yandex SDK](https://img.shields.io/badge/Yandex%20Mobile%20Ads-SDK%208-FFCC00.svg)](https://www.npmjs.com/package/yandex-mobile-ads)

---

## Demo

https://github.com/user-attachments/assets/d9a9960e-52f1-4baa-9c13-b5c6fe6903f1

## Why this exists

Yandex Mobile Ads SDK 8 ships an [official React Native plugin](https://www.npmjs.com/package/yandex-mobile-ads) — but if you're on **Expo** (Managed or Bare), integrating it is painful:

- iOS `Info.plist` needs **222 `SKAdNetworkIdentifier` entries** for Yandex + every mediation partner (AppLovin, AdMob, IronSource, Unity, Vungle, Mintegral, myTarget, Start.io)
- AdMob mediation requires a `GADApplicationIdentifier` key
- Android needs a `com.google.android.gms.ads.APPLICATION_ID` `<meta-data>` entry
- Forgetting any of these silently breaks attribution or crashes the app at init

This plugin handles all of it during `expo prebuild`. Drop it in `app.json` and you're done.

## Install

```sh
npx expo install yandex-mobile-ads @benfurkankilic/expo-yandex-mobile-ads
```

> Both packages are required: `yandex-mobile-ads` ships the runtime SDK; this package only handles native config.

## Configure

Add the plugin to your `app.json` (or `app.config.js`):

```jsonc
{
  "expo": {
    "plugins": [
      [
        "@benfurkankilic/expo-yandex-mobile-ads",
        {
          // All options are optional. Omit to use defaults.
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
          "userTrackingUsageDescription": "Used to deliver relevant ads."
        }
      ]
    ]
  }
}
```

Then regenerate native projects:

```sh
npx expo prebuild --clean
```

That's it. Your `ios/<bundle>/Info.plist` and `android/app/src/main/AndroidManifest.xml` are now configured for Yandex Mobile Ads SDK 8.

## Plugin options

All optional.

| Option | Type | What it does |
|---|---|---|
| `iosAppId` | `string` | Your AdMob app ID — written to Info.plist as `GADApplicationIdentifier`. **Required if** you use AdMob mediation. Format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY` |
| `androidAppId` | `string` | Your AdMob app ID for Android — written to AndroidManifest.xml as `com.google.android.gms.ads.APPLICATION_ID` `<meta-data>`. Same format as `iosAppId`. |
| `userTrackingUsageDescription` | `string` | Set the iOS App Tracking Transparency prompt text. Required if you want to request IDFA for mediation networks. Apple rejects vague phrasing — be specific. |
| `extraSkAdNetworkItems` | `string[]` | Append additional SKAdNetwork IDs to the bundled list (for partners not yet covered). |
| `skAdNetworkItems` | `string[]` | Replace the bundled SKAdNetwork list entirely. Advanced users only. |

The plugin **always** injects all 222 SKAdNetwork IDs from the official `yandex-mobile-ads@8` README — Yandex + every mediation partner adapter. App Store has no penalty for extras, and missing IDs silently break revenue.

## Quick start (with code)

After installation, use the [Yandex Mobile Ads SDK 8 API](https://www.npmjs.com/package/yandex-mobile-ads) in your screens. The full demo lives in [`example/App.tsx`](./example/App.tsx) — copy patterns from there. Highlights:

```tsx
import { MobileAds, BannerView, BannerAdSize } from 'yandex-mobile-ads';
import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export default function App() {
  // Initialize once
  useEffect(() => { MobileAds.initialize(); }, []);
  return <Banner />;
}

function Banner() {
  const [size, setSize] = useState<BannerAdSize | null>(null);
  useEffect(() => {
    BannerAdSize.inlineSize(Dimensions.get('window').width, 250).then(setSize);
  }, []);

  if (!size) return null;
  return (
    <BannerView
      size={size}
      adRequest={{ adUnitId: 'demo-banner-yandex' }}
      onAdLoaded={() => console.log('Loaded')}
    />
  );
}
```

## Demo ad unit IDs

Yandex provides public demo IDs that always return a fill — perfect for development:

| Format | Demo ID |
|---|---|
| Banner | `demo-banner-yandex` |
| Interstitial | `demo-interstitial-yandex` |
| Rewarded | `demo-rewarded-yandex` |
| App Open | `demo-appopenad-yandex` |

Replace with your real IDs from [partner.yandex.com](https://partner.yandex.com) before shipping.

## Compatibility

| Tool | Version |
|---|---|
| Expo | SDK 52+ |
| React Native | 0.74+ |
| `yandex-mobile-ads` | ^8.0.0 |
| iOS | 13.0+ |
| Android | minSdk 21+ |

Works with Expo Managed (via prebuild / EAS Build) and Bare workflows.

## Mediation

Yandex Mobile Ads SDK 8 supports mediation with:

- AppLovin MAX
- Google AdMob
- Mintegral
- IronSource
- Unity Ads
- Vungle
- myTarget (VK Ads)
- Start.io

Required SKAdNetwork IDs for **all** of these are pre-configured by this plugin. For AdMob specifically, also pass `iosAppId` / `androidAppId`. For other adapters, follow [Yandex's mediation guide](https://ads.yandex.com/helpcenter/en/dev/react-native/quick-start-mm) for any additional Maven repositories you need to add.

## How it works (under the hood)

The plugin runs at `expo prebuild` time and applies two mods:

1. **`withInfoPlist`** — merges 222 SKAN IDs into `SKAdNetworkItems` (deduplicated against your existing entries), writes `GADApplicationIdentifier` and `NSUserTrackingUsageDescription` if you provided them.
2. **`withAndroidManifest`** — idempotently upserts the AdMob `<meta-data>` tag if you provided `androidAppId`. Skipped entirely if not.

It's wrapped in `createRunOncePlugin` so re-running prebuild never duplicates entries.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture write-up.

## Contributing

PRs welcome. Read [`CLAUDE.md`](./CLAUDE.md) before making changes — the architecture decisions there are deliberate.

```bash
git clone https://github.com/benfurkankilic/expo-yandex-mobile-ads.git
cd expo-yandex-mobile-ads
npm install                  # builds the plugin via prepare script
cd example && npm install
npx expo prebuild --clean    # exercise the plugin end-to-end
```

## License

MIT © [Furkan Kılıç](https://github.com/benfurkankilic)

This plugin is **not** an official Yandex product. It's a community config plugin built on top of the official [`yandex-mobile-ads`](https://www.npmjs.com/package/yandex-mobile-ads) package.
