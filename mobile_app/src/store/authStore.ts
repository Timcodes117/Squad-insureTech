import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

// TODO: hydrate from secure storage on app start.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}));
