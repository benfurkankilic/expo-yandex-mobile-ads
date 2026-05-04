# Changelog

All notable changes to `@benfurkankilic/expo-yandex-mobile-ads` are documented here.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-04

Initial stable release.

### Added
- iOS `withInfoPlist` mod that injects all 222 `SKAdNetworkIdentifier` values
  required by `yandex-mobile-ads@8` (Yandex + AppLovin + AdMob + Mintegral +
  IronSource + Unity + Vungle + myTarget + Start.io and their sub-adapters)
- iOS optional `GADApplicationIdentifier` injection via the `iosAppId` plugin prop
- iOS optional `NSUserTrackingUsageDescription` via `userTrackingUsageDescription`
- Android `withAndroidManifest` mod that idempotently upserts the AdMob
  `com.google.android.gms.ads.APPLICATION_ID` `<meta-data>` when `androidAppId`
  is provided
- AdMob app ID format validation (regex-checked) with descriptive errors
- Bundled `example/` Expo app demonstrating all four ad formats (Banner,
  Interstitial, Rewarded, App Open) with the actual `yandex-mobile-ads@8` API
- English README with quick start, plugin options table, mediation overview,
  architecture notes, and embedded demo video
- `CLAUDE.md` capturing architecture decisions and contribution workflow
