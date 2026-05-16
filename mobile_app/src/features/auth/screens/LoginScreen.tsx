import { useRouter } from 'expo-router';
import { ChevronDown, Phone } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getApiErrorMessage } from '@/core/api/unwrapResponse';
import { phoneIdentifierFromDigits } from '@/core/util/phone';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHardwareBackHandler } from '@/features/auth/hooks/useHardwareBackHandler';
import { useLoginFlowStore } from '@/features/auth/loginFlowStore';
import { LabeledTextInput } from '@/features/auth/registration/LabeledTextInput';
import { Text } from '@/shared/typography/Text';

const ACCENT = '#2563eb';

function formatPhoneDisplay(digits: string) {
  return digits.replace(/\D/g, '').slice(0, 11);
}

export default function LoginScreen() {
  const router = useRouter();
  const { requestOtp } = useAuth();
  const setStagedPassword = useLoginFlowStore((s) => s.setStagedPassword);
  const clearLoginFlow = useLoginFlowStore((s) => s.clear);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const goBack = useCallback(() => {
    clearLoginFlow();
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [router, clearLoginFlow]);

  useHardwareBackHandler(goBack);

  const d = phoneDigits.replace(/\D/g, '');
  const phoneOk = d.length >= 10 && d.length <= 11;
  const passwordOk = password.length >= 8;
  const canContinue = phoneOk && passwordOk && !requestOtp.isPending;

  const onContinue = async () => {
    setError(null);
    const identifier = phoneIdentifierFromDigits(d);
    try {
      await requestOtp.mutateAsync({ identifier, password });
      setStagedPassword(password);
      router.push({ pathname: '/(auth)/otp', params: { phone: d } });
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  const footer = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      disabled={!canContinue}
      onPress={() => void onContinue()}
      className="mb-2 w-full items-center rounded-xl py-4 active:opacity-90"
      style={{ backgroundColor: ACCENT, opacity: canContinue ? 1 : 0.45 }}
    >
      {requestOtp.isPending ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-base font-semibold text-white">Continue</Text>
      )}
    </Pressable>
  );

  return (
    <AuthScreenLayout onBack={goBack} footer={footer}>
      <Text className="text-[28px] font-bold leading-tight tracking-tight text-neutral-900">Welcome back</Text>
      <Text className="mt-2 text-base leading-relaxed text-neutral-500">
        Sign in with your phone number and password. We will text you a code to finish signing in.
      </Text>

      {error ? <Text className="mt-4 text-sm text-red-600">{error}</Text> : null}

      <View className="mt-8 gap-4">
        <LabeledTextInput
          label="Phone number"
          required
          value={formatPhoneDisplay(phoneDigits)}
          onChangeText={(t) => setPhoneDigits(t.replace(/\D/g, '').slice(0, 11))}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          autoCapitalize="none"
          leftAccessory={
            <View className="mr-2 flex-row items-center gap-1 border-r border-neutral-200 pr-2">
              <Text className="text-sm font-semibold text-neutral-700">NG</Text>
              <ChevronDown size={16} color="#737373" />
              <Text className="text-sm text-neutral-500">+234</Text>
            </View>
          }
          rightAccessory={<Phone size={20} color="#a3a3a3" style={{ marginLeft: 4 }} />}
          accessibilityLabel="Phone number"
        />
        <LabeledTextInput
          label="Password"
          required
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          autoCapitalize="none"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          accessibilityLabel="Password"
        />
        <Text className="text-xs leading-relaxed text-neutral-500">Use at least 8 characters. Next, enter the code we send by SMS.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to registration"
        onPress={() => router.push('/(auth)/register')}
        className="mt-8 self-center py-2 active:opacity-80"
      >
        <Text className="text-center text-base font-semibold text-brand-700">Need an account? Register</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}
