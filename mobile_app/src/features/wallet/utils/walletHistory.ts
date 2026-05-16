import type { LedgerRow } from '@/features/transactions/mappers/ledgerMapper';

export type WalletHistoryTab = 'all' | 'funded' | 'premiums' | 'withdraws';

/** Matches backend ledger categories on `GET /users/me/transactions`. */
export function filterWalletHistory(entries: readonly LedgerRow[], tab: WalletHistoryTab): LedgerRow[] {
  if (tab === 'funded') {
    return entries.filter((e) => e.category === 'funding');
  }
  if (tab === 'premiums') {
    return entries.filter((e) => e.category === 'premium_burn');
  }
  if (tab === 'withdraws') {
    return entries.filter((e) => e.category === 'withdrawal' || e.category === 'reversal');
  }
  return [...entries];
}

export function groupWalletHistoryByDay(entries: readonly LedgerRow[]): { dayLabel: string; items: LedgerRow[] }[] {
  const order: string[] = [];
  const map = new Map<string, LedgerRow[]>();

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

export function ledgerCategory(entry: LedgerRow): string {
  switch (entry.category) {
    case 'funding':
      return 'Funded';
    case 'withdrawal':
      return 'Withdraw';
    case 'reversal':
      return 'Reversed';
    case 'premium_burn':
      return 'Premium';
    case 'claim_settlement':
      return 'Claim';
    default:
      return entry.type === 'credit' ? 'Credit' : 'Debit';
  }
}
