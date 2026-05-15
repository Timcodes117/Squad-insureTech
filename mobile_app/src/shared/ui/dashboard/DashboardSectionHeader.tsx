import { Pressable, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function DashboardSectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-5">
      <Text className="text-base font-bold text-neutral-900">{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text className="text-sm font-semibold text-brand-600">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
