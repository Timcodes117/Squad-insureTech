import { create } from 'zustand';

type OnboardingState = {
  completed: boolean;
  setCompleted: (value: boolean) => void;
};

// TODO: persist onboarding progress if product requires resume support.
export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,
  setCompleted: (value) => set({ completed: value }),
}));
