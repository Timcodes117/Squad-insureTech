import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { useHardwareBackHandler } from '@/features/auth/hooks/useHardwareBackHandler';
import { useLoginFlowStore } from '@/features/auth/loginFlowStore';
import { OtpSixInput } from '@/features/auth/registration/OtpSixInput';
import { Text } from '@/shared/typography/Text';

const ACCENT = '#6D28D9';

function normalizePhoneParam(phone: string | string[] | undefined): string {
  if (phone == null) {
    return '';
  }
  const raw = Array.isArray(phone) ? phone[0] : phone;
  return raw.replace(/\D/g, '').slice(0, 11);
}

export default function OtpScreen() {
  const router = useRouter();
  const clearLoginFlow = useLoginFlowStore((s) => s.clear);
  const { phone } = useLocalSearchParams<{ phone?: string | string[] }>();
  const phoneDigits = normalizePhoneParam(phone);

  const [otpInput, setOtpInput] = useState('');
  const [resendSec, setResendSec] = useState(45);

  const goBack = useCallback(() => {
    clearLoginFlow();
    router.replace('/(auth)/login');
  }, [router, clearLoginFlow]);

  useHardwareBackHandler(goBack);

  useEffect(() => {
    if (!phoneDigits) {
      router.replace('/(auth)/login');
    }
  }, [phoneDigits, router]);

  useEffect(() => {
    if (resendSec <= 0) {
      return;
    }
    const t = setInterval(() => setResendSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const canContinue = otpInput.replace(/\D/g, '').length === 6;

  const onContinue = () => {
    clearLoginFlow();
    router.replace('/');
  };

  const displayPhone = phoneDigits ? `+234 ${phoneDigits}` : '';

  const footer = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      disabled={!canContinue}
      onPress={onContinue}
      className="mb-2 w-full items-center rounded-xl py-4 active:opacity-90"
      style={{ backgroundColor: ACCENT, opacity: canContinue ? 1 : 0.45 }}
    >
      <Text className="text-base font-semibold text-white">Continue</Text>
    </Pressable>
  );

  if (!phoneDigits) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <AuthScreenLayout onBack={goBack} footer={footer}>
      <Text className="text-[28px] font-bold leading-tight tracking-tight text-neutral-900">Enter your code</Text>
      <Text className="mt-2 text-base leading-relaxed text-neutral-500">
        We sent a 6-digit code to {displayPhone}. It may take a minute.
      </Text>

      <View className="mt-8 gap-5">
        <OtpSixInput value={otpInput} onChange={setOtpInput} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend code"
          disabled={resendSec > 0}
          onPress={() => setResendSec(45)}
          className="self-center"
        >
          <Text className={`text-sm font-semibold ${resendSec > 0 ? 'text-neutral-400' : 'text-violet-700'}`}>
            {resendSec > 0 ? `Resend code in ${resendSec}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
