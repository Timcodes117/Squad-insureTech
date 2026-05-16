import type { PropsWithChildren, ReactNode } from 'react';
import type { RefreshControlProps } from 'react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronLeft } from 'lucide-react-native';

import { Text } from '@/shared/typography/Text';

import { DASHBOARD } from './dashboardTokens';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  scrollable?: boolean;
  footer?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}>;

export function DashboardScreenShell({
  children,
  title,
  subtitle,
  onBack,
  showNotification = false,
  onNotificationPress,
  scrollable = true,
  footer,
  refreshControl,
}: Props) {
  const header = (
    <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <ChevronLeft size={22} color={DASHBOARD.ink} />
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
      <View className="flex-1 px-3">
        <Text className="text-center text-lg font-bold text-neutral-900">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-center text-xs text-neutral-500">{subtitle}</Text> : null}
      </View>
      {showNotification ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={onNotificationPress}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-neutral-100"
        >
          <Bell size={22} color={DASHBOARD.primary} />
        </Pressable>
      ) : (
        <View className="h-11 w-11" />
      )}
    </View>
  );

  const body = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: footer ? 16 : 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1">{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ backgroundColor: DASHBOARD.bg }} edges={['top']}>
      {header}
      {body}
      {footer ? <View className="border-t border-neutral-200 bg-white px-5 pb-4 pt-3">{footer}</View> : null}
    </SafeAreaView>
  );
}
