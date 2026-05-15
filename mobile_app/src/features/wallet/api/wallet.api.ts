import { apiClient } from '@/core/api/client';

import type { VirtualAccountDetails, WalletBalance } from '../types/wallet.types';

export const walletApi = {
  // TODO: GET /wallet (backend aggregates Squad webhooks + ledger).
  getWallet: async (): Promise<WalletBalance> => {
    void apiClient;
    return { amount: 0, currency: 'NGN' };
  },
  getVirtualAccount: async (): Promise<VirtualAccountDetails> => {
    void apiClient;
    return { accountNumber: '', bankName: '', accountName: '' };
  },
};
