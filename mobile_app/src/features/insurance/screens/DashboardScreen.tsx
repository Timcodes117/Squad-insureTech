import { useRouter } from 'expo-router';
import { Bell, Eye, EyeOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOME_CAROUSEL_SLIDES } from '@/features/insurance/constants/homeCarousel';
import {
  MOCK_DASHBOARD,
  mockStatusDetail,
  mockStatusHeadline,
} from '@/features/insurance/constants/mockDashboard';
import { MOCK_LEDGER } from '@/features/transactions/constants/mockLedger';
import { MOCK_WALLET } from '@/features/wallet/constants/mockWallet';
import { Card } from '@/shared/ui/Card';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const AVATAR = require('../../../../assets/woman.jpg');
const CAROUSEL_INTERVAL_MS = 5200;
const MOCK_FIRST_NAME = 'Aisha';

function maskBalance(): string {
  return '₦ •••••••';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<ScrollView | null>(null);
  const slideCount = HOME_CAROUSEL_SLIDES.length;
  const slideWidth = windowWidth;

  const { coverStatus, coverageRemainingNaira, coverageCapNaira, cooldownHoursLeft, planLabel, resetHint } = MOCK_DASHBOARD;
  const used = Math.max(0, coverageCapNaira - coverageRemainingNaira);
  const pct = coverageCapNaira > 0 ? Math.min(100, Math.round((used / coverageCapNaira) * 100)) : 0;

  const recent = MOCK_LEDGER.slice(0, 5);
  const balance = MOCK_WALLET.balanceNaira;

  useEffect(() => {
    if (slideWidth <= 0 || slideCount === 0) {
      return;
    }
    const id = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % slideCount;
        carouselRef.current?.scrollTo({ x: next * slideWidth, animated: true });
        return next;
      });
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [slideCount, slideWidth]);

  const onCarouselScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / slideWidth);
      setCarouselIndex(Math.max(0, Math.min(slideCount - 1, idx)));
    },
    [slideWidth, slideCount],
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <View className="flex-row items-center gap-3">
            <Image source={AVATAR} className="h-11 w-11 rounded-full border border-neutral-200 bg-white" accessibilityIgnoresInvertColors />
            <View>
              <Text className="text-sm text-neutral-500">Welcome back</Text>
              <Text className="text-lg font-bold text-neutral-900">Hi {MOCK_FIRST_NAME}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={12}
            onPress={() => router.push('/(tabs)/notifications')}
            className="h-11 w-11 items-center justify-center rounded-full bg-white border border-neutral-200 active:bg-neutral-100"
          >
            <Bell size={22} color="#2563eb" />
          </Pressable>
        </View>

        {/* Wallet card — fintech balance */}
        <View className="mx-5 mt-2 rounded-3xl bg-white px-6 py-8 shadow-sm shadow-black/5 border border-neutral-100">
          <Text className="text-center text-sm font-medium text-neutral-500">Wallet balance</Text>
          <Text className="mt-2 text-center text-4xl font-black tracking-tight text-neutral-900">
            {balanceVisible ? formatNaira(balance) : maskBalance()}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
            onPress={() => setBalanceVisible((v) => !v)}
            className="mt-4 flex-row items-center justify-center gap-2 self-center rounded-full bg-brand-50 px-4 py-2 active:opacity-80"
          >
            {balanceVisible ? <EyeOff size={18} color="#1d4ed8" /> : <Eye size={18} color="#1d4ed8" />}
            <Text className="text-sm font-semibold text-brand-800">{balanceVisible ? 'Hide balance' : 'Show balance'}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/wallet')} className="mt-5 self-center active:opacity-70">
            <Text className="text-sm font-semibold text-brand-700">Fund wallet</Text>
          </Pressable>
        </View>

        {/* Carousel */}
        <View className="mt-6">
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onCarouselScrollEnd}
            decelerationRate="fast"
          >
            {HOME_CAROUSEL_SLIDES.map((slide) => (
              <View key={slide.id} style={{ width: slideWidth }} className="px-5">
                <Card className="min-h-[148px] rounded-2xl border border-neutral-200 bg-white p-5">
                  <Text className="text-base font-bold text-neutral-900">{slide.title}</Text>
                  <Text className="mt-2 text-sm leading-relaxed text-neutral-600">{slide.body}</Text>
                  <Text className="mt-3 text-xs font-medium text-brand-700">{slide.foot}</Text>
                </Card>
              </View>
            ))}
          </ScrollView>
          <View className="mt-3 flex-row items-center justify-center gap-2">
            {HOME_CAROUSEL_SLIDES.map((s, i) => (
              <View
                key={s.id}
                className={`h-2 rounded-full ${i === carouselIndex ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'}`}
              />
            ))}
          </View>
        </View>

        {/* Cover strip (compact) */}
        <View className="mx-5 mt-6 rounded-2xl border border-brand-100 bg-brand-50/90 p-4">
          <Text className="text-xs font-bold uppercase tracking-wide text-brand-800">{mockStatusHeadline(coverStatus)}</Text>
          <Text className="mt-1 text-sm leading-relaxed text-neutral-700">{mockStatusDetail(coverStatus, cooldownHoursLeft)}</Text>
          <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
            <View className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
          </View>
          <Text className="mt-2 text-xs text-neutral-500">
            {formatNaira(coverageRemainingNaira)} left of {formatNaira(coverageCapNaira)} · {planLabel}
          </Text>
          <Text className="mt-1 text-[11px] leading-snug text-neutral-400">{resetHint}</Text>
        </View>

        {/* Recent activity */}
        <View className="mt-8 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-neutral-900">Recent activity</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
              <Text className="text-sm font-semibold text-brand-700">View all</Text>
            </Pressable>
          </View>
          <View className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {recent.map((row, idx) => {
              const sign = row.type === 'credit' ? '+' : '−';
              const amtColor = row.type === 'credit' ? 'text-brand-700' : 'text-neutral-900';
              const isLast = idx === recent.length - 1;
              return (
                <Pressable
                  key={row.id}
                  onPress={() => router.push('/(tabs)/transactions')}
                  className={`flex-row items-center justify-between px-4 py-3.5 active:bg-neutral-50 ${!isLast ? 'border-b border-neutral-100' : ''}`}
                >
                  <View className="mr-3 flex-1">
                    <Text className="text-sm font-semibold text-neutral-900">{row.title}</Text>
                    <Text className="mt-0.5 text-xs text-neutral-500">{row.dateLabel}</Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-sm font-bold ${amtColor}`}>
                      {sign}
                      {formatNaira(row.amountNaira)}
                    </Text>
                    <Text className="mt-0.5 text-[10px] text-neutral-400">Bal {formatNaira(row.balanceAfterNaira)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
