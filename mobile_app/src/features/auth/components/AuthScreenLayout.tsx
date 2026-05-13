import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeft } from 'lucide-react-native';

type Props = PropsWithChildren<{
  onBack: () => void;
  footer?: ReactNode;
  scrollable?: boolean;
}>;

export function AuthScreenLayout({ children, onBack, footer, scrollable = true }: Props) {
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
          <View className="flex-row items-center pb-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={onBack}
              className="h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white active:bg-neutral-50"
            >
              <ChevronLeft size={22} color="#171717" />
            </Pressable>
          </View>

          {body}

          {footer ? <View className="border-t border-neutral-100 bg-white pt-3">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
