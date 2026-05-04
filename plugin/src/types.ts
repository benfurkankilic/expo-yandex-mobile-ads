/**
 * Public options accepted by the plugin in `app.json` `plugins` array.
 *
 * Example:
 * ```jsonc
 * {
 *   "plugins": [
 *     ["@benfurkankilic/expo-yandex-mobile-ads", {
 *       "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
 *       "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
 *       "userTrackingUsageDescription": "Used to deliver relevant ads."
 *     }]
 *   ]
 * }
 * ```
 *
 * All fields are optional. The plugin always injects the bundled SKAdNetwork
 * IDs into Info.plist; everything else is opt-in via these props.
 */
export type YandexMobileAdsPluginProps = {
  /**
   * AdMob app ID for iOS, written into Info.plist as `GADApplicationIdentifier`.
   * Only required if you use AdMob mediation. Format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`.
   */
  iosAppId?: string;

  /**
   * AdMob app ID for Android, written into AndroidManifest.xml as a
   * `com.google.android.gms.ads.APPLICATION_ID` `<meta-data>` entry.
   * Only required if you use AdMob mediation. Format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`.
   */
  androidAppId?: string;

  /**
   * Value for `NSUserTrackingUsageDescription` in Info.plist. Provide a
   * user-facing reason if you want to request IDFA via App Tracking Transparency
   * for mediation networks. Apple rejects vague phrasing — be specific about
   * what data is collected and why.
   */
  userTrackingUsageDescription?: string;

  /**
   * Append additional `SKAdNetworkIdentifier` values to the bundled default list.
   * Use for ad partners not yet covered by the default set.
   */
  extraSkAdNetworkItems?: string[];

  /**
   * Replace the bundled default SKAdNetwork list entirely. Use only if you have
   * a curated list and want full control. Most users should use `extraSkAdNetworkItems` instead.
   */
  skAdNetworkItems?: string[];
};
