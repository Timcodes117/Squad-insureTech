import { buildRegisterPayload } from './buildRegisterPayload';
import type { RegistrationDraftState } from './registrationDraftStore';
import { isAdultIsoDate, isValidIsoDateString, normalizeStoredDob } from './dobUtils';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Returns a user-facing message, or null if the draft can be submitted. */
export function validateRegistrationDraft(
  draft: Pick<
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
  >,
): string | null {
  const first = draft.firstName.trim();
  const last = draft.lastName.trim();
  if (!first || !last) {
    return 'Enter your first and last name as they appear on your bank ID.';
  }

  const phone = draft.phoneDigits.replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 11) {
    return 'Enter a valid Nigerian phone number.';
  }

  if (!isValidEmail(draft.email)) {
    return 'Enter a valid email address.';
  }

  const dob = normalizeStoredDob(draft.dob);
  if (!isValidIsoDateString(dob)) {
    return 'Select your date of birth using the date picker.';
  }
  if (!isAdultIsoDate(dob)) {
    return 'You must be at least 18 years old to register.';
  }

  if (draft.password.length < 8) {
    return 'Your password must be at least 8 characters.';
  }

  if (draft.bvn.replace(/\D/g, '').length !== 11) {
    return 'Enter your 11-digit BVN.';
  }

  if (draft.gender !== 'male' && draft.gender !== 'female') {
    return 'Select Male or Female as on your bank records.';
  }

  if (!draft.state || draft.lga.trim().length < 2 || draft.homeAddress.trim().length < 5) {
    return 'Complete your state, LGA, and home address.';
  }

  if (!draft.occupationId) {
    return 'Select the option that best describes your work.';
  }

  if (!buildRegisterPayload(draft)) {
    return 'Some details are missing or invalid. Please review each step.';
  }

  return null;
}
