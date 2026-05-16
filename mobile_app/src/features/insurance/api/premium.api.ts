import { apiClient } from '@/core/api/client';
import { unwrapResponse } from '@/core/api/unwrapResponse';

export type PayPremiumResult = {
  status: string;
  premium?: number;
  newBalance?: number;
  isActive?: boolean;
  lastPremiumBurnAt?: string | null;
  firstPremiumAt?: string | null;
  reason?: string;
};

export const premiumApi = {
  /** Requires backend `POST /users/me/premium/pay` (runs weekly premium burn for current user). */
  payPremium: async (): Promise<PayPremiumResult> => {
    const res = await apiClient.post('/users/me/premium/pay');
    return unwrapResponse<PayPremiumResult>(res);
  },
};
