import { create } from 'zustand';

/**
 * Holds login password between Login and OTP screens until verify completes. Not persisted.
 */
type LoginFlowState = {
  stagedPassword: string;
  setStagedPassword: (value: string) => void;
  clear: () => void;
};

export const useLoginFlowStore = create<LoginFlowState>((set) => ({
  stagedPassword: '',
  setStagedPassword: (value) => set({ stagedPassword: value }),
  clear: () => set({ stagedPassword: '' }),
}));
