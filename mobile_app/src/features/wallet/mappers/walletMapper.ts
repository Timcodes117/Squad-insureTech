import { koboToNaira } from '@/core/api/kobo';
import type { WalletSnapshot } from '@/types/backend';

export type WalletView = {
  balanceNaira: number;
  virtualAccountNumber: string;
  bankName: string;
  fundingAccountName: string | null;
};

export function mapWalletSnapshot(wallet: WalletSnapshot): WalletView {
  return {
    balanceNaira: koboToNaira(wallet.balance),
    virtualAccountNumber: wallet.virtualAccountNumber ?? '—',
    bankName: wallet.virtualAccountBankName ?? 'Partner bank',
    fundingAccountName: wallet.fundingAccountName?.trim() || null,
  };
}
