import { apiClient } from '@/core/api/client';

import type { TransactionRow } from '../types/transactions.types';

export const transactionsApi = {
  // TODO: GET /transactions (backend is source of truth; includes webhook-driven updates).
  list: async (): Promise<TransactionRow[]> => {
    void apiClient;
    return [];
  },
};
