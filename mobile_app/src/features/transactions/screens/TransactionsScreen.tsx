import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { MOCK_LEDGER } from '@/features/transactions/constants/mockLedger';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import {
  filterWalletHistory,
  groupWalletHistoryByDay,
  type WalletHistoryTab,
} from '@/features/wallet/utils/walletHistory';
import { DashboardScreenShell } from '@/shared/ui/dashboard';
import { Text } from '@/shared/typography/Text';

const HISTORY_TABS: { id: WalletHistoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'funded', label: 'Funded' },
  { id: 'withdraws', label: 'Withdraws' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const [historyTab, setHistoryTab] = useState<WalletHistoryTab>('all');

  const filteredHistory = useMemo(() => filterWalletHistory(MOCK_LEDGER, historyTab), [historyTab]);
  const groupedHistory = useMemo(() => groupWalletHistoryByDay(filteredHistory), [filteredHistory]);

  return (
    <DashboardScreenShell title="Activity" subtitle="Wallet movements" onBack={() => router.back()}>
      <View className="mt-2 flex-row gap-2 px-5">
        {HISTORY_TABS.map((tab) => {
          const active = historyTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setHistoryTab(tab.id)}
              className={`rounded-full px-4 py-2 active:opacity-90 ${active ? 'bg-brand-600' : 'bg-neutral-100'}`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-neutral-600'}`}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2 px-5">
        {groupedHistory.length === 0 ? (
          <Text className="py-8 text-center text-sm text-neutral-500">No transactions in this filter yet.</Text>
        ) : (
          groupedHistory.map((group) => (
            <View key={group.dayLabel} className="mb-2">
              <Text className="py-3 text-sm font-semibold text-neutral-500">{group.dayLabel}</Text>
              {group.items.map((item, idx) => (
                <LedgerActivityRow key={item.id} item={item} bordered={idx < group.items.length - 1} />
              ))}
            </View>
          ))
        )}
      </View>
    </DashboardScreenShell>
  );
}
