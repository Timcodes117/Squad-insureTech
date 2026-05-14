import type { OnboardingStep } from '@/features/onboarding/types/onboardingStep';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'language',
    title: 'Choose your language',
    description: 'We will use this for reminders, support, and your welcome message.',
    languagePicker: true,
  },
  {
    id: 'welcome',
    title: 'Welcome',
    description:
      'BetaHealth is weekly micro-cover for informal workers: fund your wallet, visit partner hospitals for primary care, and walk through the gate with less cash stress (demo app).',
  },
];
