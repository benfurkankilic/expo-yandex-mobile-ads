/**
 * @benfurkankilic/expo-yandex-mobile-ads — Expo config plugin entry point.
 *
 * This file exports the default Expo config plugin. The plugin orchestrates two
 * platform-specific sub-plugins (iOS + Android), each of which only registers
 * its `withInfoPlist` / `withAndroidManifest` mod when the user has supplied a
 * relevant prop. This keeps the prebuild step minimal for users who don't need
 * AdMob mediation.
 *
 * Architecture rationale:
 *   - Pure config plugin (no wrapped JS/TS surface). Users install
 *     `yandex-mobile-ads` for runtime APIs and import directly from there.
 *     This package only handles the native-config toil.
 *   - `createRunOncePlugin` wraps the default export so re-applying the plugin
 *     (e.g. via `app.config.ts` reload) is safe. The plugin name + version
 *     come from `package.json` so cache keys stay accurate across releases.
 */

import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withYandexMobileAdsIos } from './withYandexMobileAdsIos';
import { withYandexMobileAdsAndroid } from './withYandexMobileAdsAndroid';
import type { YandexMobileAdsPluginProps } from './types';

const pkg = require('../../package.json');

/**
 * Apply the Yandex Mobile Ads native configuration to an Expo project.
 *
 * Called by Expo's prebuild pipeline once per app config evaluation. Composes
 * iOS and Android sub-plugins in order. Each sub-plugin internally decides
 * whether to register a mod based on the props it receives — that's why this
 * function is a thin orchestrator with no platform logic of its own.
 *
 * @param config - The ExpoConfig provided by Expo's prebuild pipeline.
 * @param props  - User-supplied options from `app.json` `plugins` array.
 *                 Optional: when omitted, only the SKAdNetwork defaults are
 *                 injected on iOS and Android is a no-op.
 * @returns The mutated ExpoConfig with platform mods registered.
 */
const withYandexMobileAds: ConfigPlugin<YandexMobileAdsPluginProps | void> = (
  config,
  props,
) => {
  const options: YandexMobileAdsPluginProps = props ?? {};
  config = withYandexMobileAdsIos(config, options);
  config = withYandexMobileAdsAndroid(config, options);
  return config;
};

export default createRunOncePlugin(withYandexMobileAds, pkg.name, pkg.version);
export type { YandexMobileAdsPluginProps } from './types';
