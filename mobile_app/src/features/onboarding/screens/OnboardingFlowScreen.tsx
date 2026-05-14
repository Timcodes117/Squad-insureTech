import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ONBOARDING_LANGUAGE_OPTIONS } from '@/features/onboarding/constants/onboardingLanguages';
import { ONBOARDING_STEPS } from '@/features/onboarding/constants/onboardingSteps';
import { resolveWelcomeAudioSource } from '@/features/onboarding/constants/welcomeAudio';
import { getWelcomeGreetingForLanguage } from '@/features/onboarding/constants/welcomeGreetings';
import { useHardwareBackHandler } from '@/features/auth/hooks/useHardwareBackHandler';
import { OnboardingDecorBackground } from '@/features/onboarding/components/OnboardingDecorBackground';
import { Text } from '@/shared/typography/Text';
import { useOnboardingStore } from '@/store/onboardingStore';
import { PauseIcon, PlayIcon } from 'lucide-react-native';

const NEXT_ACCENT = '#2563eb';

export default function OnboardingFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setCompleted = useOnboardingStore((s) => s.setCompleted);
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useOnboardingStore((s) => s.setPreferredLanguage);
  const [index, setIndex] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const step = ONBOARDING_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === ONBOARDING_STEPS.length - 1;
  const hasHero = Boolean(step.imageUrl?.trim());
  const isWelcomeStep = step.id === 'welcome';

  const playbackSource = useMemo(() => {
    if (isWelcomeStep) {
      return resolveWelcomeAudioSource(preferredLanguage);
    }
    return step.audioSource ?? null;
  }, [isWelcomeStep, preferredLanguage, step.audioSource]);

  const hasAudio = playbackSource != null;
  const totalSteps = ONBOARDING_STEPS.length;
  const needsLanguageChoice = Boolean(step.languagePicker);
  const canProceedLanguage = !needsLanguageChoice || Boolean(preferredLanguage);

  const welcomeGreeting = useMemo(
    () => (isWelcomeStep ? getWelcomeGreetingForLanguage(preferredLanguage) : null),
    [isWelcomeStep, preferredLanguage],
  );

  const welcomeHasLongCopy = Boolean(welcomeGreeting?.paragraphs?.length);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setAudioPlaying(false);

      if (!playbackSource) {
        return;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        playbackSource,
        { shouldPlay: false },
        (status) => {
          if (!status.isLoaded) {
            return;
          }
          setAudioPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setAudioPlaying(false);
          }
        },
      );

      if (cancelled) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
    })();

    return () => {
      cancelled = true;
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
      setAudioPlaying(false);
    };
  }, [playbackSource]);

  const toggleStepAudio = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) {
      return;
    }
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) {
      return;
    }
    if (status.isPlaying) {
      await sound.pauseAsync();
      return;
    }
    const atEnd =
      status.didJustFinish ||
      (status.durationMillis != null &&
        status.positionMillis != null &&
        status.positionMillis >= status.durationMillis - 80);
    if (atEnd) {
      await sound.setPositionAsync(0);
    }
    await sound.playAsync();
  }, []);

  const skipToRegistration = useCallback(async () => {
    void soundRef.current?.pauseAsync();
    await setCompleted(true);
    router.replace('/(auth)/register');
  }, [router, setCompleted]);

  const handleHardwareBack = useCallback(() => {
    if (index > 0) {
      setIndex((i) => Math.max(0, i - 1));
      return;
    }
    void soundRef.current?.pauseAsync();
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, [index, router]);

  useHardwareBackHandler(handleHardwareBack);

  const goNext = useCallback(async () => {
    if (!canProceedLanguage) {
      return;
    }
    if (isLast) {
      await soundRef.current?.stopAsync();
      await setCompleted(true);
      router.replace('/(auth)/register');
      return;
    }
    setIndex((i) => i + 1);
  }, [canProceedLanguage, isLast, router, setCompleted]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View pointerEvents="none" className="absolute inset-0">
        <OnboardingDecorBackground />
      </View>

      <View className="z-10 flex-1 px-6 pt-5">
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: totalSteps, now: index + 1 }}
          className="mb-4 flex-row gap-1 pt-1"
        >
          {ONBOARDING_STEPS.map((s, i) => (
            <View key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-neutral-200">
              <View
                className="h-full rounded-full bg-brand-600"
                style={{ width: i <= index ? '100%' : '0%' }}
              />
            </View>
          ))}
        </View>

        {hasHero ? (
          <View className="mt-1 w-full max-w-sm self-center items-center">
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: step.imageUrl!.trim() }}
              className="w-full rounded-3xl bg-neutral-100"
              style={{ height: step.imageHeight ?? 224 }}
              resizeMode={step.imageResizeMode ?? 'cover'}
            />
          </View>
        ) : null}

        <View className={`flex-1  pt-10 gap-4 ${hasHero ? 'mt-8' : 'mt-2'}`}>
          {isWelcomeStep && welcomeGreeting ? (
            welcomeHasLongCopy ? (
              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
              >
                <View className="gap-4">
                <Text className="text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {welcomeGreeting.languageLabel}
                </Text>
                {welcomeGreeting.introLabel ? (
                  <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{welcomeGreeting.introLabel}</Text>
                ) : null}
                {welcomeGreeting.paragraphs!.map((paragraph, i) => (
                  <Text key={i} className="text-left text-base font-normal leading-relaxed text-neutral-900">
                    {paragraph}
                  </Text>
                ))}
                <Text className="text-left text-base font-normal leading-relaxed text-neutral-500">{step.description}</Text>
                </View>
              </ScrollView>
            ) : (
              <View className="items-center gap-2">
                <Text className="text-center text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {welcomeGreeting.languageLabel}
                </Text>
                <Text className="min-h-[120px] text-center text-5xl font-black tracking-tight text-neutral-900">{welcomeGreeting.text}</Text>
              </View>
            )
          ) : (
            <Text className="text-left text-[32px] font-black leading-[1.12] tracking-tight text-neutral-900">{step.title}</Text>
          )}
          {!(isWelcomeStep && welcomeHasLongCopy) ? (
            <Text className="text-left text-base font-normal leading-relaxed text-neutral-500">{step.description}</Text>
          ) : null}

          {step.languagePicker ? (
            <View className="mt-2 gap-3" accessibilityRole="radiogroup" accessibilityLabel="Language">
              {ONBOARDING_LANGUAGE_OPTIONS.map((opt) => {
                const selected = preferredLanguage === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => void setPreferredLanguage(opt.id)}
                    className={`flex-row items-center gap-3 rounded-2xl border-[0.5px] px-4 py-3.5 active:opacity-90 ${
                      selected ? 'border-brand-600 bg-brand-50' : 'border-neutral-200 '
                    }`}
                  >
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-brand-600' : 'border-neutral-300'
                      }`}
                    >
                      {selected ? <View className="h-2.5 w-2.5 rounded-full bg-brand-600" /> : null}
                    </View>
                    <Text className="flex-1 text-base font-semibold text-neutral-900">{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between pb-2 pt-6">
          <Pressable accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12} onPress={() => void skipToRegistration()} className="py-3 pr-4">
            <Text className="text-[15px] font-medium text-neutral-400">Skip</Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous step"
              disabled={isFirst}
              onPress={goPrev}
              className={`h-12 w-12 items-center justify-center rounded-full border border-neutral-300 bg-white ${
                isFirst ? 'opacity-35' : 'active:bg-neutral-50'
              }`}
            >
              <Text className="pb-0.5 text-2xl font-bold text-neutral-900">‹</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Finish' : 'Next step'}
              disabled={!canProceedLanguage}
              onPress={goNext}
              className={
                isLast
                  ? 'min-h-14 min-w-[100px] items-center justify-center rounded-full px-6 active:opacity-90'
                  : 'h-14 w-14 items-center justify-center rounded-full active:opacity-90'
              }
              style={{
                backgroundColor: NEXT_ACCENT,
                opacity: !canProceedLanguage ? 0.4 : 1,
              }}
            >
              {isLast ? (
                <Text className="text-base font-semibold text-white">Finish</Text>
              ) : (
                <Text className="pb-0.5 text-2xl font-bold text-white">›</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {hasAudio ? (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 bottom-0 z-20 items-center"
          style={{ paddingBottom: insets.bottom + 88 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={audioPlaying ? 'Pause audio' : 'Play audio'}
            onPress={() => void toggleStepAudio()}
            className="h-14 w-14 items-center justify-center rounded-full shadow-md shadow-black/25 active:opacity-90"
            style={{ backgroundColor: NEXT_ACCENT }}
          >
            <Text className="text-xl text-white">{audioPlaying ? <PauseIcon size={24} color="white" /> : <PlayIcon size={24} color="white" fill="white" />}</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
