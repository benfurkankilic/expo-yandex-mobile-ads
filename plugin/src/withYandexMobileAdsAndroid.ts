import { ConfigPlugin } from 'expo/config-plugins';

import type { YandexMobileAdsPluginProps } from './types';

export const withYandexMobileAdsAndroid: ConfigPlugin<YandexMobileAdsPluginProps> = (
  config,
  _props
) => {
  return config;
};
