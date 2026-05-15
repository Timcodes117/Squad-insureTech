import { ArrowDownLeft, ArrowUpRight, Flame } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { MockLedgerEntry } from '@/features/transactions/constants/mockLedger';
import { ledgerCategory } from '@/features/wallet/utils/walletHistory';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Props = {
  item: MockLedgerEntry;
  showBalanceAfter?: boolean;
  onPress?: () => void;
  bordered?: boolean;
};

export function LedgerActivityRow({ item, showBalanceAfter = false, onPress, bordered = false }: Props) {
  const isCredit = item.type === 'credit';
  const Icon = isCredit ? ArrowDownLeft : item.title.toLowerCase().includes('withdraw') ? ArrowUpRight : Flame;
  const amountClass = isCredit ? 'text-emerald-600' : 'text-red-600';
  const sign = isCredit ? '+' : '−';
  const time = item.dateLabel.includes(' · ') ? item.dateLabel.split(' · ').slice(1).join(' · ') : item.dateLabel;

  const content = (
    <View className={`flex-row items-center gap-3 py-3.5 ${bordered ? 'border-b border-neutral-100' : ''}`}>
      <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
        <Icon size={20} color={isCredit ? BRAND : '#525252'} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{item.title}</Text>
        <Text className="mt-0.5 text-xs text-neutral-500">{showBalanceAfter ? item.dateLabel : time}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-sm font-bold ${amountClass}`}>
          {sign}
          {formatNaira(item.amountNaira)}
        </Text>
        <Text className="mt-0.5 text-[10px] text-neutral-400">
          {showBalanceAfter ? `Bal ${formatNaira(item.balanceAfterNaira)}` : ledgerCategory(item)}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}
