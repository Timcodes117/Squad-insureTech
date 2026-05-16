import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';

import notificationsRepository from '../repository/notifications.repository';

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'feed'] as const;

export function useNotifications() {
  const enabled = useAuthenticatedQueryEnabled();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsRepository.list(),
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

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
