import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { phoneIdentifierFromDigits } from '@/core/util/phone';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHardwareBackHandler } from '@/features/auth/hooks/useHardwareBackHandler';
import { useLoginFlowStore } from '@/features/auth/loginFlowStore';
import { OtpSixInput } from '@/features/auth/registration/OtpSixInput';
import { Text } from '@/shared/typography/Text';

const ACCENT = '#2563eb';

function normalizePhoneParam(phone: string | string[] | undefined): string {
  if (phone == null) {
    return '';
  }
  const raw = Array.isArray(phone) ? phone[0] : phone;
  return raw.replace(/\D/g, '').slice(0, 11);
}

export default function OtpScreen() {
  const router = useRouter();
  const { verifyOtp, requestOtp } = useAuth();
  const stagedPassword = useLoginFlowStore((s) => s.stagedPassword);
  const clearLoginFlow = useLoginFlowStore((s) => s.clear);
  const { phone } = useLocalSearchParams<{ phone?: string | string[] }>();
  const phoneDigits = normalizePhoneParam(phone);

  const [otpInput, setOtpInput] = useState('');
  const [resendSec, setResendSec] = useState(45);
  const [error, setError] = useState<string | null>(null);

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

  const identifier = phoneIdentifierFromDigits(phoneDigits);
  const code = otpInput.replace(/\D/g, '');
  const canContinue = code.length === 6 && !verifyOtp.isPending;

  const onContinue = async () => {
    setError(null);
    try {
      await verifyOtp.mutateAsync({ identifier, code });
      clearLoginFlow();
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const onResend = async () => {
    if (resendSec > 0 || !stagedPassword) {
      return;
    }
    setError(null);
    try {
      await requestOtp.mutateAsync({ identifier, password: stagedPassword });
      setResendSec(45);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const displayPhone = phoneDigits ? `+234 ${phoneDigits.replace(/^0/, '')}` : '';

  const footer = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      disabled={!canContinue}
      onPress={() => void onContinue()}
      className="mb-2 w-full items-center rounded-xl py-4 active:opacity-90"
      style={{ backgroundColor: ACCENT, opacity: canContinue ? 1 : 0.45 }}
    >
      {verifyOtp.isPending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-base font-semibold text-white">Continue</Text>
      )}
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

      {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}

      <View className="mt-8 gap-5">
        <OtpSixInput value={otpInput} onChange={setOtpInput} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend code"
          disabled={resendSec > 0 || requestOtp.isPending}
          onPress={() => void onResend()}
          className="self-center"
        >
          <Text className={`text-sm font-semibold ${resendSec > 0 ? 'text-neutral-400' : 'text-brand-700'}`}>
            {resendSec > 0 ? `Resend code in ${resendSec}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
}
