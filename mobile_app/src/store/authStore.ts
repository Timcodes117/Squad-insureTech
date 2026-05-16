import { create } from 'zustand';

import type { BackendUser } from '@/types/backend';

type AuthState = {
  user: BackendUser | null;
  hydrated: boolean;
  setUser: (user: BackendUser | null) => void;
  setHydrated: (value: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user }),
  setHydrated: (hydrated) => set({ hydrated }),
  clearAuth: () => set({ user: null, hydrated: true }),
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.user !== null);
}
