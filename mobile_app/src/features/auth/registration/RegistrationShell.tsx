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
  /** When false, content fills remaining space (e.g. camera). Default: scrollable. */
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
  const progress = totalSteps > 0 ? Math.min(1, Math.max(0, (stepIndex + 1) / totalSteps)) : 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <View className="min-h-0 flex-1 px-5 pt-2">
          <View className="shrink-0">
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
                  <Volume2 size={20} color="#2563eb" />
                </Pressable>
              ) : (
                <View className="w-11" />
              )}
            </View>

            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Registration progress"
              accessibilityValue={{ min: 0, max: totalSteps, now: Math.min(stepIndex + 1, totalSteps) }}
              className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200"
            >
              <View className="h-full rounded-full bg-brand-600" style={{ width: `${progress * 100}%` }} />
            </View>

            <View className="mb-6" />
          </View>

          {scrollable ? (
            <ScrollView
              style={{ flex: 1 }}
              className="min-h-0 flex-1"
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              nestedScrollEnabled
            >
              {children}
            </ScrollView>
          ) : (
            <View className="min-h-0 flex-1">{children}</View>
          )}

          {footer ? <View className="shrink-0 border-t border-neutral-100 bg-white pt-3">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
