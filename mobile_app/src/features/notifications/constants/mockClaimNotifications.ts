export type NotificationCategory = 'all' | 'claims' | 'wallet';

export type MockNotification = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  dayLabel: string;
  tone: 'info' | 'success' | 'warning';
  category: Exclude<NotificationCategory, 'all'>;
};

export const MOCK_CLAIM_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n1',
    title: 'Claim submitted',
    body: 'Island Clinic sent a malaria visit for ₦12,000. We are reviewing now.',
    timeLabel: '12 min ago',
    dayLabel: 'Today',
    tone: 'info',
    category: 'claims',
  },
  {
    id: 'n2',
    title: 'Claim approved',
    body: '₦12,000 approved toward your monthly cap. Hospital payout queued (demo).',
    timeLabel: '8 min ago',
    dayLabel: 'Today',
    tone: 'success',
    category: 'claims',
  },
  {
    id: 'n3',
    title: 'Week-one cap reminder',
    body: 'First week after activation: up to ₦5,000 per claim until your cover fully opens.',
    timeLabel: '4:20 PM',
    dayLabel: 'Yesterday',
    tone: 'warning',
    category: 'wallet',
  },
  {
    id: 'n4',
    title: 'Premium received',
    body: 'Your first wallet top-up was recorded. The 3-day hospital wait has started.',
    timeLabel: '9:05 AM',
    dayLabel: 'Yesterday',
    tone: 'success',
    category: 'wallet',
  },
];

export function filterNotifications(
  items: readonly MockNotification[],
  tab: NotificationCategory,
): MockNotification[] {
  if (tab === 'all') {
    return [...items];
  }
  return items.filter((n) => n.category === tab);
}

export function groupNotificationsByDay(
  items: readonly MockNotification[],
): { dayLabel: string; items: MockNotification[] }[] {
  const order: string[] = [];
  const map = new Map<string, MockNotification[]>();

  for (const item of items) {
    if (!map.has(item.dayLabel)) {
      map.set(item.dayLabel, []);
      order.push(item.dayLabel);
    }
    map.get(item.dayLabel)!.push(item);
  }

  return order.map((dayLabel) => ({ dayLabel, items: map.get(dayLabel)! }));
}
