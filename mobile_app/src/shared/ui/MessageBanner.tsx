import { Pressable, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Variant = 'error' | 'warning' | 'info' | 'success';

const STYLES: Record<Variant, { container: string; title: string; body: string }> = {
  error: {
    container: 'bg-red-600',
    title: 'text-white',
    body: 'text-white/90',
  },
  warning: {
    container: 'bg-amber-600',
    title: 'text-white',
    body: 'text-white/90',
  },
  info: {
    container: 'bg-brand-600',
    title: 'text-white',
    body: 'text-white/90',
  },
  success: {
    container: 'bg-emerald-600',
    title: 'text-white',
    body: 'text-white/90',
  },
};

type Props = {
  variant: Variant;
  message: string;
  title?: string;
  onDismiss?: () => void;
};

export function MessageBanner({ variant, message, title, onDismiss }: Props) {
  const s = STYLES[variant];
  return (
    <View className={`rounded-xl px-4 py-3.5 ${s.container}`} accessibilityRole="alert">
      {title ? <Text className={`text-sm font-bold ${s.title}`}>{title}</Text> : null}
      <Text className={`text-sm leading-relaxed ${title ? 'mt-1' : ''} ${s.body}`}>{message}</Text>
      {onDismiss ? (
        <Pressable accessibilityRole="button" onPress={onDismiss} className="mt-2 self-start active:opacity-80">
          <Text className={`text-sm font-semibold underline ${s.title}`}>Dismiss</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
