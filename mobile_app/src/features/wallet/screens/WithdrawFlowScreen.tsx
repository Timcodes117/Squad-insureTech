import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlertCircle, ChevronLeft, Landmark } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { koboToNaira } from '@/core/api/kobo';
import { ConnectBankModal } from '@/features/wallet/components/ConnectBankModal';
import { useWallet, useWithdraw, useWithdrawable } from '@/features/wallet/hooks/useWallet';
import { maskAccountNumber } from '@/features/wallet/store/linkedPayoutAccountStore';
import { useLinkedPayoutAccountStore } from '@/features/wallet/store/linkedPayoutAccountStore';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Button } from '@/shared/ui/Button';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Step = 'amount' | 'review' | 'success';

function parseAmountNaira(text: string): number {
  const n = Number(text.replace(/\D/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function WithdrawFlowScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydratePayout = useLinkedPayoutAccountStore((s) => s.hydrate);
  const payoutAccount = useLinkedPayoutAccountStore((s) => s.account);
  const payoutHydrated = useLinkedPayoutAccountStore((s) => s.hydrated);

  const { data: wallet } = useWallet();
  const { data: withdrawable, refetch: refetchWithdrawable } = useWithdrawable();
  const withdrawMutation = useWithdraw();

  const [step, setStep] = useState<Step>('amount');
  const [amountText, setAmountText] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balanceNaira = wallet?.balanceNaira ?? 0;
  const maxWithdrawNaira = withdrawable ? koboToNaira(withdrawable.withdrawableAmount) : balanceNaira;
  const reservedNaira = withdrawable ? koboToNaira(withdrawable.reserved) : 0;
  const parsedAmount = useMemo(() => parseAmountNaira(amountText), [amountText]);

  const canContinue =
    parsedAmount > 0 && parsedAmount <= maxWithdrawNaira && Boolean(payoutAccount) && !withdrawMutation.isPending;

  useEffect(() => {
    void hydratePayout();
  }, [hydratePayout]);

  useEffect(() => {
    if (payoutHydrated && !payoutAccount) {
      setConnectOpen(true);
    }
  }, [payoutHydrated, payoutAccount]);

  const setQuickAmount = useCallback(
    (fraction: number) => {
      const value = Math.floor(maxWithdrawNaira * fraction);
      setAmountText(value > 0 ? String(value) : '');
      setError(null);
    },
    [maxWithdrawNaira],
  );

  const goBack = () => {
    if (step === 'review') {
      setStep('amount');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/wallet');
  };

  const submitWithdraw = async () => {
    if (!payoutAccount || !canContinue) {
      return;
    }
    setError(null);
    try {
      await withdrawMutation.mutateAsync({
        amountNaira: parsedAmount,
        bankCode: payoutAccount.bankCode,
        accountNumber: payoutAccount.accountNumber,
      });
      await refetchWithdrawable();
      void queryClient.invalidateQueries({ queryKey: ['insurance'] });
      setStep('success');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const header = (
    <View className="flex-row items-center border-b border-neutral-100 px-5 pb-3 pt-2">
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
        <Text className="text-center text-lg font-bold text-neutral-900">
          {step === 'success' ? 'Withdrawal sent' : 'Withdraw to bank'}
        </Text>
        {step !== 'success' ? (
          <Text className="mt-0.5 text-center text-xs text-neutral-500">Step {step === 'amount' ? 1 : 2} of 2</Text>
        ) : null}
      </View>
      <View className="h-11 w-11" />
    </View>
  );

  if (!payoutHydrated) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {header}
        <View className="flex-1 px-5 pt-8">
          <MessageBanner
            variant="success"
            title="Withdrawal initiated"
            message={
              payoutAccount
                ? `${formatNaira(parsedAmount)} is on its way to ${payoutAccount.bankName} ${maskAccountNumber(payoutAccount.accountNumber)}. It may take a few minutes to arrive.`
                : `${formatNaira(parsedAmount)} withdrawal submitted.`
            }
          />
          <View className="mt-8 gap-3">
            <Button title="Back to wallet" variant="accent" onPress={() => router.replace('/(tabs)/wallet')} />
            <Button title="View activity" variant="outline" onPress={() => router.replace('/(tabs)/transactions')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        {header}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {payoutAccount ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConnectOpen(true)}
              className="mt-4 flex-row items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 active:bg-neutral-100"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                <Landmark size={20} color={BRAND} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-neutral-500">Payout account</Text>
                <Text className="text-sm font-semibold text-neutral-900">{payoutAccount.bankName}</Text>
                <Text className="text-sm text-neutral-600">
                  {maskAccountNumber(payoutAccount.accountNumber)} · {payoutAccount.accountName}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-brand-700">Change</Text>
            </Pressable>
          ) : (
            <View className="mt-4">
              <MessageBanner
                variant="info"
                title="Link a bank account"
                message="Withdrawals are sent to a Nigerian bank account in your name."
              />
              <View className="mt-3">
                <Button title="Connect bank account" variant="accent" onPress={() => setConnectOpen(true)} />
              </View>
            </View>
          )}

          {step === 'amount' ? (
            <>
              <Text className="mt-8 text-sm font-medium text-neutral-500">Available to withdraw</Text>
              <Text className="mt-1 text-3xl font-black text-neutral-900">{formatNaira(maxWithdrawNaira)}</Text>
              {reservedNaira > 0 ? (
                <Text className="mt-2 text-sm text-neutral-600">
                  {withdrawable?.reason ??
                    `${formatNaira(reservedNaira)} is held for this week's premium and cannot be withdrawn yet.`}
                </Text>
              ) : null}
              <Text className="mt-1 text-xs text-neutral-500">Wallet balance {formatNaira(balanceNaira)}</Text>

              <Text className="mt-8 text-sm font-semibold text-neutral-800">Amount</Text>
              <TextInput
                value={amountText}
                onChangeText={(t) => {
                  setAmountText(t.replace(/\D/g, ''));
                  setError(null);
                }}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#a3a3a3"
                className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-3xl font-bold text-neutral-900"
                accessibilityLabel="Withdrawal amount in naira"
              />

              <View className="mt-4 flex-row flex-wrap gap-2">
                {[
                  { label: '25%', fraction: 0.25 },
                  { label: '50%', fraction: 0.5 },
                  { label: 'Max', fraction: 1 },
                ].map((chip) => (
                  <Pressable
                    key={chip.label}
                    accessibilityRole="button"
                    onPress={() => setQuickAmount(chip.fraction)}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-2 active:bg-neutral-50"
                  >
                    <Text className="text-sm font-semibold text-neutral-700">{chip.label}</Text>
                  </Pressable>
                ))}
              </View>

              {parsedAmount > maxWithdrawNaira ? (
                <View className="mt-4">
                  <MessageBanner
                    variant="warning"
                    message={`Maximum withdrawable is ${formatNaira(maxWithdrawNaira)}.`}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          {step === 'review' && payoutAccount ? (
            <View className="mt-8">
              <Text className="text-lg font-bold text-neutral-900">Review withdrawal</Text>
              <View className="mt-5 gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
                <View>
                  <Text className="text-xs font-medium text-neutral-500">Amount</Text>
                  <Text className="mt-0.5 text-2xl font-black text-neutral-900">{formatNaira(parsedAmount)}</Text>
                </View>
                <View className="border-t border-neutral-100 pt-4">
                  <Text className="text-xs font-medium text-neutral-500">To</Text>
                  <Text className="mt-0.5 text-base font-semibold text-neutral-900">{payoutAccount.bankName}</Text>
                  <Text className="text-sm text-neutral-600">
                    {maskAccountNumber(payoutAccount.accountNumber)} · {payoutAccount.accountName}
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row gap-2 rounded-xl bg-neutral-50 px-3 py-3">
                <AlertCircle size={18} color="#525252" />
                <Text className="flex-1 text-xs leading-relaxed text-neutral-600">
                  Funds are sent via our payment partner. If the transfer fails, your wallet is refunded automatically.
                </Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View className="mt-4">
              <MessageBanner variant="error" message={error} />
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-neutral-200 bg-white px-5 pb-6 pt-4">
          {step === 'amount' ? (
            <Button
              title="Continue"
              variant="accent"
              disabled={Boolean(payoutAccount) && !canContinue}
              onPress={() => {
                if (!payoutAccount) {
                  setConnectOpen(true);
                  return;
                }
                if (parsedAmount <= 0 || parsedAmount > maxWithdrawNaira) {
                  setError(`Enter an amount up to ${formatNaira(maxWithdrawNaira)}.`);
                  return;
                }
                setStep('review');
              }}
            />
          ) : null}
          {step === 'review' ? (
            <View className="gap-3">
              <Button
                title={withdrawMutation.isPending ? 'Sending…' : `Withdraw ${formatNaira(parsedAmount)}`}
                variant="accent"
                disabled={!canContinue}
                onPress={() => void submitWithdraw()}
              />
              <Button title="Edit amount" variant="outline" onPress={() => setStep('amount')} />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConnectBankModal
        visible={connectOpen}
        onClose={() => setConnectOpen(false)}
        onLinked={() => {
          setConnectOpen(false);
          setError(null);
        }}
      />
    </SafeAreaView>
  );
}
