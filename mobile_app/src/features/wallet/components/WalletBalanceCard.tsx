import { Eye, EyeOff, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { MOCK_WALLET } from '@/features/wallet/constants/mockWallet';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

function maskBalance(): string {
  return '₦ •••••••';
}

type HomeActions = {
  variant: 'home';
  balanceVisible: boolean;
  onToggleBalance: () => void;
  onFundPress: () => void;
  onWithdrawPress: () => void;
};

type WalletActions = {
  variant: 'wallet';
  onTopUpPress: () => void;
  onWithdrawPress: () => void;
};

type Props = {
  balanceNaira: number;
} & (HomeActions | WalletActions);

export function WalletBalanceCard(props: Props) {
  const { balanceNaira } = props;
  const balanceVisible = props.variant === 'home' ? props.balanceVisible : true;
  const maskedAccount = `•••• ${MOCK_WALLET.virtualAccountNumber.slice(-4)}`;

  return (
    <View className="overflow-hidden rounded-3xl bg-neutral-900 px-5 py-5">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm font-medium text-white/70">BetaHealth wallet</Text>
          <Text className="mt-0.5 text-xs text-white/50">{maskedAccount}</Text>
        </View>
        {props.variant === 'wallet' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Top up wallet"
            onPress={props.onTopUpPress}
            className="flex-row items-center gap-1.5 rounded-full bg-white px-3 py-2 active:opacity-90"
          >
            <Plus size={16} color={BRAND} />
            <Text className="text-xs font-semibold text-neutral-900">Top up</Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="mt-6 text-sm text-white/60">Your balance</Text>
      <View className="mt-1 flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-4xl font-black tracking-tight text-white">
          {balanceVisible ? formatNaira(balanceNaira) : maskBalance()}
        </Text>
        {props.variant === 'home' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={balanceVisible ? 'Hide balance' : 'Show balance'}
            onPress={props.onToggleBalance}
            className="shrink-0 flex-row items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 active:bg-white/10"
          >
            {balanceVisible ? <EyeOff size={18} color="#ffffff" /> : <Eye size={18} color="#ffffff" />}
            <Text className="text-xs font-semibold text-white">{balanceVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>

      {props.variant === 'home' ? (
        <View className="mt-5 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={props.onFundPress}
            className="flex-1 rounded-full bg-brand-600 px-4 py-3 active:opacity-90"
          >
            <Text className="text-center text-sm font-semibold text-white">Fund</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={props.onWithdrawPress}
            className="flex-[1.35] rounded-full border border-white/25 px-4 py-3 active:bg-white/10"
          >
            <Text className="text-center text-sm font-semibold text-white">Withdraw</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Withdraw to bank"
          onPress={props.onWithdrawPress}
          className="mt-5 self-start rounded-full border border-white/25 px-4 py-2.5 active:bg-white/10"
        >
          <Text className="text-sm font-semibold text-white">Withdraw to bank</Text>
        </Pressable>
      )}
    </View>
  );
}
