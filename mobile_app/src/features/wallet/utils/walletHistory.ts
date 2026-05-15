import type { MockLedgerEntry } from '@/features/transactions/constants/mockLedger';

export type WalletHistoryTab = 'all' | 'funded' | 'withdraws';

export function filterWalletHistory(entries: readonly MockLedgerEntry[], tab: WalletHistoryTab): MockLedgerEntry[] {
  if (tab === 'funded') {
    return entries.filter((e) => e.type === 'credit');
  }
  if (tab === 'withdraws') {
    return entries.filter((e) => e.title.toLowerCase().includes('withdraw'));
  }
  return [...entries];
}

export function groupWalletHistoryByDay(entries: readonly MockLedgerEntry[]): { dayLabel: string; items: MockLedgerEntry[] }[] {
  const order: string[] = [];
  const map = new Map<string, MockLedgerEntry[]>();

  for (const entry of entries) {
    const dayLabel = entry.dateLabel.split(' · ')[0]?.trim() || entry.dateLabel;
    if (!map.has(dayLabel)) {
      map.set(dayLabel, []);
      order.push(dayLabel);
    }
    map.get(dayLabel)!.push(entry);
  }

  return order.map((dayLabel) => ({ dayLabel, items: map.get(dayLabel)! }));
}

export function ledgerCategory(entry: MockLedgerEntry): string {
  if (entry.type === 'credit') {
    return 'Funded';
  }
  if (entry.title.toLowerCase().includes('withdraw')) {
    return 'Withdraw';
  }
  return 'Premium';
}
