import { insuranceApi } from '../api/insurance.api';
import type { CoverageSummary } from '../types/insurance.types';

class InsuranceRepository {
  async getCoverage(): Promise<CoverageSummary> {
    return insuranceApi.getCoverage();
  }
}

export default new InsuranceRepository();
