import { Wallet } from 'lucide-react-native';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { maskAccountNumber } from '@/features/wallet/store/linkedPayoutAccountStore';
import type { LinkedPayoutAccount } from '@/features/wallet/types/linkedPayoutAccount.types';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Props = {
  visible: boolean;
  balanceNaira: number;
  payoutAccount: LinkedPayoutAccount;
  amountText: string;
  onChangeAmount: (value: string) => void;
  done: boolean;
  parsedAmount: number;
  canSubmit: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function WithdrawToBankModal({
  visible,
  balanceNaira,
  payoutAccount,
  amountText,
  onChangeAmount,
  done,
  parsedAmount,
  canSubmit,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-5" onPress={(e) => e.stopPropagation()}>
          {!done ? (
            <>
              <View className="mb-4 flex-row items-center gap-2">
                <Wallet size={22} color={BRAND} />
                <Text className="text-lg font-bold text-neutral-900">Withdraw to bank</Text>
              </View>

              <View className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <Text className="text-xs font-medium text-neutral-500">Sending to</Text>
                <Text className="mt-0.5 text-sm font-semibold text-neutral-900">{payoutAccount.bankName}</Text>
                <Text className="text-sm text-neutral-600">
                  {maskAccountNumber(payoutAccount.accountNumber)} · {payoutAccount.accountName}
                </Text>
              </View>

              <Text className="mt-4 text-sm text-neutral-600">Available: {formatNaira(balanceNaira)} (demo)</Text>
              <TextInput
                value={amountText}
                onChangeText={onChangeAmount}
                keyboardType="number-pad"
                placeholder="Amount in ₦"
                placeholderTextColor="#a3a3a3"
                className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-lg font-semibold text-neutral-900"
              />

              <View className="mt-5 flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  className="flex-1 items-center rounded-xl border border-neutral-200 py-3.5 active:bg-neutral-50"
                >
                  <Text className="font-semibold text-neutral-900">Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit}
                  onPress={onConfirm}
                  className={`flex-1 items-center rounded-xl py-3.5 active:opacity-90 ${!canSubmit ? 'bg-neutral-200' : 'bg-brand-600'}`}
                >
                  <Text className={`font-semibold ${!canSubmit ? 'text-neutral-500' : 'text-white'}`}>Confirm</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text className="text-lg font-bold text-neutral-900">Withdrawal requested</Text>
              <Text className="mt-2 text-sm leading-relaxed text-neutral-600">
                {formatNaira(parsedAmount)} will be sent to {payoutAccount.bankName}{' '}
                {maskAccountNumber(payoutAccount.accountNumber)} once payouts are live on the backend.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                className="mt-6 items-center rounded-xl bg-brand-600 py-4 active:opacity-90"
              >
                <Text className="font-semibold text-white">Close</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
