export const ONBOARDING_LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'yo', label: 'Yoruba' },
  { id: 'ig', label: 'Igbo' },
  { id: 'ha', label: 'Hausa' },
  { id: 'pcm', label: 'Pidgin' },
] as const;

export type OnboardingLanguageOption = { id: string; label: string };

/** App-wide language code (matches SecureStore + welcome assets). */
export type AppLanguageCode = (typeof ONBOARDING_LANGUAGE_OPTIONS)[number]['id'];
