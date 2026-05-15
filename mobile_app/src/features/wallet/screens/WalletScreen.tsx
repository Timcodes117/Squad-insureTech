import { useRouter } from 'expo-router';
import { Building2, Copy, MoreHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_LEDGER } from '@/features/transactions/constants/mockLedger';
import { ConnectBankModal } from '@/features/wallet/components/ConnectBankModal';
import { LedgerActivityRow } from '@/features/wallet/components/LedgerActivityRow';
import { PayoutAccountCard } from '@/features/wallet/components/PayoutAccountCard';
import { WalletBalanceCard } from '@/features/wallet/components/WalletBalanceCard';
import { WithdrawToBankModal } from '@/features/wallet/components/WithdrawToBankModal';
import { MOCK_WALLET } from '@/features/wallet/constants/mockWallet';
import { useLinkedPayoutAccountStore } from '@/features/wallet/store/linkedPayoutAccountStore';
import {
  filterWalletHistory,
  groupWalletHistoryByDay,
  type WalletHistoryTab,
} from '@/features/wallet/utils/walletHistory';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

const HISTORY_TABS: { id: WalletHistoryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'funded', label: 'Funded' },
  { id: 'withdraws', label: 'Withdraws' },
];

export default function WalletScreen() {
  const router = useRouter();
  const hydratePayout = useLinkedPayoutAccountStore((s) => s.hydrate);
  const payoutAccount = useLinkedPayoutAccountStore((s) => s.account);
  const payoutHydrated = useLinkedPayoutAccountStore((s) => s.hydrated);

  const [historyTab, setHistoryTab] = useState<WalletHistoryTab>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAfterLink, setWithdrawAfterLink] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [withdrawDone, setWithdrawDone] = useState(false);

  const balance = MOCK_WALLET.balanceNaira;

  const parsedAmount = useMemo(() => {
    const n = Number(amountText.replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountText]);

  const canSubmitWithdraw = parsedAmount > 0 && parsedAmount <= balance;

  const filteredHistory = useMemo(() => filterWalletHistory(MOCK_LEDGER, historyTab), [historyTab]);
  const groupedHistory = useMemo(() => groupWalletHistoryByDay(filteredHistory), [filteredHistory]);

  useEffect(() => {
    void hydratePayout();
  }, [hydratePayout]);

  const shareAccount = useCallback(async () => {
    try {
      await Share.share({
        message: `BetaHealth virtual account\n${MOCK_WALLET.virtualAccountNumber}\n${MOCK_WALLET.bankName}`,
        title: 'BetaHealth account',
      });
    } catch {
      // dismissed
    }
  }, []);

  const closeWithdraw = () => {
    setWithdrawOpen(false);
    setAmountText('');
    setWithdrawDone(false);
  };

  const openWithdrawFlow = () => {
    if (!payoutAccount) {
      setWithdrawAfterLink(true);
      setConnectOpen(true);
      return;
    }
    setWithdrawOpen(true);
  };

  const onBankLinked = () => {
    if (withdrawAfterLink) {
      setWithdrawAfterLink(false);
      setWithdrawOpen(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
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

        <View className="mx-5 mt-4">
          <WalletBalanceCard
            variant="wallet"
            balanceNaira={balance}
            onTopUpPress={() => void shareAccount()}
            onWithdrawPress={openWithdrawFlow}
          />
        </View>

        <View className="mx-5 mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <Building2 size={20} color={BRAND} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-neutral-500">Fund via transfer</Text>
              <Text className="mt-0.5 text-base font-bold tracking-wide text-neutral-900">{MOCK_WALLET.virtualAccountNumber}</Text>
              <Text className="text-sm text-neutral-600">{MOCK_WALLET.bankName}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share account details"
              onPress={() => void shareAccount()}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full border border-neutral-200 active:bg-neutral-50"
            >
              <Copy size={18} color={BRAND} />
            </Pressable>
          </View>
        </View>

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

      <ConnectBankModal
        visible={connectOpen}
        onClose={() => {
          setConnectOpen(false);
          setWithdrawAfterLink(false);
        }}
        onLinked={onBankLinked}
      />

      {payoutAccount ? (
        <WithdrawToBankModal
          visible={withdrawOpen}
          balanceNaira={balance}
          payoutAccount={payoutAccount}
          amountText={amountText}
          onChangeAmount={setAmountText}
          done={withdrawDone}
          parsedAmount={parsedAmount}
          canSubmit={canSubmitWithdraw}
          onClose={closeWithdraw}
          onConfirm={() => canSubmitWithdraw && setWithdrawDone(true)}
        />
      ) : null}
    </SafeAreaView>
  );
}
