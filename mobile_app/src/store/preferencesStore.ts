import { create } from 'zustand';

type PreferencesState = {
  language: string | null;
  setLanguage: (language: string | null) => void;
};

// TODO: sync with backend user preferences when available.
export const usePreferencesStore = create<PreferencesState>((set) => ({
  language: null,
  setLanguage: (language) => set({ language }),
}));
