import { create } from 'zustand';

import { secureStorage } from '@/core/storage/secureStorage';
import { STORAGE_KEYS } from '@/core/storage/storageKeys';
import type { LinkedPayoutAccount } from '@/features/wallet/types/linkedPayoutAccount.types';

type State = {
  account: LinkedPayoutAccount | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  saveAccount: (account: LinkedPayoutAccount) => Promise<void>;
  clearAccount: () => Promise<void>;
};

export const useLinkedPayoutAccountStore = create<State>((set) => ({
  account: null,
  hydrated: false,

  hydrate: async () => {
    const raw = await secureStorage.getItem(STORAGE_KEYS.linkedPayoutAccount);
    if (!raw) {
      set({ account: null, hydrated: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as LinkedPayoutAccount;
      if (parsed.bankCode && parsed.bankName && parsed.accountNumber && parsed.accountName) {
        set({ account: parsed, hydrated: true });
        return;
      }
    } catch {
      // fall through
    }
    set({ account: null, hydrated: true });
  },

  saveAccount: async (account) => {
    await secureStorage.setItem(STORAGE_KEYS.linkedPayoutAccount, JSON.stringify(account));
    set({ account, hydrated: true });
  },

  clearAccount: async () => {
    await secureStorage.removeItem(STORAGE_KEYS.linkedPayoutAccount);
    set({ account: null, hydrated: true });
  },
}));

export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length < 4) {
    return '••••';
  }
  return `•••• ${digits.slice(-4)}`;
}
