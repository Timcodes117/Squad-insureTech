import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthHydrator } from '@/core/providers/AuthHydrator';
import { queryClient } from '@/core/providers/queryClient';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView className="flex-1">
      <QueryClientProvider client={queryClient}>
        <AuthHydrator>{children}</AuthHydrator>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
