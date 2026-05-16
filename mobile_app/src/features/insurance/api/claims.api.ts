import { apiClient } from '@/core/api/client';
import { unwrapResponse } from '@/core/api/unwrapResponse';

import type { ClaimItem, Pagination } from '@/types/backend';

export type ClaimsPage = {
  items: ClaimItem[];
  pagination: Pagination;
};

export const claimsApi = {
  list: async (page = 1, limit = 20): Promise<ClaimsPage> => {
    const res = await apiClient.get('/users/me/claims', { params: { page, limit } });
    return unwrapResponse<ClaimsPage>(res);
  },
};
