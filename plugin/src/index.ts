import { ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withYandexMobileAdsIos } from './withYandexMobileAdsIos';
import { withYandexMobileAdsAndroid } from './withYandexMobileAdsAndroid';
import type { YandexMobileAdsPluginProps } from './types';

const pkg = require('../../package.json');

const withYandexMobileAds: ConfigPlugin<YandexMobileAdsPluginProps | void> = (
  config,
  props
) => {
  const options: YandexMobileAdsPluginProps = props ?? {};
  config = withYandexMobileAdsIos(config, options);
  config = withYandexMobileAdsAndroid(config, options);
  return config;
};

export default createRunOncePlugin(withYandexMobileAds, pkg.name, pkg.version);
export type { YandexMobileAdsPluginProps } from './types';
