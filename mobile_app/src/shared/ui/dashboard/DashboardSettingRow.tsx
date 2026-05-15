import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
};

export function DashboardSettingRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  showChevron = Boolean(onPress),
  isLast = false,
}: Props) {
  const inner = (
    <View
      className={`flex-row items-center gap-3 px-4 py-4 ${!isLast ? 'border-b border-neutral-100' : ''}`}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100">{icon}</View>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-neutral-900">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-sm text-neutral-500">{subtitle}</Text> : null}
      </View>
      {value ? <Text className="text-sm font-semibold text-neutral-700">{value}</Text> : null}
      {showChevron ? <ChevronRight size={20} color="#a3a3a3" /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-90">
        {inner}
      </Pressable>
    );
  }

  return inner;
}
