import { create } from 'zustand';

import { secureStorage } from '@/core/storage/secureStorage';
import { STORAGE_KEYS } from '@/core/storage/storageKeys';

type OnboardingState = {
  completed: boolean;
  hydrated: boolean;
  preferredLanguage: string | null;
  hydrateFromStorage: () => Promise<void>;
  setCompleted: (value: boolean) => Promise<void>;
  setPreferredLanguage: (code: string) => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: false,
  hydrated: false,
  preferredLanguage: null,
  hydrateFromStorage: async () => {
    const [rawCompleted, rawLang] = await Promise.all([
      secureStorage.getItem(STORAGE_KEYS.onboardingCompleted),
      secureStorage.getItem(STORAGE_KEYS.preferredLanguage),
    ]);
    set({
      completed: rawCompleted === 'true',
      preferredLanguage: rawLang ?? null,
      hydrated: true,
    });
  },
  setCompleted: async (value) => {
    await secureStorage.setItem(STORAGE_KEYS.onboardingCompleted, value ? 'true' : 'false');
    set({ completed: value });
  },
  setPreferredLanguage: async (code) => {
    await secureStorage.setItem(STORAGE_KEYS.preferredLanguage, code);
    set({ preferredLanguage: code });
  },
}));
