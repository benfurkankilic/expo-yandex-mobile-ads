/**
 * Demo app for @benfurkankilic/expo-yandex-mobile-ads.
 *
 * Exercises all four Yandex Mobile Ads SDK 8 ad formats (Banner, Interstitial,
 * Rewarded, App Open) using Yandex's public demo ad unit IDs. Copy the section
 * patterns below into your own app — each one is self-contained.
 *
 * Demo ad unit IDs used (safe for any developer to use; always return a fill):
 *   - demo-banner-yandex
 *   - demo-interstitial-yandex
 *   - demo-rewarded-yandex
 *   - demo-appopenad-yandex
 *
 * Replace these with your real ad unit IDs from partner.yandex.com before shipping.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AppOpenAd,
  AppOpenAdLoader,
  BannerAdSize,
  BannerView,
  InterstitialAd,
  InterstitialAdLoader,
  MobileAds,
  RewardedAd,
  RewardedAdLoader,
} from 'yandex-mobile-ads';

export default function App() {
  const [sdkReady, setSdkReady] = useState(false);

  // Initialize the Yandex SDK exactly once on mount. All ad loaders depend on
  // this completing first; load attempts before init silently fail or hang.
  useEffect(() => {
    (async () => {
      await MobileAds.initialize();
      setSdkReady(true);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header sdkReady={sdkReady} />
        <BannerSection />
        <InterstitialSection />
        <RewardedSection />
        <AppOpenSection />
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Banner                                                             */
/* ------------------------------------------------------------------ */

/**
 * Banner ads render as a JSX component (`<BannerView />`) — no loader pattern.
 * The component handles its own request lifecycle internally; you wire size +
 * an `adRequest` object containing the ad unit ID and the SDK does the rest.
 */
function BannerSection() {
  const [adSize, setAdSize] = useState<BannerAdSize | null>(null);
  const [status, setStatus] = useState<AdStatus>('idle');

  // BannerAdSize.inlineSize is async because it asks the native side for the
  // pixel-exact dimensions matching the device. Compute it once on mount.
  useEffect(() => {
    (async () => {
      const size = await BannerAdSize.inlineSize(
        Dimensions.get('window').width - 32, // -32 to account for card padding
        250,
      );
      setAdSize(size);
    })();
  }, []);

  return (
    <Card title="Banner Ad" subtitle="demo-banner-yandex" status={status}>
      {adSize ? (
        <BannerView
          size={adSize}
          adRequest={{ adUnitId: 'demo-banner-yandex' }}
          onAdLoaded={() => setStatus('loaded')}
          onAdFailedToLoad={() => setStatus('error')}
          onAdImpression={() => setStatus('shown')}
        />
      ) : (
        <ActivityIndicator />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Interstitial                                                       */
/* ------------------------------------------------------------------ */

/**
 * Interstitials follow the loader pattern:
 *   1. Create a loader once (heavy — keep it around between ads).
 *   2. `loader.loadAd({ adUnitId })` to fetch an ad.
 *   3. Wire `onAd*` callbacks on the returned ad before calling `ad.show()`.
 *
 * In production, pre-load the next ad in the background when the current one
 * is dismissed so users never wait.
 */
function InterstitialSection() {
  const loaderRef = useRef<InterstitialAdLoader | null>(null);
  const adRef = useRef<InterstitialAd | null>(null);
  const [status, setStatus] = useState<AdStatus>('idle');

  useEffect(() => {
    InterstitialAdLoader.create()
      .then((loader) => {
        loaderRef.current = loader;
      })
      .catch(() => setStatus('error'));
  }, []);

  const load = useCallback(async () => {
    if (!loaderRef.current) return;
    setStatus('loading');
    const ad = await loaderRef.current
      .loadAd({ adUnitId: 'demo-interstitial-yandex' })
      .catch(() => null);
    if (!ad) {
      setStatus('error');
      return;
    }
    ad.onAdShown = () => setStatus('shown');
    ad.onAdDismissed = () => setStatus('idle');
    ad.onAdFailedToShow = () => setStatus('error');
    adRef.current = ad;
    setStatus('loaded');
  }, []);

  const show = useCallback(() => {
    void adRef.current?.show();
  }, []);

  return (
    <Card title="Interstitial Ad" subtitle="demo-interstitial-yandex" status={status}>
      <View style={styles.row}>
        <Button label="Load" onPress={load} disabled={status === 'loading'} />
        <Button label="Show" onPress={show} disabled={status !== 'loaded'} />
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Rewarded                                                           */
/* ------------------------------------------------------------------ */

/**
 * Rewarded ads work identically to Interstitials — same loader pattern, same
 * lifecycle, same callbacks. The only practical difference is users opt in
 * to watching them in exchange for an in-app reward (coins, lives, etc.).
 */
function RewardedSection() {
  const loaderRef = useRef<RewardedAdLoader | null>(null);
  const adRef = useRef<RewardedAd | null>(null);
  const [status, setStatus] = useState<AdStatus>('idle');

  useEffect(() => {
    RewardedAdLoader.create()
      .then((loader) => {
        loaderRef.current = loader;
      })
      .catch(() => setStatus('error'));
  }, []);

  const load = useCallback(async () => {
    if (!loaderRef.current) return;
    setStatus('loading');
    const ad = await loaderRef.current
      .loadAd({ adUnitId: 'demo-rewarded-yandex' })
      .catch(() => null);
    if (!ad) {
      setStatus('error');
      return;
    }
    ad.onAdShown = () => setStatus('shown');
    ad.onAdDismissed = () => setStatus('idle');
    ad.onAdFailedToShow = () => setStatus('error');
    adRef.current = ad;
    setStatus('loaded');
  }, []);

  const show = useCallback(() => {
    void adRef.current?.show();
  }, []);

  return (
    <Card title="Rewarded Ad" subtitle="demo-rewarded-yandex" status={status}>
      <View style={styles.row}>
        <Button label="Load" onPress={load} disabled={status === 'loading'} />
        <Button label="Show" onPress={show} disabled={status !== 'loaded'} />
      </View>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  App Open                                                           */
/* ------------------------------------------------------------------ */

/**
 * App Open ads display when the user returns to the app from background.
 * Pattern: pre-load while app is active; trigger `ad.show()` on the
 * AppState 'active' transition. Don't show on the very first foreground —
 * users find it jarring.
 */
function AppOpenSection() {
  const loaderRef = useRef<AppOpenAdLoader | null>(null);
  const adRef = useRef<AppOpenAd | null>(null);
  const isFirstActivation = useRef(true);
  const [status, setStatus] = useState<AdStatus>('idle');

  useEffect(() => {
    AppOpenAdLoader.create()
      .then((loader) => {
        loaderRef.current = loader;
      })
      .catch(() => setStatus('error'));
  }, []);

  // Show the loaded ad whenever the app re-enters the foreground (after the
  // first activation). In a real app you'd also reload the next ad in the
  // ad's `onAdDismissed` callback so a fresh one is always queued.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && !isFirstActivation.current) {
        void adRef.current?.show();
      }
      if (next === 'active') {
        isFirstActivation.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  const load = useCallback(async () => {
    if (!loaderRef.current) return;
    setStatus('loading');
    const ad = await loaderRef.current
      .loadAd({ adUnitId: 'demo-appopenad-yandex' })
      .catch(() => null);
    if (!ad) {
      setStatus('error');
      return;
    }
    ad.onAdShown = () => setStatus('shown');
    ad.onAdDismissed = () => setStatus('idle');
    ad.onAdFailedToShow = () => setStatus('error');
    adRef.current = ad;
    setStatus('loaded');
  }, []);

  return (
    <Card title="App Open Ad" subtitle="demo-appopenad-yandex" status={status}>
      <Text style={styles.hint}>
        Tap Load, then background the app and return. The ad will show on resume.
      </Text>
      <Button label="Load" onPress={load} disabled={status === 'loading'} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared UI primitives                                               */
/* ------------------------------------------------------------------ */

type AdStatus = 'idle' | 'loading' | 'loaded' | 'shown' | 'error';

function Header({ sdkReady }: { sdkReady: boolean }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Yandex Mobile Ads SDK 8</Text>
      <Text style={styles.headerSubtitle}>
        Expo config plugin demo · @benfurkankilic/expo-yandex-mobile-ads
      </Text>
      <View style={[styles.pill, sdkReady ? styles.pillReady : styles.pillPending]}>
        <Text style={styles.pillText}>
          {sdkReady ? 'SDK initialized' : 'Initializing SDK…'}
        </Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <Text style={styles.footer}>
      Demo ad unit IDs always return a fill. Swap them for your real IDs from
      partner.yandex.com before shipping.
    </Text>
  );
}

function Card({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle: string;
  status: AdStatus;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitles}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <StatusBadge status={status} />
      </View>
      {children}
    </View>
  );
}

function StatusBadge({ status }: { status: AdStatus }) {
  const palette = STATUS_STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{status}</Text>
    </View>
  );
}

function Button({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const STATUS_STYLES: Record<AdStatus, { bg: string; fg: string }> = {
  idle: { bg: '#E5E7EB', fg: '#374151' },
  loading: { bg: '#FEF3C7', fg: '#92400E' },
  loaded: { bg: '#DBEAFE', fg: '#1E40AF' },
  shown: { bg: '#D1FAE5', fg: '#065F46' },
  error: { bg: '#FEE2E2', fg: '#991B1B' },
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 48 },
  header: { marginBottom: 24, marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillReady: { backgroundColor: '#D1FAE5' },
  pillPending: { backgroundColor: '#FEF3C7' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#065F46' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitles: { flexShrink: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPressed: { backgroundColor: '#374151' },
  buttonDisabled: { backgroundColor: '#E5E7EB' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  buttonTextDisabled: { color: '#9CA3AF' },
  hint: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  footer: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
