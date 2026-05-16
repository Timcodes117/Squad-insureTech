import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronLeft, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { koboToNaira } from '@/core/api/kobo';
import { useRefreshMemberSession } from '@/core/hooks/useRefreshMemberSession';
import { PremiumActivationTimeline } from '@/features/insurance/components/PremiumActivationTimeline';
import { hasMetFundingRequirement, mapWalletToDashboard } from '@/features/insurance/mappers/dashboardMapper';
import { VirtualAccountDetailsCard } from '@/features/wallet/components/VirtualAccountDetailsCard';
import { useWalletSnapshot } from '@/features/wallet/hooks/useWallet';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Button } from '@/shared/ui/Button';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';
import { useAuthStore } from '@/store/authStore';

const BRAND = '#2563eb';
const POLL_MS = 5000;

type FlowStep = 'intro' | 'fund' | 'waiting' | 'success';

export default function FirstPremiumFlowScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const refreshSession = useRefreshMemberSession();
  const { data: wallet, isLoading, refetch, isFetching } = useWalletSnapshot();

  const [step, setStep] = useState<FlowStep>('intro');
  const [pollError, setPollError] = useState<string | null>(null);

  const premiumNaira = wallet ? koboToNaira(wallet.weeklyPremium) : 0;
  const balanceNaira = wallet ? koboToNaira(wallet.balance) : 0;
  const shortfallNaira = Math.max(0, premiumNaira - balanceNaira);

  const dashboard = useMemo(() => (wallet ? mapWalletToDashboard(wallet, user) : null), [wallet, user]);
  const coverStatus = dashboard?.coverStatus ?? 'awaiting_funding';
  const fundedEnough = wallet ? hasMetFundingRequirement(wallet) : false;
  const activated = wallet?.isActive && fundedEnough;

  useEffect(() => {
    if (!wallet || isLoading) {
      return;
    }
    if (activated && step !== 'waiting') {
      setStep('success');
    } 
  }, [wallet, isLoading, activated, step]);

  const checkPayment = useCallback(async () => {
    setPollError(null);
    try {
      await refreshSession();
      const result = await refetch();
      const snapshot = result.data;
      if (snapshot && hasMetFundingRequirement(snapshot) && snapshot.isActive) {
        setStep('success');
        await queryClient.invalidateQueries({ queryKey: ['insurance'] });
        await queryClient.invalidateQueries({ queryKey: ['wallet'] });
        await queryClient.invalidateQueries({ queryKey: ['transactions', 'ledger'] });
        await queryClient.invalidateQueries({ queryKey: ['notifications'] });
        return true;
      }
      return false;
    } catch {
      setPollError('Could not refresh your wallet. Check your connection and try again.');
      return false;
    }
  }, [refreshSession, refetch, queryClient]);

  useEffect(() => {
    if (step !== 'waiting') {
      return;
    }
    const tick = () => void checkPayment();
    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [step, checkPayment]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/home');
  };

  const header = (
    <View className="flex-row items-center px-5 pb-2 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={goBack}
        hitSlop={12}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100"
      >
        <ChevronLeft size={22} color="#171717" />
      </Pressable>
      <View className="flex-1 px-2">
        <Text className="text-center text-lg font-bold text-neutral-900">First premium</Text>
        <Text className="mt-0.5 text-center text-xs text-neutral-500">Activate your hospital cover</Text>
      </View>
      <View className="h-11 w-11" />
    </View>
  );

  if (isLoading || !wallet) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'success' || (activated && step !== 'waiting')) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {header}
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="mt-6 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <CheckCircle2 size={36} color={BRAND} />
            </View>
            <Text className="mt-5 text-center text-2xl font-black text-neutral-900">Cover activated</Text>
            <Text className="mt-3 px-2 text-center text-sm leading-relaxed text-neutral-600">
              Hospital visits unlock after a 3-day wait (72 hours) from your first payment.
            </Text>
          </View>

          <View className="mt-8">
            <PremiumActivationTimeline coverStatus="cooldown" hoursLeft={dashboard?.cooldownHoursLeft ?? 72} hideTitle />
          </View>

          <View className="mt-8 gap-3">
            <Button title="Back to home" variant="accent" onPress={() => router.replace('/(tabs)/home')} />
            <Button title="View coverage" variant="outline" onPress={() => router.replace('/(tabs)/coverage')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {header}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-4">
          {step === 'intro' ? (
            <>
              <Text className="text-2xl font-black tracking-tight text-neutral-900">Pay your first premium</Text>
              <Text className="mt-3 text-sm leading-relaxed text-neutral-600">
                Transfer at least {formatNaira(premiumNaira)} from your bank app into your BetaHealth wallet. Cover turns
                on automatically when we receive the payment.
              </Text>

              <View className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your weekly premium</Text>
                <Text className="mt-1 text-3xl font-black text-neutral-900">{formatNaira(premiumNaira)}</Text>
                <Text className="mt-2 text-sm text-neutral-600">
                  Current balance: {formatNaira(balanceNaira)}
                  {shortfallNaira > 0 ? ` · Need ${formatNaira(shortfallNaira)} more` : ''}
                </Text>
              </View>

              <View className="mt-6">
                <PremiumActivationTimeline coverStatus={coverStatus} hoursLeft={dashboard?.cooldownHoursLeft} hideTitle />
              </View>
            </>
          ) : null}

          {step === 'fund' || step === 'waiting' ? (
            <>
              <Text className="text-xl font-bold text-neutral-900">Send your transfer</Text>
              <Text className="mt-2 text-sm leading-relaxed text-neutral-600">
                Use the account below in your bank app. Send at least {formatNaira(premiumNaira)} — transfers usually
                arrive within a few minutes.
              </Text>

              <View className="mt-5">
                <VirtualAccountDetailsCard
                  accountNumber={wallet.virtualAccountNumber ?? '—'}
                  bankName={wallet.virtualAccountBankName ?? 'Partner bank'}
                  accountName={user?.fullName}
                  helperText="Use this as the beneficiary account. Your name on the transfer should match your BetaHealth profile."
                />
              </View>

              {step === 'waiting' ? (
                <View className="mt-6 items-center rounded-2xl border border-brand-100 bg-brand-50 px-4 py-6">
                  <ActivityIndicator color={BRAND} />
                  <Text className="mt-4 text-center text-sm font-semibold text-brand-800">Waiting for your transfer</Text>
                  <Text className="mt-2 text-center text-xs leading-relaxed text-neutral-600">
                    We check your wallet every few seconds. You can leave this screen and come back — pull to refresh on
                    home when done.
                  </Text>
                  {pollError ? (
                    <View className="mt-4 w-full">
                      <MessageBanner variant="warning" message={pollError} />
                    </View>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void checkPayment()}
                    disabled={isFetching}
                    className="mt-4 flex-row items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 active:opacity-80"
                  >
                    <RefreshCw size={16} color={BRAND} />
                    <Text className="text-sm font-semibold text-brand-700">{isFetching ? 'Checking…' : 'Check now'}</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 bg-white px-5 pb-6 pt-4">
        {step === 'intro' ? (
          <Button title="Continue to payment details" variant="accent" onPress={() => setStep('fund')} />
        ) : null}
        {step === 'fund' ? (
          <View className="gap-3">
            <Button title="I've sent the transfer" variant="accent" onPress={() => setStep('waiting')} />
            <Button title="Back" variant="outline" onPress={() => setStep('intro')} />
          </View>
        ) : null}
        {step === 'waiting' ? (
          <Button title="Cancel" variant="outline" onPress={() => setStep('fund')} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
