export type YandexMobileAdsPluginProps = {
  iosUserTrackingUsageDescription?: string;
  extraSkAdNetworkIds?: string[];
  androidPermissions?: {
    adId?: boolean;
  };
};
