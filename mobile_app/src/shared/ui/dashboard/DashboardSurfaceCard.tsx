import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

type Props = PropsWithChildren<{
  className?: string;
  variant?: 'default' | 'primary' | 'dark';
}>;

const variantClass: Record<NonNullable<Props['variant']>, string> = {
  default: 'border border-neutral-200 bg-white',
  dark: 'bg-neutral-900',
  primary: 'bg-brand-600',
};

export function DashboardSurfaceCard({ children, className, variant = 'default' }: Props) {
  return (
    <View className={`mx-5 overflow-hidden rounded-3xl ${variantClass[variant]} ${className ?? ''}`}>{children}</View>
  );
}
