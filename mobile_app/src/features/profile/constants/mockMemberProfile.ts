/** Demo member profile — replace with API when wired. */
export const MOCK_MEMBER_PROFILE = {
  name: 'Aisha Okafor',
  phone: '+234 803 *** **45',
  phoneE164: '+2348030000045',
  dateOfBirth: '14 Aug 1992',
  gender: 'Female',
  occupation: 'Teacher',
  plan: 'Starter Shield',
  premium: '₦750 / week',
  cap: '₦20,000',
  policyId: 'BH-2026-00482',
  memberId: 'BH-MEM-00482',
  memberSince: 'Mar 2026',
  supportPhoneDisplay: '0700 600 9000',
  supportPhoneE164: '+2347006009000',
  supportEmail: 'help@betahealth.ng',
} as const;

/** QR payload — include issuedAt so hospitals can reject stale codes (demo: new timestamp each open). */
export function buildMemberQrPayload(options?: { issuedAt?: number; coverStatus?: string }): string {
  const p = MOCK_MEMBER_PROFILE;
  const issuedAt = options?.issuedAt ?? Date.now();
  return JSON.stringify({
    type: 'betahealth_member',
    memberId: p.memberId,
    policyId: p.policyId,
    name: p.name,
    coverStatus: options?.coverStatus ?? 'awaiting_funding',
    issuedAt,
    expiresAt: issuedAt + 5 * 60 * 1000,
  });
}
