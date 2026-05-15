import type { PropsWithChildren } from 'react';

import { Box } from '@/shared/layouts/Box';

type Props = PropsWithChildren<{
  className?: string;
}>;

// TODO: elevation + pressable card variant.

export function Card({ children, className }: Props) {
  return <Box className={className ?? 'rounded-xl border border-neutral-200 p-4'}>{children}</Box>;
}
