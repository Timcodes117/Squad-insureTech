import { apiClient } from '@/core/api/client';
import { unwrapResponse } from '@/core/api/unwrapResponse';

import type { LedgerEntry, Pagination } from '@/types/backend';

export type TransactionsPage = {
  balance: number;
  items: LedgerEntry[];
  pagination: Pagination;
};

export const transactionsApi = {
  /** `GET /users/me/transactions` — wallet ledger, newest first. */
  list: async (page = 1, limit = 100): Promise<TransactionsPage> => {
    const res = await apiClient.get('/users/me/transactions', {
      params: { page, limit },
    });
    const data = unwrapResponse<TransactionsPage>(res);
    return {
      balance: data.balance ?? 0,
      items: Array.isArray(data.items) ? data.items : [],
      pagination: data.pagination ?? {
        page,
        limit,
        total: Array.isArray(data.items) ? data.items.length : 0,
        pages: 1,
      },
    };
  },
};
