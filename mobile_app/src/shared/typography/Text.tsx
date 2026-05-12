import type { PropsWithChildren } from 'react';
import { Text as RNText } from 'react-native';

type Props = PropsWithChildren<{
  className?: string;
}>;

// TODO: typography tokens (sizes/weights) via NativeWind theme extension.

export function Text({ children, className }: Props) {
  return <RNText className={className}>{children}</RNText>;
}
