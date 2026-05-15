import { notificationsApi } from '../api/notifications.api';
import type { NotificationItem } from '../types/notifications.types';

class NotificationsRepository {
  async list(): Promise<NotificationItem[]> {
    return notificationsApi.list();
  }
}

export default new NotificationsRepository();
