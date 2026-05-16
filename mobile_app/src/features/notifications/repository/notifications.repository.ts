import { notificationsApi, type NotificationDisplay } from '../api/notifications.api';

export type NotificationsFeed = {
  items: NotificationDisplay[];
  unreadCount: number;
  total: number;
};

class NotificationsRepository {
  async list(): Promise<NotificationsFeed> {
    return notificationsApi.list(1, 100);
  }

  async markRead(id: string): Promise<void> {
    return notificationsApi.markRead(id);
  }
}

export default new NotificationsRepository();
