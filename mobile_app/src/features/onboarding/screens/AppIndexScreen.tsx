import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingDecorBackground } from '@/features/onboarding/components/OnboardingDecorBackground';
import { LandingHeroMarquee } from '@/features/onboarding/components/LandingHeroMarquee';
import { clearLegacyPlaceholderSession } from '@/features/auth/sessionStorage';
import { Button } from '@/shared/ui/Button';
import { Text } from '@/shared/typography/Text';
import { useOnboardingStore } from '@/store/onboardingStore';

const MIN_SPLASH_MS = 950;
const LOGO = require('../../../../assets/icon.png');

type Phase = 'splash' | 'landing';

export default function AppIndexScreen() {
  const router = useRouter();
  const hydrateFromStorage = useOnboardingStore((s) => s.hydrateFromStorage);
  const [phase, setPhase] = useState<Phase>('splash');
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const started = startedAt.current;
      await clearLegacyPlaceholderSession();
      await hydrateFromStorage();

      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
      if (wait > 0) {
        await new Promise((r) => setTimeout(r, wait));
      }
      if (cancelled) {
        return;
      }
      setPhase('landing');
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromStorage]);

  if (phase === 'splash') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Animated.View entering={FadeIn.duration(520)} exiting={FadeOut.duration(200)}>
          <Image accessibilityIgnoresInvertColors source={LOGO} className="h-28 w-28 rounded-3xl" resizeMode="contain" />
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View pointerEvents="none" className="absolute inset-0">
        <OnboardingDecorBackground />
      </View>

      <View className="z-10 flex-1">
        <View className="px-6 pt-4">
          <View className="items-center">
            <Text className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">BetaHealth</Text>
            <Image accessibilityIgnoresInvertColors source={LOGO} className="mt-2 h-12 w-12 rounded-xl opacity-90" resizeMode="contain" />
          </View>
        </View>

        <LandingHeroMarquee />

        <View className="mt-10 flex-1 px-6 pt-10">
          <Text className="text-left text-[12vw] font-black leading-[1.12] tracking-tight text-neutral-900 w-[90%]">
            Weekly savings. Hospital help when you fall sick.
          </Text>
          <Text className="mt-5 text-left text-base font-normal leading-relaxed text-neutral-500">
            Pay small into your wallet, visit a partner clinic, and let BetaHealth settle the bill up to your monthly limit—built
            for market traders, riders, and artisans across Nigeria.
          </Text>
        </View>

        <View className="gap-3 px-6 pb-6">
          <Button title="Register" variant="accent" onPress={() => router.push('/(onboarding)/flow')} />
          <Button title="I already have an account" variant="outline" className='rounded-[50px] py-3' onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    </SafeAreaView>
  );
}
