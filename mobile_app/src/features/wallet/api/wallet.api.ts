import { apiClient } from '@/core/api/client';
import { unwrapResponse } from '@/core/api/unwrapResponse';

import type { WalletSnapshot, WithdrawableResponse } from '@/types/backend';

export type WithdrawBody = {
  amount: number;
  bankCode: string;
  accountNumber: string;
};

export const walletApi = {
  getWallet: async (): Promise<WalletSnapshot> => {
    const res = await apiClient.get('/users/me/wallet');
    return unwrapResponse<WalletSnapshot>(res);
  },

  getWithdrawable: async (): Promise<WithdrawableResponse> => {
    const res = await apiClient.get('/users/me/withdrawable');
    return unwrapResponse<WithdrawableResponse>(res);
  },

  withdraw: async (body: WithdrawBody): Promise<unknown> => {
    const res = await apiClient.post('/users/me/withdraw', body);
    return unwrapResponse(res);
  },
};
