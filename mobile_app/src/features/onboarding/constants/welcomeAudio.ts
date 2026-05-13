import type { AVPlaybackSource } from 'expo-av';

import type { AppLanguageCode } from '@/features/onboarding/constants/onboardingLanguages';

export type WelcomeAudioEntry = {
  code: AppLanguageCode;
  source: AVPlaybackSource;
};

/**
 * Bundled welcome clips under `assets/audio/onboarding/` at the app root (`welcome-{code}.mp3`).
 * Replace files or add entries as you ship real recordings per language.
 */
export const WELCOME_AUDIO_ENTRIES: WelcomeAudioEntry[] = [
  { code: 'en', source: require('../../../../assets/audio/onboarding/welcome-en.mp3') },
  { code: 'yo', source: require('../../../../assets/audio/onboarding/welcome-yo.mp3') },
  { code: 'ig', source: require('../../../../assets/audio/onboarding/welcome-ig.mp3') },
  { code: 'ha', source: require('../../../../assets/audio/onboarding/welcome-ha.mp3') },
  { code: 'pcm', source: require('../../../../assets/audio/onboarding/welcome-pcm.mp3') },
];

const welcomeAudioByCode = Object.fromEntries(WELCOME_AUDIO_ENTRIES.map((e) => [e.code, e.source])) as Record<
  AppLanguageCode,
  AVPlaybackSource
>;

/** Pick the welcome clip for the current language (falls back to English). */
export function resolveWelcomeAudioSource(languageCode: string | null): AVPlaybackSource {
  const fallback: AppLanguageCode = 'en';
  const code = (languageCode ?? fallback) as AppLanguageCode;
  return welcomeAudioByCode[code] ?? welcomeAudioByCode[fallback];
}
