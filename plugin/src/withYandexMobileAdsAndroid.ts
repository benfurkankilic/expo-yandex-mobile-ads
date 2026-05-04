/**
 * Android sub-plugin — owns all changes to
 * `android/app/src/main/AndroidManifest.xml`.
 *
 * Currently the only Android-side native config the plugin manages is the
 * AdMob `APPLICATION_ID` `<meta-data>`. Base permissions (INTERNET,
 * ACCESS_NETWORK_STATE, AD_ID) are merged in automatically by Yandex's own
 * AndroidManifest at runtime via Gradle's manifest merger — no plugin work
 * required.
 *
 * If you ever need to add per-mediation-partner Maven repositories to
 * `build.gradle` (e.g. IronSource, Pangle, Mintegral), use
 * `withProjectBuildGradle` from `expo/config-plugins` and add a new sub-plugin
 * file rather than expanding this one.
 */

import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from 'expo/config-plugins';

import type { YandexMobileAdsPluginProps } from './types';

/**
 * AdMob app IDs follow the same format on Android as on iOS — validating
 * here gives developers a clear prebuild-time error rather than a cryptic
 * runtime crash inside Google Play Services.
 */
const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;

/**
 * The fully-qualified Android attribute name AdMob expects in
 * `<meta-data android:name="...">`. AdMob crashes the app on init if this
 * exact key is missing.
 */
const ADMOB_META_KEY = 'com.google.android.gms.ads.APPLICATION_ID';

/**
 * Register the AndroidManifest mod for AdMob mediation.
 *
 * The plugin is intentionally a no-op when `androidAppId` is omitted — there
 * is nothing else this sub-plugin needs to do at the moment, so skipping the
 * mod registration entirely is faster (one fewer file touched during prebuild).
 *
 * @param config - ExpoConfig forwarded from the entry plugin.
 * @param props  - Plugin props. Only `androidAppId` is read.
 * @returns ExpoConfig, possibly with a `withAndroidManifest` mod registered.
 */
export const withYandexMobileAdsAndroid: ConfigPlugin<YandexMobileAdsPluginProps> = (
  config,
  props,
) => {
  if (!props.androidAppId) {
    return config;
  }

  if (!ADMOB_APP_ID_PATTERN.test(props.androidAppId)) {
    throw new Error(
      `[expo-yandex-mobile-ads] androidAppId must match the AdMob app ID format ` +
        `"ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" — received "${props.androidAppId}".`,
    );
  }

  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = upsertAdMobMetadata(cfg.modResults, props.androidAppId!);
    return cfg;
  });
};

/**
 * Idempotent upsert of the AdMob `<meta-data>` entry under the main
 * `<application>`. Re-running `expo prebuild` will not duplicate the entry —
 * if it already exists, only its `android:value` is updated.
 *
 * @param manifest - Parsed AndroidManifest.xml structure (xml2js shape).
 * @param appId    - Validated AdMob app ID to write.
 * @returns The mutated manifest object (same reference, mutated in place by
 *          AndroidConfig helpers — returned for clarity).
 */
function upsertAdMobMetadata(
  manifest: AndroidConfig.Manifest.AndroidManifest,
  appId: string,
): AndroidConfig.Manifest.AndroidManifest {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

  application['meta-data'] = application['meta-data'] ?? [];
  const existing = application['meta-data'].find(
    (entry) => entry.$['android:name'] === ADMOB_META_KEY,
  );

  if (existing) {
    existing.$['android:value'] = appId;
  } else {
    application['meta-data'].push({
      $: {
        'android:name': ADMOB_META_KEY,
        'android:value': appId,
      },
    });
  }

  return manifest;
}
