import type { PropsWithChildren } from 'react';

import { Box } from '@/shared/layouts/Box';

type Props = PropsWithChildren<{
  className?: string;
}>;

// TODO: safe-area + keyboard avoiding behavior.

export function Screen({ children, className }: Props) {
  return <Box className={className ?? 'flex-1 bg-white'}>{children}</Box>;
}
