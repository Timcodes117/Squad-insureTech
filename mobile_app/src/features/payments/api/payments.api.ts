import { apiClient } from '@/core/api/client';

import type { PaymentIntent } from '../types/payments.types';

export const paymentsApi = {
  // TODO: initiate top-up instructions via backend (never call Squad from mobile).
  createTopUpIntent: async (): Promise<PaymentIntent> => {
    void apiClient;
    return { id: '', status: 'draft' };
  },
};
