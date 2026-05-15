import { useRouter } from 'expo-router';
import { Bell, QrCode } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
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

import { FirstPremiumWarningBanner } from '@/features/insurance/components/FirstPremiumWarningBanner';
import { HomeQuickActions } from '@/features/insurance/components/HomeQuickActions';
import { buildHomeInfoSlides } from '@/features/insurance/constants/homeInfoSlides';
import {
  MOCK_DASHBOARD,
  mockStatusDetail,
  mockStatusHeadline,
} from '@/features/insurance/constants/mockDashboard';
import { MOCK_LEDGER } from '@/features/transactions/constants/mockLedger';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import { WalletBalanceCard } from '@/features/wallet/components/WalletBalanceCard';
import { MOCK_WALLET } from '@/features/wallet/constants/mockWallet';
import { MemberQrModal } from '@/features/profile/components/MemberQrModal';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const AVATAR = require('../../../../assets/woman.jpg');
const MOCK_FIRST_NAME = 'Aisha';
const SWIPE_PAGES = 2;

function maskBalance(): string {
  return '₦ •••••••';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [pagerIndex, setPagerIndex] = useState(0);
  const [infoIndex, setInfoIndex] = useState(0);
  const [memberQrOpen, setMemberQrOpen] = useState(false);
  const pagerRef = useRef<ScrollView | null>(null);
  const infoRef = useRef<ScrollView | null>(null);
  const slideWidth = windowWidth;

  const { coverStatus, coverageRemainingNaira, coverageCapNaira, cooldownHoursLeft, planLabel, resetHint } = MOCK_DASHBOARD;
  const used = Math.max(0, coverageCapNaira - coverageRemainingNaira);
  const pct = coverageCapNaira > 0 ? Math.min(100, Math.round((used / coverageCapNaira) * 100)) : 0;

  const infoSlides = useMemo(
    () =>
      buildHomeInfoSlides({
        coverageRemainingNaira,
        coverageCapNaira,
        planLabel,
      }),
    [coverageRemainingNaira, coverageCapNaira, planLabel],
  );
  const infoCount = infoSlides.length;

  const recent = MOCK_LEDGER.slice(0, 5);
  const balance = MOCK_WALLET.balanceNaira;

  const onPagerScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / slideWidth);
      setPagerIndex(Math.max(0, Math.min(SWIPE_PAGES - 1, idx)));
    },
    [slideWidth],
  );

  const onInfoScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / slideWidth);
      setInfoIndex(Math.max(0, Math.min(infoCount - 1, idx)));
    },
    [slideWidth, infoCount],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-8 pb-2">
          <View className="flex-row items-center gap-3">
            <Image source={AVATAR} className="h-11 w-11 rounded-full bg-neutral-100" accessibilityIgnoresInvertColors />
            <View>
              <Text className="text-sm text-neutral-500">Welcome back</Text>
              <Text className="text-lg font-bold text-neutral-900">Hi {MOCK_FIRST_NAME}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show my member QR code"
              hitSlop={12}
              onPress={() => setMemberQrOpen(true)}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100"
            >
              <QrCode size={22} color="#2563eb" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={12}
              onPress={() => router.push('/(tabs)/notifications')}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100"
            >
              <Bell size={22} color="#2563eb" />
            </Pressable>
          </View>
        </View>

        {/* Swipe: wallet | cover (manual only) */}
        <View className="mt-2">
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPagerScrollEnd}
            decelerationRate="fast"
          >
            {/* Wallet */}
            <View style={{ width: slideWidth }} className="px-5 pt-2">
              <WalletBalanceCard
                variant="home"
                balanceNaira={balance}
                balanceVisible={balanceVisible}
                onToggleBalance={() => setBalanceVisible((v) => !v)}
                onFundPress={() => router.push('/(tabs)/wallet')}
                onWithdrawPress={() => router.push('/(tabs)/wallet')}
              />
            </View>

            {/* Cover */}
            <View style={{ width: slideWidth }} className="px-5 pt-2">
              <View className="rounded-3xl bg-brand-50/80 px-5 py-8">
                <Text className="text-center text-sm font-medium text-brand-900/80">Cover balance</Text>
                <Text className="mt-2 text-center text-4xl font-black tracking-tight text-neutral-900">
                  {balanceVisible ? formatNaira(coverageRemainingNaira) : maskBalance()}
                </Text>
                <Text className="mt-2 text-center text-xs text-neutral-600">
                  of {formatNaira(coverageCapNaira)} monthly hospital help · {planLabel}
                </Text>
                <View className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/90">
                  <View className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
                </View>
                <Text className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-brand-800">
                  {mockStatusHeadline(coverStatus)}
                </Text>
                {/* <Text className="mt-2 text-center text-sm leading-relaxed text-neutral-700">
                  {mockStatusDetail(coverStatus, cooldownHoursLeft)}
                </Text> */}
                <Text className="mt-3 text-center text-[11px] leading-snug text-neutral-500">{resetHint}</Text>
              </View>
            </View>
          </ScrollView>
          <View className="mt-3 flex-row items-center justify-center gap-2">
            {Array.from({ length: SWIPE_PAGES }).map((_, i) => (
              <View key={i} className={`h-2 rounded-full ${i === pagerIndex ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'}`} />
            ))}
          </View>
        </View>

        <HomeQuickActions />
        <FirstPremiumWarningBanner />

        {/* Tips & rules — manual swipe */}
        <View className="mt-8">
          <ScrollView
            ref={infoRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onInfoScrollEnd}
            decelerationRate="fast"
          >
            {infoSlides.map((slide) => (
              <View key={slide.id} style={{ width: slideWidth }} className="px-5">
                <View
                  // className={
                  //   slide.variant === 'brand'
                  //     ? 'rounded-2xl border border-brand-200 bg-brand-50/80 px-5 py-5'
                  //     : 'rounded-2xl border border-neutral-200 bg-white px-5 py-5'
                  // }
                >
                  <Image source={AVATAR} className="h-40 w-full rounded-2xl bg-neutral-100" accessibilityIgnoresInvertColors />
                  <Text className="text-base font-bold text-neutral-900 mt-5">{slide.title}</Text>
                  <Text className="mt-1 text-sm leading-relaxed text-neutral-600">{slide.body}</Text>
                  <Text
                    className={`mt-3 text-xs font-medium ${slide.variant === 'brand' ? 'text-brand-800' : 'text-neutral-500'}`}
                  >
                    {slide.foot}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View className="mt-3 flex-row flex-wrap items-center justify-center gap-2">
            {infoSlides.map((s, i) => (
              <View key={s.id} className={`h-2 rounded-full ${i === infoIndex ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'}`} />
            ))}
          </View>
        </View>

        {/* Recent activity */}
        <View className="mt-10 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-neutral-900">Recent activity</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
              <Text className="text-sm font-semibold text-brand-700">View all</Text>
            </Pressable>
          </View>
          <View>
            {recent.map((row, idx) => (
              <LedgerActivityRow
                key={row.id}
                item={row}
                showBalanceAfter
                bordered={idx < recent.length - 1}
                onPress={() => router.push('/(tabs)/transactions')}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <MemberQrModal visible={memberQrOpen} onClose={() => setMemberQrOpen(false)} />
    </SafeAreaView>
  );
}
