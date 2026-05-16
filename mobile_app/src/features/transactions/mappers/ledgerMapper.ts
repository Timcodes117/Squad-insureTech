import { koboToNaira } from '@/core/api/kobo';
import { normalizeMongoId } from '@/core/api/normalizeId';
import type { LedgerCategory, LedgerEntry, LedgerType } from '@/types/backend';

export type LedgerRow = {
  id: string;
  type: LedgerType;
  category: LedgerCategory;
  title: string;
  subtitle: string;
  amountNaira: number;
  balanceAfterNaira: number;
  dateLabel: string;
  createdAt: string;
};

const LEDGER_CATEGORIES: LedgerCategory[] = [
  'funding',
  'premium_burn',
  'claim_settlement',
  'withdrawal',
  'reversal',
];

export function normalizeLedgerCategory(raw: unknown): LedgerCategory {
  if (typeof raw === 'string' && LEDGER_CATEGORIES.includes(raw as LedgerCategory)) {
    return raw as LedgerCategory;
  }
  return 'funding';
}

function normalizeLedgerType(raw: unknown, category: LedgerCategory): LedgerType {
  if (raw === 'credit' || raw === 'debit') {
    return raw;
  }
  if (category === 'funding' || category === 'reversal') {
    return 'credit';
  }
  return 'debit';
}

function categoryTitle(category: LedgerCategory, description: string): string {
  switch (category) {
    case 'funding':
      return 'Wallet funded';
    case 'premium_burn':
      return 'Weekly premium';
    case 'claim_settlement':
      return 'Claim settlement';
    case 'withdrawal':
      return 'Withdrawal';
    case 'reversal':
      return 'Reversal';
    default:
      return description || category;
  }
}

export function mapLedgerEntry(entry: LedgerEntry, index: number): LedgerRow {
  const category = normalizeLedgerCategory(entry.category);
  const type = normalizeLedgerType(entry.type, category);
  const createdAt =
    typeof entry.createdAt === 'string' && entry.createdAt.length > 0
      ? entry.createdAt
      : new Date().toISOString();
  const date = new Date(createdAt);
  const time = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  const day = Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  const description = typeof entry.description === 'string' ? entry.description : '';

  const rowId = normalizeMongoId(entry) || entry.reference || `${createdAt}-${category}-${index}`;

  return {
    id: rowId,
    type,
    category,
    title: categoryTitle(category, description),
    subtitle: description.trim() || entry.reference || '',
    amountNaira: koboToNaira(Number(entry.amount) || 0),
    balanceAfterNaira: koboToNaira(Number(entry.balanceAfter) || 0),
    dateLabel: time ? `${day} · ${time}` : day,
    createdAt,
  };
}

export function mapLedgerEntries(entries: LedgerEntry[]): LedgerRow[] {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.map((entry, index) => mapLedgerEntry(entry, index));
}
