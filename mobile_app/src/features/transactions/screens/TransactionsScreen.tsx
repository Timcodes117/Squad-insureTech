import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { usePullToRefresh } from '@/core/hooks/usePullToRefresh';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import {
  filterWalletHistory,
  groupWalletHistoryByDay,
  type WalletHistoryTab,
} from '@/features/wallet/utils/walletHistory';
import { formatNaira } from '@/shared/format/naira';
import { DashboardScreenShell } from '@/shared/ui/dashboard';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/typography/Text';

const HISTORY_TABS: { id: WalletHistoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'funded', label: 'Funded' },
  { id: 'premiums', label: 'Premiums' },
  { id: 'withdraws', label: 'Withdraws' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const [historyTab, setHistoryTab] = useState<WalletHistoryTab>('all');
  const {
    data: ledger,
    balanceNaira,
    totalCount,
    isLoading,
    isError,
    error,
    refetch,
  } = useTransactions();

  const onRefresh = useCallback(() => refetch(), [refetch]);
  const { refreshControl } = usePullToRefresh(onRefresh);

  const filteredHistory = useMemo(() => filterWalletHistory(ledger, historyTab), [ledger, historyTab]);
  const groupedHistory = useMemo(() => groupWalletHistoryByDay(filteredHistory), [filteredHistory]);

  return (
    <DashboardScreenShell
      title="Activity"
      subtitle="Wallet ledger (transfers, premiums, withdrawals)"
      onBack={() => router.back()}
      refreshControl={refreshControl}
    >
      <View className="mx-5 mb-3 mt-2 rounded-xl bg-neutral-50 px-3 py-2">
        <Text className="text-xs leading-relaxed text-neutral-600">
          Activity shows money in and out of your wallet. Alerts (bell icon) are separate messages like OTP codes and
          claim updates.
        </Text>
      </View>

      {balanceNaira !== undefined ? (
        <View className="mx-5 mb-2 mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <Text className="text-xs font-medium text-neutral-500">Current balance</Text>
          <Text className="mt-0.5 text-2xl font-black text-neutral-900">{formatNaira(balanceNaira)}</Text>
          {typeof totalCount === 'number' ? (
            <Text className="mt-1 text-xs text-neutral-500">
              {totalCount} ledger {totalCount === 1 ? 'entry' : 'entries'}
            </Text>
          ) : null}
        </View>
      ) : null}

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
        {isLoading ? (
          <ActivityIndicator className="py-8" color="#2563eb" />
        ) : isError ? (
          <View className="py-4">
            <MessageBanner variant="error" message={getApiErrorMessage(error)} />
            <View className="mt-4">
              <Button title="Try again" variant="accent" onPress={() => void refetch()} />
            </View>
          </View>
        ) : groupedHistory.length === 0 ? (
          <Text className="py-8 text-center text-sm text-neutral-500">
            {historyTab === 'all'
              ? 'No wallet activity yet. Fund your account to see transfers here.'
              : 'No transactions in this filter yet.'}
          </Text>
        ) : (
          <>
            {groupedHistory.map((group) => (
              <View key={group.dayLabel} className="mb-2">
                <Text className="py-3 text-sm font-semibold text-neutral-500">{group.dayLabel}</Text>
                {group.items.map((item, idx) => (
                  <LedgerActivityRow
                    key={item.id}
                    item={item}
                    showDescription
                    showBalanceAfter
                    bordered={idx < group.items.length - 1}
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </View>
    </DashboardScreenShell>
  );
}
