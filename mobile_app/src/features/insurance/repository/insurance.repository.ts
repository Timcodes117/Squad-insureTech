import { insuranceApi } from '../api/insurance.api';
import type { DashboardView } from '../mappers/dashboardMapper';

class InsuranceRepository {
  async getDashboard(): Promise<DashboardView> {
    return insuranceApi.getDashboard();
  }
}

export default new InsuranceRepository();
