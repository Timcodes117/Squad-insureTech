import { useOnboardingStore } from '@/store/onboardingStore';

/**
 * Preferred UI / content language from onboarding (persisted in secure storage).
 * Call `hydrateFromStorage` during app bootstrap so this is populated after cold start.
 */
export function useAppLanguage() {
  const preferredLanguage = useOnboardingStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useOnboardingStore((s) => s.setPreferredLanguage);
  const hydrated = useOnboardingStore((s) => s.hydrated);

  return {
    languageCode: preferredLanguage,
    setLanguageCode: setPreferredLanguage,
    hydrated,
  };
}
