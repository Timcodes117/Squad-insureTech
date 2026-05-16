import { useRouter } from 'expo-router';
import { Building2, Phone, Shield, Wallet } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Linking, Pressable, View } from 'react-native';

import { useInsurance } from '@/features/insurance/hooks/useInsurance';
import { MOCK_MEMBER_PROFILE } from '@/features/profile/constants/mockMemberProfile';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Action = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Filled brand tile — use sparingly (e.g. pay premium) */
  primary?: boolean;
  onPress: () => void;
};

function QuickActionTile({ label, icon: Icon, primary = false, onPress }: Action) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`aspect-square flex-1 items-center justify-center rounded-2xl px-1 py-3 active:opacity-90 ${
        primary ? 'bg-brand-600' : 'bg-white active:bg-brand-50/80'
      }`}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${
          primary ? 'bg-white/15' : 'bg-brand-50'
        }`}
      >
        <Icon size={20} color={primary ? '#ffffff' : BRAND} strokeWidth={2.25} />
      </View>
      <Text
        className={`mt-2 px-0.5 text-center text-[10px] font-semibold leading-tight ${
          primary ? 'text-white' : 'text-neutral-700'
        }`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function HomeQuickActions() {
  const router = useRouter();
  const { data: dashboard } = useInsurance();
  const needsFirstPremium = dashboard?.coverStatus === 'awaiting_funding';

  const actions: Action[] = [
    {
      id: 'hospital',
      label: 'Find hospital',
      icon: Building2,
      onPress: () => router.push('/partner-hospitals'),
    },
    {
      id: 'cover',
      label: 'See cover',
      icon: Shield,
      onPress: () => router.push('/(tabs)/coverage'),
    },
    {
      id: needsFirstPremium ? 'premium' : 'wallet',
      label: needsFirstPremium ? 'Pay premium' : 'Wallet',
      icon: Wallet,
      primary: needsFirstPremium,
      onPress: () =>
        needsFirstPremium ? router.push('/premium' as const) : router.push('/(tabs)/wallet'),
    },
    {
      id: 'support',
      label: 'Support',
      icon: Phone,
      onPress: () => void Linking.openURL(`tel:${MOCK_MEMBER_PROFILE.supportPhoneE164}`),
    },
  ];

  return (
    <View className="mt-6 px-5">
      <Text className="text-lg font-bold text-neutral-900">Quick actions</Text>
      <Text className="mt-0.5 text-sm text-neutral-500">Hospitals, cover, wallet & help</Text>
      <View className="mt-3 flex-row gap-2.5">
        {actions.map((action) => (
          <QuickActionTile key={action.id} {...action} />
        ))}
      </View>
    </View>
  );
}
