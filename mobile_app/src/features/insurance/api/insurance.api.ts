import { apiClient } from '@/core/api/client';

import type { CoverageSummary } from '../types/insurance.types';

export const insuranceApi = {
  // TODO: GET /coverage (backend decides activation + limits).
  getCoverage: async (): Promise<CoverageSummary> => {
    void apiClient;
    return { isActive: false, remainingBenefit: 0, renewalDate: null };
  },
};
