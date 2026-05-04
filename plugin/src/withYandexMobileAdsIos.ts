import { ConfigPlugin, InfoPlist, withInfoPlist } from 'expo/config-plugins';

import { DEFAULT_SKADNETWORK_IDS } from './skAdNetworkIds';
import type { YandexMobileAdsPluginProps } from './types';

const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;

export const withYandexMobileAdsIos: ConfigPlugin<YandexMobileAdsPluginProps> = (
  config,
  props,
) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = mergeYandexInfoPlist(cfg.modResults, props);
    return cfg;
  });
};

function mergeYandexInfoPlist(
  infoPlist: InfoPlist,
  props: YandexMobileAdsPluginProps,
): InfoPlist {
  const next: InfoPlist = { ...infoPlist };

  next.SKAdNetworkItems = mergeSkAdNetworkItems(
    next.SKAdNetworkItems,
    props.skAdNetworkItems,
    props.extraSkAdNetworkItems,
  );

  if (props.iosAppId) {
    if (!ADMOB_APP_ID_PATTERN.test(props.iosAppId)) {
      throw new Error(
        `[expo-yandex-mobile-ads] iosAppId must match the AdMob app ID format ` +
          `"ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" — received "${props.iosAppId}".`,
      );
    }
    next.GADApplicationIdentifier = props.iosAppId;
  }

  if (props.userTrackingUsageDescription !== undefined) {
    next.NSUserTrackingUsageDescription = props.userTrackingUsageDescription;
  }

  return next;
}

function mergeSkAdNetworkItems(
  existing: unknown,
  override: string[] | undefined,
  extras: string[] | undefined,
): { SKAdNetworkIdentifier: string }[] {
  const baseIds = override ?? DEFAULT_SKADNETWORK_IDS;
  const extraIds = extras ?? [];
  const existingIds = extractExistingSkAdNetworkIds(existing);

  const seen = new Set<string>();
  const merged: { SKAdNetworkIdentifier: string }[] = [];
  for (const id of [...existingIds, ...baseIds, ...extraIds]) {
    const lower = id.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    merged.push({ SKAdNetworkIdentifier: id });
  }
  return merged;
}

function extractExistingSkAdNetworkIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (entry && typeof entry === 'object' && 'SKAdNetworkIdentifier' in entry) {
        const id = (entry as { SKAdNetworkIdentifier: unknown }).SKAdNetworkIdentifier;
        return typeof id === 'string' ? id : null;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}
