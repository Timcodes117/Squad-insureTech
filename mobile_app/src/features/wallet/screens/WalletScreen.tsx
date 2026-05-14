import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_WALLET } from '@/features/wallet/constants/mockWallet';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

export default function WalletScreen() {
  const router = useRouter();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [done, setDone] = useState(false);

  const balance = MOCK_WALLET.balanceNaira;

  const parsedAmount = useMemo(() => {
    const n = Number(amountText.replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const canSubmit = parsedAmount > 0 && parsedAmount <= balance;

  const shareAccount = useCallback(async () => {
    try {
      await Share.share({
        message: `BetaHealth virtual account\n${MOCK_WALLET.virtualAccountNumber}\n${MOCK_WALLET.bankName}`,
        title: 'BetaHealth account',
      });
    } catch {
      // user dismissed share sheet
    }
  }, []);

  const closeModal = () => {
    setWithdrawOpen(false);
    setAmountText('');
    setDone(false);
  };

  const submitWithdraw = () => {
    if (!canSubmit) {
      return;
    }
    setDone(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">BetaHealth</Text>
          <Text className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Wallet</Text>
          <Text className="mt-2 text-base leading-relaxed text-neutral-600">
            Your Squad virtual account—fund anytime. Premiums burn weekly from your balance (demo UI).
          </Text>
        </View>

        <View className="mt-6 px-5">
          <Card className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <Text className="text-sm font-medium text-neutral-600">Available balance</Text>
            <Text className="mt-1 text-3xl font-black text-neutral-900">{formatNaira(balance)}</Text>
          </Card>
        </View>

        <View className="mt-5 px-5">
          <Card className="rounded-2xl border border-neutral-200 p-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Virtual account</Text>
            <Text className="mt-2 text-2xl font-bold tracking-wider text-neutral-900">{MOCK_WALLET.virtualAccountNumber}</Text>
            <Text className="mt-1 text-base text-neutral-700">{MOCK_WALLET.bankName}</Text>
            <Text className="mt-1 text-sm text-neutral-500">{MOCK_WALLET.accountName}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy account number"
              onPress={() => void shareAccount()}
              className="mt-4 self-start rounded-full border border-brand-200 bg-white px-4 py-2 active:bg-brand-50"
            >
              <Text className="text-sm font-semibold text-brand-800">Share account details</Text>
            </Pressable>
          </Card>
        </View>

        <View className="mt-5 px-5">
          <Card className="rounded-2xl border border-neutral-200 p-4">
            <Text className="text-base font-bold text-neutral-900">How to fund</Text>
            <Text className="mt-2 text-sm leading-relaxed text-neutral-600">
              1. Open your bank app{'\n'}
              2. Send a transfer to the account number above{'\n'}
              3. Wait for the credit alert—your balance updates here (live API later)
            </Text>
          </Card>
        </View>

        <View className="mt-6 gap-3 px-5">
          <Button title="Withdraw to bank" variant="accent" onPress={() => setWithdrawOpen(true)} />
          <Button title="View activity" variant="outline" onPress={() => router.push('/(tabs)/transactions')} />
        </View>
      </ScrollView>

      <Modal visible={withdrawOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable className="flex-1 justify-end bg-black/45" onPress={closeModal}>
          <View className="rounded-t-3xl bg-white px-5 pb-8 pt-5">
            {!done ? (
              <>
                <Text className="text-lg font-bold text-neutral-900">Withdraw</Text>
                <Text className="mt-2 text-sm text-neutral-600">
                  Demo only—enter an amount up to {formatNaira(balance)}.
                </Text>
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="number-pad"
                  placeholder="Amount in ₦"
                  placeholderTextColor="#a3a3a3"
                  className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-lg font-semibold text-neutral-900"
                />
                <View className="mt-5 flex-row gap-3">
                  <View className="flex-1">
                    <Button title="Cancel" variant="outline" onPress={closeModal} />
                  </View>
                  <View className="flex-1">
                    <Button title="Confirm" variant="accent" onPress={submitWithdraw} disabled={!canSubmit} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text className="text-lg font-bold text-neutral-900">Request recorded</Text>
                <Text className="mt-2 text-sm leading-relaxed text-neutral-600">
                  In production, Squad would move {formatNaira(parsedAmount)} to your linked bank. This screen is UI-only.
                </Text>
                <View className="mt-6">
                  <Button title="Close" variant="accent" onPress={closeModal} />
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
