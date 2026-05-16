import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { useRefreshMemberSession } from '@/core/hooks/useRefreshMemberSession';
import { PremiumActivationTimeline } from '@/features/insurance/components/PremiumActivationTimeline';
import { usePayPremium } from '@/features/insurance/hooks/usePayPremium';
import {
  mapPremiumBilling,
  premiumStateTitle,
  type PremiumBillingState,
} from '@/features/insurance/mappers/premiumStatus';
import { deriveCoverStatus } from '@/features/insurance/mappers/dashboardMapper';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import { VirtualAccountDetailsCard } from '@/features/wallet/components/VirtualAccountDetailsCard';
import { useWalletSnapshot } from '@/features/wallet/hooks/useWallet';
import { formatNaira } from '@/shared/format/naira';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/typography/Text';
import { useAuthStore } from '@/store/authStore';

const BRAND = '#2563eb';

function stateHelp(state: PremiumBillingState, weekly: number, shortfall: number): string {
  switch (state) {
    case 'first_activation':
      return `Your first step is funding your wallet with at least ${formatNaira(weekly)}. After that, confirm the premium payment to activate cover.`;
    case 'ready_to_pay':
      return `Your wallet has enough for this week's premium (${formatNaira(weekly)}). Tap pay premium to debit your wallet and restore cover.`;
    case 'paused_insufficient':
      return `Cover is paused because a premium could not be collected. Add at least ${formatNaira(shortfall)} more, then pay premium.`;
    case 'cooldown':
      return 'Your first premium is recorded. Hospital access opens after the 3-day wait.';
    case 'paid_this_week':
      return "This week's premium is already paid. It is deducted automatically each week when your wallet has funds (usually Mondays).";
    case 'due_can_pay':
      return `You can pay ${formatNaira(weekly)} now, or wait for the automatic weekly charge when your wallet is funded.`;
    case 'due_insufficient':
      return `Add at least ${formatNaira(shortfall)} to your wallet before the next premium is due.`;
    default:
      return 'Weekly premiums appear in your premium history below.';
  }
}

export default function PremiumHubScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshSession = useRefreshMemberSession();
  const { data: wallet, isLoading, refetch, isFetching } = useWalletSnapshot();
  const { data: ledger, refetch: refetchLedger } = useTransactions();
  const payPremium = usePayPremium();

  const [showFund, setShowFund] = useState(false);
  const [payMessage, setPayMessage] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const billing = useMemo(() => (wallet ? mapPremiumBilling(wallet, user) : null), [wallet, user]);
  const coverStatus = wallet ? deriveCoverStatus(wallet, user) : 'awaiting_funding';
  const premiumHistory = useMemo(
    () => (ledger ?? []).filter((row) => row.category === 'premium_burn'),
    [ledger],
  );

  const refreshAll = useCallback(async () => {
    await refreshSession();
    await Promise.all([refetch(), refetchLedger()]);
  }, [refreshSession, refetch, refetchLedger]);

  const onPayPremium = async () => {
    if (!billing?.canPayPremium) {
      return;
    }
    setPayError(null);
    setPayMessage(null);
    try {
      const result = await payPremium.mutateAsync();
      if (result.status === 'burned') {
        setPayMessage('Premium paid successfully.');
        await refreshAll();
        return;
      }
      if (result.status === 'skipped') {
        setPayMessage(result.reason ?? 'Premium already paid for this week.');
        await refreshAll();
        return;
      }
      setPayMessage('No premium was charged. Pull to refresh or try again later.');
    } catch (e) {
      setPayError(getApiErrorMessage(e));
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/home');
  };

  const header = (
    <View className="flex-row items-center px-5 pb-2 pt-2">
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} hitSlop={12} className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100">
        <ChevronLeft size={22} color="#171717" />
      </Pressable>
      <View className="flex-1 px-2">
        <Text className="text-center text-lg font-bold text-neutral-900">Weekly premium</Text>
        <Text className="mt-0.5 text-center text-xs text-neutral-500">Pay, history & missed payments</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Refresh" onPress={() => void refreshAll()} hitSlop={12} className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100">
        {isFetching ? <ActivityIndicator size="small" color={BRAND} /> : <RefreshCw size={20} color={BRAND} />}
      </Pressable>
    </View>
  );

  if (isLoading || !wallet || !billing) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

  const title = premiumStateTitle(billing.state, billing.isFirstTime);
  const showPayButton = billing.canPayPremium && billing.state !== 'cooldown' && billing.state !== 'paid_this_week';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {header}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-2">
          <Text className="text-2xl font-black text-neutral-900">{title}</Text>
          <Text className="mt-3 text-sm leading-relaxed text-neutral-600">{stateHelp(billing.state, billing.weeklyPremiumNaira, billing.shortfallNaira)}</Text>

          <View className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">This week's premium</Text>
            <Text className="mt-1 text-3xl font-black text-neutral-900">{formatNaira(billing.weeklyPremiumNaira)}</Text>
            <Text className="mt-2 text-sm text-neutral-600">Wallet balance: {formatNaira(billing.balanceNaira)}</Text>
            {billing.shortfallNaira > 0 ? (
              <Text className="mt-1 text-sm font-medium text-amber-800">Need {formatNaira(billing.shortfallNaira)} more</Text>
            ) : null}
            {billing.lastBurnLabel ? (
              <Text className="mt-2 text-xs text-neutral-500">Last premium paid: {billing.lastBurnLabel}</Text>
            ) : null}
          </View>

          {billing.state === 'cooldown' || billing.isFirstTime ? (
            <View className="mt-6">
              <PremiumActivationTimeline coverStatus={coverStatus} hideTitle />
            </View>
          ) : null}

          {payMessage ? (
            <View className="mt-4">
              <MessageBanner variant="success" message={payMessage} />
            </View>
          ) : null}
          {payError ? (
            <View className="mt-4">
              <MessageBanner variant="error" message={payError} />
            </View>
          ) : null}

          {(billing.needsFunding || showFund) && billing.state !== 'cooldown' ? (
            <View className="mt-6">
              <Text className="mb-3 text-base font-bold text-neutral-900">Fund your wallet</Text>
              <VirtualAccountDetailsCard
                accountNumber={wallet.virtualAccountNumber ?? '—'}
                bankName={wallet.virtualAccountBankName ?? 'Partner bank'}
                accountName={user?.fullName}
                helperText="Transfer from your bank app. After it arrives, tap refresh then pay premium."
              />
            </View>
          ) : null}

          <View className="mt-8">
            <Text className="text-base font-bold text-neutral-900">Premium payment history</Text>
            <Text className="mt-1 text-xs text-neutral-500">From your wallet ledger (not the Alerts feed)</Text>
            {premiumHistory.length === 0 ? (
              <Text className="mt-4 text-sm text-neutral-500">No premium payments recorded yet.</Text>
            ) : (
              <View className="mt-3">
                {premiumHistory.map((row, idx) => (
                  <LedgerActivityRow key={row.id} item={row} showDescription showBalanceAfter bordered={idx < premiumHistory.length - 1} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 bg-white px-5 pb-6 pt-4">
        {billing.needsFunding && !showFund ? (
          <Button title="Show fund details" variant="accent" onPress={() => setShowFund(true)} />
        ) : null}
        {showPayButton ? (
          <Button
            title={payPremium.isPending ? 'Paying…' : `Pay ${formatNaira(billing.weeklyPremiumNaira)} premium`}
            variant="accent"
            disabled={payPremium.isPending}
            onPress={() => void onPayPremium()}
          />
        ) : null}
        {billing.state === 'paid_this_week' ? (
          <Button title="Back to home" variant="accent" onPress={() => router.replace('/(tabs)/home')} />
        ) : null}
        {!showPayButton && !billing.needsFunding && billing.state !== 'paid_this_week' ? (
          <Button title="Done" variant="outline" onPress={goBack} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
