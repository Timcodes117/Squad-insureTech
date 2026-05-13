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
    description: 'Tap play to hear a short hello in the language you chose.',
  },
];
