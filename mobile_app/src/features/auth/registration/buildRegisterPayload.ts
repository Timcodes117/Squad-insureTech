import { phoneIdentifierFromDigits } from '@/core/util/phone';

import type { RegisterPayload } from '../types/auth.types';
import { OCCUPATION_OPTIONS } from './registrationConstants';
import type { RegistrationDraftState } from './registrationDraftStore';
import { formatDobForApi, isAdultIsoDate, isValidIsoDateString, normalizeStoredDob } from './dobUtils';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildRegisterPayload(draft: Pick<
  RegistrationDraftState,
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'phoneDigits'
  | 'email'
  | 'dob'
  | 'password'
  | 'bvn'
  | 'gender'
  | 'state'
  | 'lga'
  | 'homeAddress'
  | 'occupationId'
>): RegisterPayload | null {
  const fullName = [draft.firstName, draft.middleName, draft.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');

  const occupation = OCCUPATION_OPTIONS.find((o) => o.id === draft.occupationId)?.label ?? '';
  const gender = draft.gender === 'male' || draft.gender === 'female' ? draft.gender : null;
  const dobIso = normalizeStoredDob(draft.dob);

  if (!fullName || !isValidEmail(draft.email) || !isValidIsoDateString(dobIso) || !isAdultIsoDate(dobIso) || !gender || !occupation) {
    return null;
  }

  const addressParts = [draft.state, draft.lga.trim(), draft.homeAddress.trim()].filter(Boolean);

  return {
    email: draft.email.trim().toLowerCase(),
    phone: phoneIdentifierFromDigits(draft.phoneDigits),
    password: draft.password,
    fullName,
    dob: formatDobForApi(dobIso),
    bvn: draft.bvn.replace(/\D/g, ''),
    occupation,
    gender,
    address: addressParts.join(', ') || undefined,
  };
}

export function isValidDobInput(input: string): boolean {
  const iso = normalizeStoredDob(input);
  return isValidIsoDateString(iso) && isAdultIsoDate(iso);
}
