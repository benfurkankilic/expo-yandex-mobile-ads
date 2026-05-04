/**
 * iOS sub-plugin — owns all changes to `ios/<project>/Info.plist`.
 *
 * What it does:
 *   1. Always: merge the bundled SKAdNetwork ID list (DEFAULT_SKADNETWORK_IDS,
 *      sourced from yandex-mobile-ads@8 README) into `SKAdNetworkItems`.
 *   2. If `iosAppId` is provided: write it as `GADApplicationIdentifier`
 *      (required by AdMob mediation; format-validated).
 *   3. If `userTrackingUsageDescription` is provided: write it as
 *      `NSUserTrackingUsageDescription` (App Tracking Transparency string).
 *
 * Why dedup matters: users may already have SKAdNetwork IDs from another ad
 * SDK in their Info.plist (e.g. AdMob's react-native-google-mobile-ads). The
 * merge logic preserves their order and counts each ID once, regardless of
 * source. This makes the plugin safe to combine with other ad libraries.
 */

import { ConfigPlugin, InfoPlist, withInfoPlist } from 'expo/config-plugins';

import { DEFAULT_SKADNETWORK_IDS } from './skAdNetworkIds';
import type { YandexMobileAdsPluginProps } from './types';

/**
 * AdMob app IDs follow a strict format: `ca-app-pub-` + 16 digits + `~` + 10 digits.
 * Validating early gives developers a clear error at prebuild time instead of a
 * cryptic SDK init failure at runtime.
 */
const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;

/**
 * Register the Info.plist mod that merges Yandex Mobile Ads native configuration.
 *
 * @param config - ExpoConfig forwarded from the entry plugin.
 * @param props  - Plugin props. Only iOS-relevant fields are read.
 * @returns ExpoConfig with the `withInfoPlist` mod registered.
 */
export const withYandexMobileAdsIos: ConfigPlugin<YandexMobileAdsPluginProps> = (
  config,
  props,
) => {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults = mergeYandexInfoPlist(cfg.modResults, props);
    return cfg;
  });
};

/**
 * Pure function that takes a parsed Info.plist and returns a new one with
 * Yandex-related keys merged in. Extracted as a pure helper so it can be
 * unit-tested without spinning up the full Expo prebuild pipeline.
 *
 * @param infoPlist - Existing Info.plist contents (already parsed by Expo).
 * @param props     - User options.
 * @returns A new Info.plist object with the Yandex configuration merged in.
 */
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

/**
 * Merge SKAdNetwork IDs from three sources into a deduplicated array of
 * `{ SKAdNetworkIdentifier }` plist dicts.
 *
 * Merge order (earlier sources win on duplicate detection):
 *   1. IDs already in the user's Info.plist (preserved as-is)
 *   2. The override list (if `skAdNetworkItems` was supplied) OR the default
 *      222 IDs from yandex-mobile-ads@8
 *   3. User-supplied extras (`extraSkAdNetworkItems`)
 *
 * Comparison is case-insensitive because SKAN IDs are case-insensitive per Apple's spec.
 */
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

/**
 * Defensive extractor: pulls valid `SKAdNetworkIdentifier` strings out of an
 * existing `SKAdNetworkItems` array. Tolerates malformed entries (returns []
 * for non-arrays, skips entries missing the expected shape).
 */
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
