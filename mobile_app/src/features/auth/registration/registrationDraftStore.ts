import { create } from 'zustand';

import { secureStorage } from '@/core/storage/secureStorage';
import { STORAGE_KEYS } from '@/core/storage/storageKeys';

type PersistedDraft = {
  stepIndex: number;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneDigits: string;
  nin: string;
  bvn: string;
  gender: string | null;
  state: string | null;
  lga: string;
  homeAddress: string;
  occupationId: string | null;
  password: string;
  otpVerified: boolean;
  faceDone: boolean;
};

export type RegistrationDraftState = PersistedDraft & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateDraft: (patch: Partial<PersistedDraft>) => void;
  clearDraft: () => Promise<void>;
  goToStep: (index: number) => void;
};

const defaultPersist: PersistedDraft = {
  stepIndex: 0,
  firstName: '',
  middleName: '',
  lastName: '',
  phoneDigits: '',
  nin: '',
  bvn: '',
  gender: null,
  state: null,
  lga: '',
  homeAddress: '',
  occupationId: null,
  password: '',
  otpVerified: false,
  faceDone: false,
};

function pickPersisted(s: RegistrationDraftState): PersistedDraft {
  return {
    stepIndex: s.stepIndex,
    firstName: s.firstName,
    middleName: s.middleName,
    lastName: s.lastName,
    phoneDigits: s.phoneDigits,
    nin: s.nin,
    bvn: s.bvn,
    gender: s.gender,
    state: s.state,
    lga: s.lga,
    homeAddress: s.homeAddress,
    occupationId: s.occupationId,
    password: s.password,
    otpVerified: s.otpVerified,
    faceDone: s.faceDone,
  };
}

async function writeDraft(p: PersistedDraft) {
  await secureStorage.setItem(STORAGE_KEYS.registrationDraft, JSON.stringify(p));
}

function migrateLegacyNameFields(parsed: Record<string, unknown>): Pick<PersistedDraft, 'firstName' | 'middleName' | 'lastName'> {
  const first = typeof parsed.firstName === 'string' ? parsed.firstName : '';
  const middle = typeof parsed.middleName === 'string' ? parsed.middleName : '';
  const last = typeof parsed.lastName === 'string' ? parsed.lastName : '';
  if (first.trim() || middle.trim() || last.trim()) {
    return { firstName: first, middleName: middle, lastName: last };
  }
  const legacy = parsed.fullName;
  if (typeof legacy === 'string' && legacy.trim()) {
    const parts = legacy.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0] ?? '', middleName: '', lastName: '' };
    }
    if (parts.length === 2) {
      return { firstName: parts[0] ?? '', middleName: '', lastName: parts[1] ?? '' };
    }
    return {
      firstName: parts[0] ?? '',
      middleName: parts.slice(1, -1).join(' '),
      lastName: parts[parts.length - 1] ?? '',
    };
  }
  return { firstName: '', middleName: '', lastName: '' };
}

export const useRegistrationDraftStore = create<RegistrationDraftState>((set, get) => ({
  ...defaultPersist,
  hydrated: false,

  hydrate: async () => {
    const raw = await secureStorage.getItem(STORAGE_KEYS.registrationDraft);
    if (!raw) {
      set({ ...defaultPersist, hydrated: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const names = migrateLegacyNameFields(parsed);
      const restCopy = { ...parsed };
      delete restCopy.fullName;
      delete restCopy.planId;
      delete restCopy.paymentFrequency;
      delete restCopy.ageRange;
      const rest = restCopy as Partial<PersistedDraft>;
      const occupationRaw = parsed.occupationId;
      const occupationId = typeof occupationRaw === 'string' && occupationRaw.length > 0 ? occupationRaw : null;
      const lga = typeof parsed.lga === 'string' ? parsed.lga : '';
      const homeAddress = typeof parsed.homeAddress === 'string' ? parsed.homeAddress : '';
      const bvn = typeof parsed.bvn === 'string' ? parsed.bvn : '';
      const password = typeof parsed.password === 'string' ? parsed.password : '';
      set({
        ...defaultPersist,
        ...rest,
        ...names,
        occupationId,
        lga,
        homeAddress,
        bvn,
        password,
        hydrated: true,
      });
    } catch {
      set({ ...defaultPersist, hydrated: true });
    }
  },

  updateDraft: (patch) => {
    set((prev) => {
      const next: RegistrationDraftState = { ...prev, ...patch };
      void writeDraft(pickPersisted(next));
      return next;
    });
  },

  clearDraft: async () => {
    await secureStorage.removeItem(STORAGE_KEYS.registrationDraft);
    set({ ...defaultPersist, hydrated: true });
  },

  goToStep: (index) => {
    get().updateDraft({ stepIndex: Math.max(0, index) });
  },
}));
