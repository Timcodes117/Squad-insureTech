import { apiClient } from '@/core/api/client';
import { normalizeMongoId } from '@/core/api/normalizeId';
import { unwrapResponse } from '@/core/api/unwrapResponse';

import type { NotificationItem, Pagination } from '@/types/backend';

export type NotificationsPage = {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  pagination: Pagination;
};

/** Raw row from `GET /notifications` when Mongoose `.lean()` is used (has `_id`, not `id`). */
type NotificationApiRow = Omit<NotificationItem, 'id'> & {
  id?: string;
  _id?: string;
};

export type NotificationCategory = 'all' | 'claims' | 'wallet';

export type NotificationDisplay = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  dayLabel: string;
  tone: 'info' | 'success' | 'warning';
  category: Exclude<NotificationCategory, 'all'>;
  isRead: boolean;
};

function normalizeNotificationRow(row: NotificationApiRow): NotificationItem {
  return {
    id: normalizeMongoId(row),
    userId: String(row.userId ?? ''),
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data,
    isRead: Boolean(row.isRead),
    readAt: row.readAt ?? null,
    createdAt: row.createdAt,
  };
}

function mapCategory(type: string): NotificationDisplay['category'] {
  const t = type.toLowerCase();
  if (t.includes('claim')) {
    return 'claims';
  }
  if (
    t.includes('withdraw') ||
    t.includes('funding') ||
    t.includes('premium') ||
    t.includes('balance') ||
    t.includes('cover') ||
    t.includes('otp') ||
    t.includes('login')
  ) {
    return 'wallet';
  }
  return 'wallet';
}

function mapTone(type: string): NotificationDisplay['tone'] {
  const t = type.toLowerCase();
  if (t.includes('approved') || t.includes('complete') || t.includes('activated')) {
    return 'success';
  }
  if (t.includes('rejected') || t.includes('failed') || t.includes('low_balance') || t.includes('paused')) {
    return 'warning';
  }
  return 'info';
}

export function mapNotification(item: NotificationItem): NotificationDisplay {
  const date = new Date(item.createdAt);
  const now = new Date();
  const isToday = !Number.isNaN(date.getTime()) && date.toDateString() === now.toDateString();
  const dayLabel = isToday
    ? 'Today'
    : Number.isNaN(date.getTime())
      ? 'Earlier'
      : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  const timeLabel = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  return {
    id: item.id,
    title: item.title,
    body: item.body,
    timeLabel,
    dayLabel,
    tone: mapTone(item.type),
    category: mapCategory(item.type),
    isRead: item.isRead,
  };
}

export function filterNotifications(
  items: readonly NotificationDisplay[],
  tab: NotificationCategory,
): NotificationDisplay[] {
  if (tab === 'all') {
    return [...items];
  }
  return items.filter((n) => n.category === tab);
}

export function groupNotificationsByDay(
  items: readonly NotificationDisplay[],
): { dayLabel: string; items: NotificationDisplay[] }[] {
  const order: string[] = [];
  const map = new Map<string, NotificationDisplay[]>();
  for (const item of items) {
    if (!map.has(item.dayLabel)) {
      map.set(item.dayLabel, []);
      order.push(item.dayLabel);
    }
    map.get(item.dayLabel)!.push(item);
  }
  return order.map((dayLabel) => ({ dayLabel, items: map.get(dayLabel)! }));
}

export const notificationsApi = {
  /** In-app alerts feed — separate from wallet ledger (`GET /users/me/transactions`). */
  list: async (page = 1, limit = 100): Promise<{ items: NotificationDisplay[]; unreadCount: number; total: number }> => {
    const res = await apiClient.get('/notifications', { params: { page, limit } });
    const data = unwrapResponse<NotificationsPage>(res);
    const rows = Array.isArray(data.items) ? data.items : [];
    const normalized = rows
      .map((row) => normalizeNotificationRow(row as NotificationApiRow))
      .filter((row) => row.id.length > 0 && row.title);

    return {
      items: normalized.map(mapNotification),
      unreadCount: data.unreadCount ?? 0,
      total: data.total ?? normalized.length,
    };
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  },
};
