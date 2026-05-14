import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_CLAIM_NOTIFICATIONS } from '@/features/notifications/constants/mockClaimNotifications';
import { Card } from '@/shared/ui/Card';
import { Text } from '@/shared/typography/Text';

const toneBorder: Record<(typeof MOCK_CLAIM_NOTIFICATIONS)[number]['tone'], string> = {
  info: 'border-brand-100 bg-brand-50/50',
  success: 'border-brand-200 bg-brand-50',
  warning: 'border-neutral-200 bg-neutral-50',
};

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2">
          <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">BetaHealth</Text>
          <Text className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Alerts</Text>
          <Text className="mt-2 text-sm text-neutral-500">Claim and wallet events (mock list).</Text>
        </View>

        <View className="mt-5 gap-3 px-5">
          {MOCK_CLAIM_NOTIFICATIONS.map((n) => (
            <Card key={n.id} className={`rounded-2xl border p-4 ${toneBorder[n.tone]}`}>
              <Text className="text-base font-bold text-neutral-900">{n.title}</Text>
              <Text className="mt-2 text-sm leading-relaxed text-neutral-700">{n.body}</Text>
              <Text className="mt-3 text-xs font-medium text-neutral-400">{n.timeLabel}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
