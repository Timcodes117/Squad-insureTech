import { apiClient } from '@/core/api/client';

import { MOCK_PARTNER_HOSPITALS } from '../constants/mockPartnerHospitals';
import type { PartnerHospital } from '../types/partnerHospital.types';
import type { HospitalVerificationRequest, HospitalVerificationResult } from '../types/hospitals.types';

export const hospitalsApi = {
  // TODO: GET /hospitals?state=&lga=&lat=&lng=
  listPartners: async (): Promise<PartnerHospital[]> => {
    void apiClient;
    return [...MOCK_PARTNER_HOSPITALS];
  },

  // TODO: POST /hospitals/verify-coverage (staff app — hospital scans member QR).
  verifyCoverage: async (
    _payload: HospitalVerificationRequest,
  ): Promise<HospitalVerificationResult> => {
    void apiClient;
    return { approved: false };
  },
};
