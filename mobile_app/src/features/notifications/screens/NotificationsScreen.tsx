import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { usePullToRefresh } from '@/core/hooks/usePullToRefresh';
import {
  filterNotifications,
  groupNotificationsByDay,
  type NotificationCategory,
} from '@/features/notifications/api/notifications.api';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { DashboardScreenShell } from '@/shared/ui/dashboard';
import { MessageBanner } from '@/shared/ui/MessageBanner';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/typography/Text';

const ALERT_TABS: { id: NotificationCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'claims', label: 'Claims' },
  { id: 'wallet', label: 'Wallet' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<NotificationCategory>('all');
  const { data, isLoading, isError, error, refetch } = useNotifications();

  const onRefresh = useCallback(() => refetch(), [refetch]);
  const { refreshControl } = usePullToRefresh(onRefresh);

  const items = data?.items ?? [];
  const filtered = useMemo(() => filterNotifications(items, tab), [items, tab]);
  const grouped = useMemo(() => groupNotificationsByDay(filtered), [filtered]);

  return (
    <DashboardScreenShell
      title="Alerts"
      subtitle="In-app messages (OTP, funding, claims)"
      onBack={() => router.back()}
      refreshControl={refreshControl}
    >
      {typeof data?.unreadCount === 'number' && data.unreadCount > 0 ? (
        <View className="mx-5 mb-2 mt-2 rounded-full bg-brand-100 px-3 py-1.5 self-start">
          <Text className="text-xs font-semibold text-brand-800">{data.unreadCount} unread</Text>
        </View>
      ) : null}

      <View className="mx-5 mb-3 rounded-xl bg-neutral-50 px-3 py-2">
        <Text className="text-xs leading-relaxed text-neutral-600">
          Alerts are not the same as Activity. Wallet transfers and premium burns appear under Activity.
        </Text>
      </View>

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
        {isLoading ? (
          <ActivityIndicator className="py-8" color="#2563eb" />
        ) : isError ? (
          <View className="py-4">
            <MessageBanner variant="error" message={getApiErrorMessage(error)} />
            <View className="mt-4">
              <Button title="Try again" variant="accent" onPress={() => void refetch()} />
            </View>
          </View>
        ) : grouped.length === 0 ? (
          <Text className="py-8 text-center text-sm text-neutral-500">
            {tab === 'all'
              ? 'No alerts yet. Funding, OTP, and claim updates will appear here.'
              : 'No alerts in this filter yet.'}
          </Text>
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
