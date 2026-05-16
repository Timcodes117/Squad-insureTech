import { useRouter } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePullToRefresh, refetchAll } from '@/core/hooks/usePullToRefresh';
import { ConnectBankModal } from '@/features/wallet/components/ConnectBankModal';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import { PayoutAccountCard } from '@/features/wallet/components/PayoutAccountCard';
import { VirtualAccountDetailsCard } from '@/features/wallet/components/VirtualAccountDetailsCard';
import { WalletBalanceCard } from '@/features/wallet/components/WalletBalanceCard';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useWallet, useWithdrawable } from '@/features/wallet/hooks/useWallet';
import { useLinkedPayoutAccountStore } from '@/features/wallet/store/linkedPayoutAccountStore';
import {
  filterWalletHistory,
  groupWalletHistoryByDay,
  type WalletHistoryTab,
} from '@/features/wallet/utils/walletHistory';
import { Text } from '@/shared/typography/Text';
import { useAuthStore } from '@/store/authStore';
import { buildFundDetailsMessage } from '@/features/wallet/utils/fundDetails';

const BRAND = '#2563eb';

const HISTORY_TABS: { id: WalletHistoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'funded', label: 'Funded' },
  { id: 'premiums', label: 'Premiums' },
  { id: 'withdraws', label: 'Withdraws' },
];

export default function WalletScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydratePayout = useLinkedPayoutAccountStore((s) => s.hydrate);
  const payoutAccount = useLinkedPayoutAccountStore((s) => s.account);
  const payoutHydrated = useLinkedPayoutAccountStore((s) => s.hydrated);

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: ledger, isLoading: ledgerLoading, refetch: refetchTransactions } = useTransactions();
  const { data: withdrawable, refetch: refetchWithdrawable } = useWithdrawable();

  const onRefresh = useCallback(
    () => refetchAll(() => refetchWallet(), () => refetchTransactions(), () => refetchWithdrawable()),
    [refetchWallet, refetchTransactions, refetchWithdrawable],
  );
  const { refreshControl } = usePullToRefresh(onRefresh);

  const [historyTab, setHistoryTab] = useState<WalletHistoryTab>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const balance = wallet?.balanceNaira ?? 0;

  const filteredHistory = useMemo(() => filterWalletHistory(ledger ?? [], historyTab), [ledger, historyTab]);
  const groupedHistory = useMemo(() => groupWalletHistoryByDay(filteredHistory), [filteredHistory]);

  useEffect(() => {
    void hydratePayout();
  }, [hydratePayout]);

  const fundAccountName = wallet?.fundingAccountName ?? user?.fullName ?? null;

  const shareAccount = useCallback(async () => {
    const num = wallet?.virtualAccountNumber?.trim();
    if (!wallet || !num || num === '—') {
      return;
    }
    try {
      await Share.share({
        message: buildFundDetailsMessage({
          accountNumber: num,
          bankName: wallet.bankName,
          accountName: fundAccountName,
        }),
        title: 'BetaHealth fund details',
      });
    } catch {
      // dismissed
    }
  }, [wallet, fundAccountName]);

  const openWithdrawFlow = () => {
    router.push('/withdraw');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={refreshControl}
      >
        <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
          <View className="w-10" />
          <Text className="text-lg font-bold text-neutral-900">My Wallet</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wallet options"
            hitSlop={10}
            onPress={() => setMenuOpen(true)}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-neutral-100"
          >
            <MoreHorizontal size={22} color="#171717" />
          </Pressable>
        </View>

        {walletLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color={BRAND} />
          </View>
        ) : (
          <>
            <View className="mx-5 mt-4">
              <WalletBalanceCard
                variant="wallet"
                balanceNaira={balance}
                virtualAccountNumber={wallet?.virtualAccountNumber}
                bankName={wallet?.bankName}
                onTopUpPress={() => void shareAccount()}
                onWithdrawPress={openWithdrawFlow}
              />
            </View>

            <View className="mx-5 mt-4">
              <VirtualAccountDetailsCard
                accountNumber={wallet?.virtualAccountNumber ?? '—'}
                bankName={wallet?.bankName ?? 'Partner bank'}
                accountName={fundAccountName}
                helperText="Send a transfer from your bank app using the details below. Use the account name exactly as shown so your bank accepts the payment."
              />
            </View>
          </>
        )}

        {payoutHydrated ? <PayoutAccountCard onConnectPress={() => setConnectOpen(true)} /> : null}

        <View className="mt-8 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold text-neutral-900">Wallet history</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/transactions')} hitSlop={8}>
            <Text className="text-sm font-semibold text-brand-600">See all</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row gap-2 px-5">
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
          {ledgerLoading ? (
            <ActivityIndicator className="py-8" color={BRAND} />
          ) : groupedHistory.length === 0 ? (
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
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/45" onPress={() => setMenuOpen(false)}>
          <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-3" onPress={(e) => e.stopPropagation()}>
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-neutral-200" />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                void shareAccount();
              }}
              className="border-b border-neutral-100 py-4 active:opacity-70"
            >
              <Text className="text-base font-semibold text-neutral-900">Share fund details</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMenuOpen(false);
                setConnectOpen(true);
              }}
              className="py-4 active:opacity-70"
            >
              <Text className="text-base font-semibold text-neutral-900">
                {payoutAccount ? 'Change payout account' : 'Connect payout account'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ConnectBankModal visible={connectOpen} onClose={() => setConnectOpen(false)} />
    </SafeAreaView>
  );
}
