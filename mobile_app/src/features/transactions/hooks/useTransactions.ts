import { useQuery } from '@tanstack/react-query';

import transactionsRepository from '../repository/transactions.repository';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsRepository.list(),
    enabled: false,
  });
}
