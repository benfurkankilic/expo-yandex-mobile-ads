import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from 'expo/config-plugins';

import type { YandexMobileAdsPluginProps } from './types';

const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;
const ADMOB_META_KEY = 'com.google.android.gms.ads.APPLICATION_ID';

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
