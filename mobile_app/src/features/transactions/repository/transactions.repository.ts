import { koboToNaira } from '@/core/api/kobo';
import type { Pagination } from '@/types/backend';

import { transactionsApi } from '../api/transactions.api';
import { mapLedgerEntries, type LedgerRow } from '../mappers/ledgerMapper';

export type TransactionsListPage = {
  items: LedgerRow[];
  balanceNaira: number;
  pagination: Pagination;
};

class TransactionsRepository {
  async listPage(page = 1, limit = 100): Promise<TransactionsListPage> {
    const data = await transactionsApi.list(page, limit);
    const items = mapLedgerEntries(data.items ?? []);
    return {
      items,
      balanceNaira: koboToNaira(data.balance ?? 0),
      pagination: data.pagination ?? { page: 1, limit, total: items.length, pages: 1 },
    };
  }

  async list(page = 1, limit = 100): Promise<LedgerRow[]> {
    const pageData = await this.listPage(page, limit);
    return pageData.items;
  }
}

export default new TransactionsRepository();
