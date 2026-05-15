import type { MemberLocation } from '@/features/hospitals/types/partnerHospital.types';

/** Demo default — aligns with mock member (Lagos / Ikeja). Replace with GET /me. */
export const MOCK_MEMBER_DEFAULT_LOCATION: MemberLocation = {
  state: 'Lagos',
  lga: 'Ikeja',
  latitude: 6.6018,
  longitude: 3.3515,
};
