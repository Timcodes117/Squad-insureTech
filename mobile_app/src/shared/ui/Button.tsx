import { Pressable } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  title: string;
  className?: string;
  variant?: 'primary' | 'outline' | 'accent';
  onPress?: () => void;
};

// TODO: disabled + loading states.

const variantClass: Record<NonNullable<Props['variant']>, string> = {
  primary: 'rounded-2xl bg-neutral-900 px-5 py-4 active:opacity-90',
  outline: 'rounded-2xl border border-neutral-300 bg-white px-5 py-4 active:bg-neutral-50',
  accent: 'rounded-full bg-violet-600 px-5 py-4 active:opacity-90',
};

const variantTextClass: Record<NonNullable<Props['variant']>, string> = {
  primary: 'text-center text-base font-semibold text-white',
  outline: 'text-center text-base font-semibold text-neutral-900',
  accent: 'text-center text-base font-semibold text-white',
};

export function Button({ title, className, variant = 'primary', onPress }: Props) {
  const box = className ?? variantClass[variant];
  const textClass = variantTextClass[variant];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={box}>
      <Text className={textClass}>{title}</Text>
    </Pressable>
  );
}
