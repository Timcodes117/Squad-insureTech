import '../../global.css';

import { Stack } from 'expo-router';

import { AppProviders } from '@/core/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="premium" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="first-premium" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="withdraw" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="partner-hospitals" />
        <Stack.Screen name="hospital/[id]" />
      </Stack>
    </AppProviders>
  );
}
