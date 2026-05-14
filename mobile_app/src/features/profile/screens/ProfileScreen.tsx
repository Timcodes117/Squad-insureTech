import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Text } from '@/shared/typography/Text';

const MOCK_PROFILE = {
  name: 'Aisha O.',
  phone: '+234 803 *** **45',
  plan: 'Standard · ₦750/wk',
  cap: '₦20,000 / 30 days',
} as const;

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 px-5 pt-2">
        <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">BetaHealth</Text>
        <Text className="mt-1 text-2xl font-black tracking-tight text-neutral-900">Profile</Text>

        <Card className="mt-6 rounded-2xl border border-neutral-200 p-5">
          <Text className="text-sm font-medium text-neutral-500">Name</Text>
          <Text className="mt-1 text-xl font-bold text-neutral-900">{MOCK_PROFILE.name}</Text>
          <View className="my-4 h-px bg-neutral-100" />
          <Text className="text-sm font-medium text-neutral-500">Phone</Text>
          <Text className="mt-1 text-lg font-semibold text-neutral-900">{MOCK_PROFILE.phone}</Text>
          <View className="my-4 h-px bg-neutral-100" />
          <Text className="text-sm font-medium text-neutral-500">Plan</Text>
          <Text className="mt-1 text-lg font-semibold text-neutral-900">{MOCK_PROFILE.plan}</Text>
          <Text className="mt-1 text-sm text-neutral-600">Cap: {MOCK_PROFILE.cap}</Text>
        </Card>

        <View className="mt-8">
          <Button
            title="Sign out (demo)"
            variant="outline"
            onPress={() => {
              router.replace('/');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
