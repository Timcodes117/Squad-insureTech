import { transactionsApi } from '../api/transactions.api';
import type { TransactionRow } from '../types/transactions.types';

class TransactionsRepository {
  async list(): Promise<TransactionRow[]> {
    return transactionsApi.list();
  }
}

export default new TransactionsRepository();
