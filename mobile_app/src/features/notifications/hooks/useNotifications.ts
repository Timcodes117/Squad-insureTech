import { useQuery } from '@tanstack/react-query';

import notificationsRepository from '../repository/notifications.repository';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsRepository.list(),
    enabled: false,
  });
}
