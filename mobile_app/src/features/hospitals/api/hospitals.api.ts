import { apiClient } from '@/core/api/client';

import type { HospitalVerificationRequest, HospitalVerificationResult } from '../types/hospitals.types';

export const hospitalsApi = {
  // TODO: POST /hospitals/verify-coverage (backend validates active coverage + limits).
  verifyCoverage: async (
    _payload: HospitalVerificationRequest,
  ): Promise<HospitalVerificationResult> => {
    void apiClient;
    return { approved: false };
  },
};
