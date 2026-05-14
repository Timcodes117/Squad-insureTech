import { create } from 'zustand';

import { secureStorage } from '@/core/storage/secureStorage';
import { STORAGE_KEYS } from '@/core/storage/storageKeys';

import { DEFAULT_PLAN_ID, LEGACY_STARTER_PLAN_ID, planById, planForTier, tierForOccupationId } from './registrationConstants';

export type PaymentFrequency = 'weekly' | 'monthly';

type PersistedDraft = {
  stepIndex: number;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneDigits: string;
  nin: string;
  ageRange: string | null;
  gender: string | null;
  state: string | null;
  paymentFrequency: PaymentFrequency | null;
  occupationId: string | null;
  planId: string | null;
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
  ageRange: null,
  gender: null,
  state: null,
  paymentFrequency: null,
  occupationId: null,
  planId: DEFAULT_PLAN_ID,
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
    ageRange: s.ageRange,
    gender: s.gender,
    state: s.state,
    paymentFrequency: s.paymentFrequency,
    occupationId: s.occupationId,
    planId: s.planId,
    otpVerified: s.otpVerified,
    faceDone: s.faceDone,
  };
}

async function writeDraft(p: PersistedDraft) {
  await secureStorage.setItem(STORAGE_KEYS.registrationDraft, JSON.stringify(p));
}

function migratePlanId(raw: unknown): string {
  if (raw === LEGACY_STARTER_PLAN_ID) {
    return DEFAULT_PLAN_ID;
  }
  if (typeof raw === 'string' && planById(raw)) {
    return raw;
  }
  return DEFAULT_PLAN_ID;
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
      const rest = restCopy as Partial<PersistedDraft>;
      const occupationRaw = parsed.occupationId;
      const occupationId = typeof occupationRaw === 'string' && occupationRaw.length > 0 ? occupationRaw : null;
      const planId = migratePlanId(parsed.planId);
      const tier = tierForOccupationId(occupationId);
      const syncedPlanId = tier ? planForTier(tier).id : planId;
      set({
        ...defaultPersist,
        ...rest,
        ...names,
        occupationId,
        planId: syncedPlanId,
        hydrated: true,
      });
    } catch {
      set({ ...defaultPersist, hydrated: true });
    }
  },

  updateDraft: (patch) => {
    set((prev) => {
      let next: RegistrationDraftState = { ...prev, ...patch };
      if (patch.occupationId !== undefined && patch.occupationId !== prev.occupationId) {
        const tier = tierForOccupationId(patch.occupationId);
        if (tier) {
          next = { ...next, planId: planForTier(tier).id };
        }
      }
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
