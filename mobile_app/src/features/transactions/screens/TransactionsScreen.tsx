import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_LEDGER, type MockLedgerEntry } from '@/features/transactions/constants/mockLedger';
import { Card } from '@/shared/ui/Card';
import { formatNaira } from '@/shared/format/naira';
import { Text } from '@/shared/typography/Text';

function LedgerRow({ item }: { item: MockLedgerEntry }) {
  const sign = item.type === 'credit' ? '+' : '−';
  const color = item.type === 'credit' ? 'text-brand-700' : 'text-neutral-900';
  return (
    <Card className="mb-3 rounded-2xl border border-neutral-200 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900">{item.title}</Text>
          <Text className="mt-1 text-sm text-neutral-500">{item.subtitle}</Text>
          <Text className="mt-2 text-xs text-neutral-400">{item.dateLabel}</Text>
        </View>
        <View className="items-end">
          <Text className={`text-base font-bold ${color}`}>
            {sign}
            {formatNaira(item.amountNaira)}
          </Text>
          <Text className="mt-2 text-xs font-medium text-neutral-500">Balance {formatNaira(item.balanceAfterNaira)}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function TransactionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="border-b border-neutral-100 px-5 pb-3 pt-2">
        <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">BetaHealth</Text>
        <Text className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Activity</Text>
        <Text className="mt-1 text-sm text-neutral-500">Every entry shows your balance after the move (demo data).</Text>
      </View>
      <FlatList
        data={MOCK_LEDGER}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 }}
        renderItem={({ item }) => <LedgerRow item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
