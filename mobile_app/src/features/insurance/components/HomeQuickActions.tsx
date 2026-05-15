import { useRouter } from 'expo-router';
import { Building2, Phone, Shield, Wallet } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { MOCK_MEMBER_PROFILE } from '@/features/profile/constants/mockMemberProfile';
import { Text } from '@/shared/typography/Text';

type Action = {
  id: string;
  label: string;
  icon: LucideIcon;
  backgroundColor: string;
  onPress: () => void;
};

function QuickActionTile({ label, icon: Icon, backgroundColor, onPress }: Action) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ backgroundColor, aspectRatio: 1 }}
      className="flex-1 items-center justify-center rounded-2xl px-1 active:opacity-90"
    >
      <Icon size={22} color="#ffffff" />
      <Text className="mt-1.5 px-0.5 text-center text-[9px] font-semibold leading-tight text-white">{label}</Text>
    </Pressable>
  );
}

export function HomeQuickActions() {
  const router = useRouter();

  const actions: Action[] = [
    {
      id: 'hospital',
      label: 'Find hospital',
      icon: Building2,
      backgroundColor: '#2563eb',
      onPress: () => router.push('/partner-hospitals'),
    },
    {
      id: 'cover',
      label: 'See cover',
      icon: Shield,
      backgroundColor: '#059669',
      onPress: () => router.push('/(tabs)/coverage'),
    },
    {
      id: 'wallet',
      label: 'Visit wallet',
      icon: Wallet,
      backgroundColor: '#0d9488',
      onPress: () => router.push('/(tabs)/wallet'),
    },
    {
      id: 'support',
      label: 'Call support',
      icon: Phone,
      backgroundColor: '#dc2626',
      onPress: () => void Linking.openURL(`tel:${MOCK_MEMBER_PROFILE.supportPhoneE164}`),
    },
  ];

  return (
    <View className="mt-6 px-5">
      <Text className="text-lg font-bold text-neutral-900">Quick actions</Text>
      <View className="mt-3 flex-row gap-2">
        {actions.map((action) => (
          <QuickActionTile key={action.id} {...action} />
        ))}
      </View>
    </View>
  );
}
