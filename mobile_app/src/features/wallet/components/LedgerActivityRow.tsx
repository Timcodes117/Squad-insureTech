import { ArrowDownLeft, ArrowUpRight, Flame, Shield } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { LedgerRow } from '@/features/transactions/mappers/ledgerMapper';
import { ledgerCategory } from '@/features/wallet/utils/walletHistory';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Props = {
  item: LedgerRow;
  showBalanceAfter?: boolean;
  showDescription?: boolean;
  onPress?: () => void;
  bordered?: boolean;
};

function rowIcon(item: LedgerRow) {
  if (item.type === 'credit') {
    return ArrowDownLeft;
  }
  if (item.category === 'withdrawal' || item.category === 'reversal') {
    return ArrowUpRight;
  }
  if (item.category === 'claim_settlement') {
    return Shield;
  }
  return Flame;
}

export function LedgerActivityRow({
  item,
  showBalanceAfter = false,
  showDescription = false,
  onPress,
  bordered = false,
}: Props) {
  const isCredit = item.type === 'credit';
  const Icon = rowIcon(item);
  const amountClass = isCredit ? 'text-emerald-600' : 'text-red-600';
  const sign = isCredit ? '+' : '−';
  const time = item.dateLabel.includes(' · ') ? item.dateLabel.split(' · ').slice(1).join(' · ') : item.dateLabel;
  const detailLine = showDescription && item.subtitle ? item.subtitle : showBalanceAfter ? item.dateLabel : time;

  const content = (
    <View className={`flex-row items-center gap-3 py-3.5 ${bordered ? 'border-b border-neutral-100' : ''}`}>
      <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
        <Icon size={20} color={isCredit ? BRAND : '#525252'} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-neutral-900">{item.title}</Text>
        <Text className="mt-0.5 text-xs text-neutral-500" numberOfLines={2}>
          {detailLine}
        </Text>
        {showDescription && item.subtitle ? (
          <Text className="mt-0.5 text-[10px] text-neutral-400">{time}</Text>
        ) : null}
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
