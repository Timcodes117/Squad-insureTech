import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import {
  MOCK_CLAIM_NOTIFICATIONS,
  filterNotifications,
  groupNotificationsByDay,
  type NotificationCategory,
} from '@/features/notifications/constants/mockClaimNotifications';
import { DashboardScreenShell } from '@/shared/ui/dashboard';
import { Text } from '@/shared/typography/Text';

const ALERT_TABS: { id: NotificationCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'claims', label: 'Claims' },
  { id: 'wallet', label: 'Wallet' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<NotificationCategory>('all');

  const filtered = useMemo(() => filterNotifications(MOCK_CLAIM_NOTIFICATIONS, tab), [tab]);
  const grouped = useMemo(() => groupNotificationsByDay(filtered), [filtered]);

  return (
    <DashboardScreenShell title="Alerts" subtitle="Claims and wallet updates" onBack={() => router.back()}>
      <View className="mt-2 flex-row gap-2 px-5">
        {ALERT_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 active:opacity-90 ${active ? 'bg-brand-600' : 'bg-neutral-100'}`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-neutral-600'}`}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2 px-5">
        {grouped.length === 0 ? (
          <Text className="py-8 text-center text-sm text-neutral-500">No alerts in this filter yet.</Text>
        ) : (
          grouped.map((group) => (
            <View key={group.dayLabel} className="mb-2">
              <Text className="py-3 text-sm font-semibold text-neutral-500">{group.dayLabel}</Text>
              {group.items.map((item, idx) => (
                <NotificationRow key={item.id} item={item} bordered={idx < group.items.length - 1} />
              ))}
            </View>
          ))
        )}
      </View>
    </DashboardScreenShell>
  );
}
