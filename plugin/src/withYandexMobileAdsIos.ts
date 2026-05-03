import { ConfigPlugin } from 'expo/config-plugins';

import type { YandexMobileAdsPluginProps } from './types';

export const withYandexMobileAdsIos: ConfigPlugin<YandexMobileAdsPluginProps> = (
  config,
  _props
) => {
  return config;
};
