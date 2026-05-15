import { useMemo } from 'react';

import { useRegistrationDraftStore } from '@/features/auth/registration/registrationDraftStore';
import { MOCK_MEMBER_DEFAULT_LOCATION } from '@/features/hospitals/constants/memberLocation';
import type { MemberLocation } from '@/features/hospitals/types/partnerHospital.types';

/**
 * Member state/LGA for hospital filters.
 * Uses registration draft when hydrated; falls back to demo profile defaults.
 */
export function useMemberLocation(): MemberLocation {
  const hydrated = useRegistrationDraftStore((s) => s.hydrated);
  const state = useRegistrationDraftStore((s) => s.state);
  const lga = useRegistrationDraftStore((s) => s.lga);

  return useMemo(() => {
    if (!hydrated) {
      return MOCK_MEMBER_DEFAULT_LOCATION;
    }
    return {
      state: state?.trim() || MOCK_MEMBER_DEFAULT_LOCATION.state,
      lga: lga.trim() || MOCK_MEMBER_DEFAULT_LOCATION.lga,
      latitude: MOCK_MEMBER_DEFAULT_LOCATION.latitude,
      longitude: MOCK_MEMBER_DEFAULT_LOCATION.longitude,
    };
  }, [hydrated, state, lga]);
}
