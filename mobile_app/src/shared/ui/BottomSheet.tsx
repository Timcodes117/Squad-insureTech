import type { PropsWithChildren } from 'react';

import { Box } from '@/shared/layouts/Box';

type Props = PropsWithChildren<{
  className?: string;
}>;

// TODO: @gorhom/bottom-sheet wrapper + safe-area insets.

export function BottomSheet({ children, className }: Props) {
  return <Box className={className}>{children}</Box>;
}
