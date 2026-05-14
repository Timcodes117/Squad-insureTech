export type MockLedgerEntry = {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  subtitle: string;
  amountNaira: number;
  balanceAfterNaira: number;
  dateLabel: string;
};

export const MOCK_LEDGER: MockLedgerEntry[] = [
  {
    id: '1',
    type: 'credit',
    title: 'Bank transfer in',
    subtitle: 'Ref: BHT-9F2A',
    amountNaira: 5_000,
    balanceAfterNaira: 5_000,
    dateLabel: 'Today · 09:12',
  },
  {
    id: '2',
    type: 'debit',
    title: 'Weekly premium burn',
    subtitle: 'Standard plan · 90% pool / 10% platform',
    amountNaira: 750,
    balanceAfterNaira: 4_250,
    dateLabel: 'Today · 09:13',
  },
  {
    id: '3',
    type: 'debit',
    title: 'Weekly premium burn',
    subtitle: 'Standard plan',
    amountNaira: 750,
    balanceAfterNaira: 3_500,
    dateLabel: 'Yesterday · 08:00',
  },
  {
    id: '4',
    type: 'credit',
    title: 'Bank transfer in',
    subtitle: 'Ref: BHT-3C91',
    amountNaira: 2_000,
    balanceAfterNaira: 5_500,
    dateLabel: 'Mon · 14:40',
  },
  {
    id: '5',
    type: 'debit',
    title: 'Weekly premium burn',
    subtitle: 'Standard plan',
    amountNaira: 750,
    balanceAfterNaira: 4_750,
    dateLabel: 'Mon · 14:41',
  },
  {
    id: '6',
    type: 'debit',
    title: 'Withdrawal',
    subtitle: 'To your linked bank',
    amountNaira: 1_500,
    balanceAfterNaira: 3_250,
    dateLabel: 'Sun · 11:05',
  },
];
