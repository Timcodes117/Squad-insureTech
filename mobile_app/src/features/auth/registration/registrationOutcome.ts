import type { RegisterResult } from '../types/auth.types';

export type PostRegisterStep = 'wallet' | 'wallet_setup_issue';

/** Decide which screen to show after POST /auth/register — never "wallet ready" without a VA. */
export function resolvePostRegisterStep(result: RegisterResult): PostRegisterStep {
  const accountNumber = result.user.virtualAccountNumber?.trim();
  const hasWarning = Boolean(result.virtualAccountWarning?.trim());

  if (accountNumber && !hasWarning) {
    return 'wallet';
  }
  return 'wallet_setup_issue';
}

export function hasFundableVirtualAccount(user: { virtualAccountNumber?: string | null }): boolean {
  return Boolean(user.virtualAccountNumber?.trim());
}
