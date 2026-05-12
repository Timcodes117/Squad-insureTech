import { create } from 'zustand';

type UiState = {
  isGlobalLoading: boolean;
  setGlobalLoading: (value: boolean) => void;
};

// TODO: replace with targeted loading states per screen where needed.
export const useUiStore = create<UiState>((set) => ({
  isGlobalLoading: false,
  setGlobalLoading: (value) => set({ isGlobalLoading: value }),
}));
