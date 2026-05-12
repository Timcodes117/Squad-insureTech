import { apiClient } from '@/core/api/client';

import type { NotificationItem } from '../types/notifications.types';

export const notificationsApi = {
  // TODO: GET /notifications
  list: async (): Promise<NotificationItem[]> => {
    void apiClient;
    return [];
  },
};
