import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';

import transactionsRepository from '../repository/transactions.repository';
import type { LedgerRow } from '../mappers/ledgerMapper';

const LEDGER_QUERY_KEY = ['transactions', 'ledger'] as const;
const PAGE_SIZE = 100;

export function useTransactions() {
  const enabled = useAuthenticatedQueryEnabled();

  const query = useQuery({
    queryKey: LEDGER_QUERY_KEY,
    queryFn: () => transactionsRepository.listPage(1, PAGE_SIZE),
    enabled,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }
      void query.refetch();
    }, [enabled, query.refetch]),
  );

  const data: LedgerRow[] = query.data?.items ?? [];

  return {
    data,
    balanceNaira: query.data?.balanceNaira,
    totalCount: query.data?.pagination.total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: undefined as (() => Promise<unknown>) | undefined,
    hasNextPage: false,
    isFetchingNextPage: false,
  };
}

export { LEDGER_QUERY_KEY };
