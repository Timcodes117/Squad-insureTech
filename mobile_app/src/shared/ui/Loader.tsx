import { ActivityIndicator } from 'react-native';

import { Box } from '@/shared/layouts/Box';

type Props = {
  className?: string;
};

// TODO: branded loader / skeleton screens.

export function Loader({ className }: Props) {
  return (
    <Box className={className ?? 'items-center justify-center p-6'}>
      <ActivityIndicator />
    </Box>
  );
}
