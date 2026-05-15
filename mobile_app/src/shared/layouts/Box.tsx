import type { PropsWithChildren } from 'react';
import { View as RNView } from 'react-native';

type Props = PropsWithChildren<{
  className?: string;
}>;

export function Box({ children, className }: Props) {
  return <RNView className={className}>{children}</RNView>;
}
