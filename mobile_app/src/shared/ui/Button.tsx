import { Pressable } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  title: string;
  className?: string;
  onPress?: () => void;
};

// TODO: variants (primary/secondary), disabled + loading states, a11y roles.

export function Button({ title, className, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={className ?? 'rounded-md bg-black px-4 py-3'}>
      <Text className="text-center text-white">{title}</Text>
    </Pressable>
  );
}
