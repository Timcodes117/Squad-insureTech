import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/shared/typography/Text';
import { ChevronLeft, Volume2 } from 'lucide-react-native';

type Props = PropsWithChildren<{
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  showBack?: boolean;
  footer?: ReactNode;
  scrollable?: boolean;
  onReplayVoice?: () => void;
  voiceAvailable?: boolean;
}>;

export function RegistrationShell({
  children,
  stepIndex,
  totalSteps,
  onBack,
  showBack = true,
  footer,
  scrollable = true,
  onReplayVoice,
  voiceAvailable = false,
}: Props) {
  const stepNo = Math.min(stepIndex + 1, totalSteps);
  const body = scrollable ? (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1">{children}</View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View className="flex-1 px-5 pt-2">
          <View className="flex-row items-center justify-between pb-4">
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={12}
                onPress={onBack}
                className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <ChevronLeft size={22} color="#171717" />
              </Pressable>
            ) : (
              <View className="h-11 w-11" />
            )}
            {voiceAvailable && onReplayVoice ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Listen again"
                hitSlop={10}
                onPress={onReplayVoice}
                className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
              >
                <Volume2 size={20} color="#6D28D9" />
              </Pressable>
            ) : (
              <View className="w-11" />
            )}
          </View>

          <Text className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Step {stepNo} of {totalSteps}
          </Text>

          {body}

          {footer ? <View className="border-t border-neutral-100 bg-white pt-3">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
