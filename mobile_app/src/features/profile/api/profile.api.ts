import { apiClient } from '@/core/api/client';
import { unwrapResponse } from '@/core/api/unwrapResponse';
import { authApi } from '@/features/auth/api/auth.api';
import { koboToNaira } from '@/core/api/kobo';

import type { MembershipCard, BackendUser } from '@/types/backend';

export type ProfileView = {
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  memberSince: string;
  plan: string;
  premium: string;
  policyId: string;
  cap: string;
  supportPhoneE164: string;
  supportPhoneDisplay: string;
};

export type ProfileBundle = {
  user: BackendUser;
  card: MembershipCard | null;
  profile: ProfileView;
};

function tierLabel(tier: string): string {
  if (tier === 'medium') return 'Standard';
  if (tier === 'high') return 'High-Risk';
  return 'Basic';
}

function mapUserToProfile(user: BackendUser): ProfileView {
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })
    : '—';
  const dob = user.dob ? new Date(user.dob).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const cap = koboToNaira(user.coverageLimit);

  return {
    name: user.fullName,
    phone: user.phone,
    email: user.email,
    dateOfBirth: dob,
    gender: user.gender === 'male' ? 'Male' : 'Female',
    occupation: user.occupation,
    memberSince,
    plan: `${tierLabel(user.riskTier)} plan`,
    premium: `₦${koboToNaira(user.weeklyPremium).toLocaleString('en-NG')} / week`,
    policyId: user.membershipNumber ?? '—',
    cap: `₦${cap.toLocaleString('en-NG')} / month`,
    supportPhoneE164: '+2348000000000',
    supportPhoneDisplay: '0800 000 0000',
  };
}

export const profileApi = {
  getProfileBundle: async (): Promise<ProfileBundle> => {
    const user = await authApi.getMe();
    let card: MembershipCard | null = null;
    try {
      const res = await apiClient.get('/users/me/card');
      card = unwrapResponse<MembershipCard>(res) as MembershipCard;
    } catch {
      card = null;
    }
    return {
      user,
      card,
      profile: mapUserToProfile(user),
    };
  },
};
