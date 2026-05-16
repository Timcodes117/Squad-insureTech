import { useRouter } from 'expo-router';
import { Bell, QrCode } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { usePullToRefresh, refetchAll } from '@/core/hooks/usePullToRefresh';
import { useRefreshMemberSession } from '@/core/hooks/useRefreshMemberSession';
import { FirstPremiumWarningBanner } from '@/features/insurance/components/FirstPremiumWarningBanner';
import { HomeQuickActions } from '@/features/insurance/components/HomeQuickActions';
import { buildHomeInfoSlides } from '@/features/insurance/constants/homeInfoSlides';
import { statusHeadline } from '@/features/insurance/mappers/dashboardMapper';
import { useInsurance } from '@/features/insurance/hooks/useInsurance';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { MemberQrModal } from '@/features/profile/components/MemberQrModal';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import { WalletBalanceCard } from '@/features/wallet/components/WalletBalanceCard';
import { useWallet } from '@/features/wallet/hooks/useWallet';
import { formatNaira } from '@/shared/format/naira';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/typography/Text';
import { useAuthStore } from '@/store/authStore';

const AVATAR = require('../../../../assets/woman.jpg');
const SWIPE_PAGES = 2;
const INFO_AUTO_INTERVAL_MS = 5500;

function maskBalance(): string {
  return '₦ •••••••';
}

function firstNameFromFull(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? 'Member';
}

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { width: windowWidth } = useWindowDimensions();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [pagerIndex, setPagerIndex] = useState(0);
  const [infoIndex, setInfoIndex] = useState(0);
  const [memberQrOpen, setMemberQrOpen] = useState(false);
  const pagerRef = useRef<ScrollView | null>(null);
  const infoRef = useRef<ScrollView | null>(null);
  const infoAutoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideWidth = windowWidth;

  const refreshSession = useRefreshMemberSession();
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: dashboard, isLoading: coverLoading, refetch: refetchInsurance } = useInsurance();
  const needsFirstPremium = dashboard?.coverStatus === 'awaiting_funding';
  const {
    data: ledger,
    isLoading: ledgerLoading,
    isError: ledgerError,
    error: ledgerErrorDetail,
    refetch: refetchTransactions,
  } = useTransactions();
  const { data: profileBundle, refetch: refetchProfile } = useProfile();

  const onRefresh = useCallback(
    () =>
      refetchAll(
        refreshSession,
        () => refetchWallet(),
        () => refetchInsurance(),
        () => refetchTransactions(),
        () => refetchProfile(),
      ),
    [refreshSession, refetchWallet, refetchInsurance, refetchTransactions, refetchProfile],
  );
  const { refreshControl } = usePullToRefresh(onRefresh);

  const coverStatus = dashboard?.coverStatus ?? 'awaiting_funding';
  const displayRemainingNaira = dashboard?.displayRemainingNaira ?? dashboard?.coverageRemainingNaira ?? 0;
  const displayCapNaira = dashboard?.displayCapNaira ?? dashboard?.coverageCapNaira ?? 20_000;
  const coverageCapNaira = dashboard?.coverageCapNaira ?? 20_000;
  const coverageProgressPct = dashboard?.coverageProgressPct ?? 0;
  const cooldownHoursLeft = dashboard?.cooldownHoursLeft ?? 0;
  const planLabel = dashboard?.planLabel ?? '';
  const resetHint = dashboard?.resetHint ?? '';
  const weekOnePeriodCapApplies = dashboard?.weekOnePeriodCapApplies ?? false;
  const weekOneCapNaira = dashboard?.weekOneCapNaira ?? 5_000;
  const weekOneEndsLabel = dashboard?.weekOneEndsLabel ?? null;
  const coverCardTitle = dashboard?.coverCardTitle ?? 'Cover balance';
  const coverCardSubtitle = dashboard?.coverCardSubtitle ?? `of ${formatNaira(displayCapNaira)} monthly hospital help`;
  const coverJourneyExplainer = dashboard?.coverJourneyExplainer ?? resetHint;

  const infoSlides = useMemo(
    () =>
      buildHomeInfoSlides({
        coverJourneyPhase: dashboard?.coverJourneyPhase,
        weekOneEndsLabel,
        monthlyCapNaira: coverageCapNaira,
      }),
    [dashboard?.coverJourneyPhase, weekOneEndsLabel, coverageCapNaira],
  );
  const infoCount = infoSlides.length;
  const loading = walletLoading || coverLoading;

  const recent = (ledger ?? []).slice(0, 5);
  const balance = wallet?.balanceNaira ?? 0;
  const displayName = user?.fullName ? firstNameFromFull(user.fullName) : 'Member';

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

  const pauseInfoAutoPlay = useCallback(() => {
    if (infoAutoTimerRef.current) {
      clearInterval(infoAutoTimerRef.current);
      infoAutoTimerRef.current = null;
    }
  }, []);

  const startInfoAutoPlay = useCallback(() => {
    pauseInfoAutoPlay();
    if (infoCount <= 1) return;

    infoAutoTimerRef.current = setInterval(() => {
      setInfoIndex((prev) => {
        const next = (prev + 1) % infoCount;
        infoRef.current?.scrollTo({ x: next * slideWidth, animated: true });
        return next;
      });
    }, INFO_AUTO_INTERVAL_MS);
  }, [infoCount, pauseInfoAutoPlay, slideWidth]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && infoCount > 1) {
        startInfoAutoPlay();
      }
      return pauseInfoAutoPlay;
    }, [loading, infoCount, startInfoAutoPlay, pauseInfoAutoPlay]),
  );

  const onInfoScrollEndWithAutoResume = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onInfoScrollEnd(e);
      startInfoAutoPlay();
    },
    [onInfoScrollEnd, startInfoAutoPlay],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={refreshControl}
      >
        <View className="flex-row items-center justify-between px-5 pt-8 pb-2">
          <View className="flex-row items-center gap-3">
            <Image source={AVATAR} className="h-11 w-11 rounded-full bg-neutral-100" accessibilityIgnoresInvertColors />
            <View>
              <Text className="text-sm text-neutral-500">Welcome back</Text>
              <Text className="text-lg font-bold text-neutral-900">Hi {displayName}</Text>
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

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View className="mt-2">
            <ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onPagerScrollEnd}
              decelerationRate="fast"
            >
              <View style={{ width: slideWidth }} className="px-5 pt-2">
                <WalletBalanceCard
                  variant="home"
                  balanceNaira={balance}
                  virtualAccountNumber={wallet?.virtualAccountNumber}
                  bankName={wallet?.bankName}
                  balanceVisible={balanceVisible}
                  onToggleBalance={() => setBalanceVisible((v) => !v)}
                  onFundPress={() => router.push('/(tabs)/wallet')}
                  onWithdrawPress={() => router.push('/withdraw')}
                />
              </View>

              <View style={{ width: slideWidth }} className="px-5 pt-2">
                <View className="rounded-3xl bg-brand-50/80 px-5 py-8">
                  <Text className="text-center text-sm font-medium text-brand-900/80">{coverCardTitle}</Text>
                  <Text className="mt-2 text-center text-4xl font-black tracking-tight text-neutral-900">
                    {balanceVisible ? formatNaira(displayRemainingNaira) : maskBalance()}
                  </Text>
                  <Text className="mt-2 text-center text-xs leading-snug text-neutral-600">
                    {coverCardSubtitle}
                    {coverStatus === 'active' && !weekOnePeriodCapApplies ? <> · {planLabel}</> : null}
                  </Text>
                  <View className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/90">
                    <View className="h-full rounded-full bg-brand-600" style={{ width: `${coverageProgressPct}%` }} />
                  </View>
                  <Text className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-brand-800">
                    {statusHeadline(coverStatus, weekOnePeriodCapApplies)}
                  </Text>
                  <Text className="mt-3 text-center text-[11px] leading-snug text-neutral-500">{coverJourneyExplainer}</Text>
                </View>
              </View>
            </ScrollView>
            <View className="mt-3 flex-row items-center justify-center gap-2">
              {Array.from({ length: SWIPE_PAGES }).map((_, i) => (
                <View key={i} className={`h-2 rounded-full ${i === pagerIndex ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'}`} />
              ))}
            </View>
          </View>
        )}

        <HomeQuickActions />
        <FirstPremiumWarningBanner />

        <View className="mt-8">
          <Text className="mb-3 px-5 text-lg font-bold text-neutral-900">Updates</Text>
          <ScrollView
            ref={infoRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={pauseInfoAutoPlay}
            onMomentumScrollEnd={onInfoScrollEndWithAutoResume}
            decelerationRate="fast"
          >
            {infoSlides.map((slide) => (
              <View key={slide.id} style={{ width: slideWidth }} className="px-5">
                <View className="min-h-[108px] justify-center rounded-2xl bg-neutral-100 px-4 py-4">
                  <Text className="text-base font-bold text-neutral-900">{slide.title}</Text>
                  <Text className="mt-2 text-sm leading-relaxed text-neutral-600">{slide.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          {infoCount > 1 ? (
            <View className="mt-3 flex-row items-center justify-center gap-2">
              {infoSlides.map((s, i) => (
                <View key={s.id} className={`h-2 rounded-full ${i === infoIndex ? 'w-6 bg-brand-600' : 'w-2 bg-neutral-300'}`} />
              ))}
            </View>
          ) : null}
        </View>

        <View className="mt-10 px-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-neutral-900">Recent activity</Text>
              <Text className="mt-0.5 text-xs text-neutral-500">Wallet ledger · Alerts are separate</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
              <Text className="text-sm font-semibold text-brand-700">View all</Text>
            </Pressable>
          </View>
          {ledgerLoading ? (
            <ActivityIndicator className="py-8" color="#2563eb" />
          ) : ledgerError ? (
            <View className="py-2">
              <MessageBanner variant="error" message={getApiErrorMessage(ledgerErrorDetail)} />
              <View className="mt-3">
                <Button title="Retry" variant="outline" onPress={() => void refetchTransactions()} />
              </View>
            </View>
          ) : (
            <View>
              {recent.map((row, idx) => (
                <LedgerActivityRow
                  key={row.id}
                  item={row}
                  showBalanceAfter
                  showDescription
                  bordered={idx < recent.length - 1}
                  onPress={() => router.push('/(tabs)/transactions')}
                />
              ))}
              {recent.length === 0 ? (
                <View className="py-4">
                  <Text className="text-center text-sm text-neutral-500">
                    {needsFirstPremium
                      ? 'No wallet activity yet. Pay your first premium to activate cover.'
                      : 'No wallet activity yet. Fund your wallet to get started.'}
                  </Text>
                  {needsFirstPremium ? (
                    <View className="mt-4 mx-auto max-w-xs">
                      <Button title="Pay your first premium" variant="accent" onPress={() => router.push('/premium')} />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      <MemberQrModal
        visible={memberQrOpen}
        onClose={() => setMemberQrOpen(false)}
        qrPayload={profileBundle?.card?.qrPayload}
        membershipNumber={profileBundle?.card?.membershipNumber ?? user?.membershipNumber}
        memberName={user?.fullName}
      />
    </SafeAreaView>
  );
}
