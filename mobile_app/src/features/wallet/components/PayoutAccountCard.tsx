import { Building2, ChevronRight, Landmark } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { maskAccountNumber, useLinkedPayoutAccountStore } from '@/features/wallet/store/linkedPayoutAccountStore';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Props = {
  onConnectPress: () => void;
};

export function PayoutAccountCard({ onConnectPress }: Props) {
  const account = useLinkedPayoutAccountStore((s) => s.account);
  const clearAccount = useLinkedPayoutAccountStore((s) => s.clearAccount);

  const confirmRemove = () => {
    Alert.alert(
      'Remove payout account?',
      'You will need to connect a bank again before you can withdraw to your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void clearAccount(),
        },
      ],
    );
  };

  if (!account) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onConnectPress}
        className="mx-5 mt-4 flex-row items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-4 active:opacity-90"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
          <Landmark size={20} color={BRAND} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-neutral-900">Payout account</Text>
          <Text className="mt-0.5 text-sm text-neutral-600">Connect your bank to withdraw from your wallet</Text>
        </View>
        <ChevronRight size={20} color="#737373" />
      </Pressable>
    );
  }

  return (
    <View className="mx-5 mt-4 rounded-2xl bg-neutral-100 px-4 py-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Payout account</Text>
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityRole="button" onPress={confirmRemove} hitSlop={8}>
            <Text className="text-sm font-semibold text-red-600">Remove</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onConnectPress} hitSlop={8}>
            <Text className="text-sm font-semibold text-brand-600">Change</Text>
          </Pressable>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
          <Building2 size={20} color={BRAND} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-neutral-900">{account.bankName}</Text>
          <Text className="mt-0.5 text-sm text-neutral-600">{maskAccountNumber(account.accountNumber)}</Text>
          <Text className="mt-0.5 text-xs text-neutral-500">{account.accountName}</Text>
        </View>
      </View>
    </View>
  );
}
