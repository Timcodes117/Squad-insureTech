import { authApi } from '@/features/auth/api/auth.api';
import { walletApi } from '@/features/wallet/api/wallet.api';

import { claimsApi } from './claims.api';
import { mapWalletToDashboard, type DashboardView } from '../mappers/dashboardMapper';

export const insuranceApi = {
  getDashboard: async (): Promise<DashboardView> => {
    const [wallet, user, claimsPage] = await Promise.all([
      walletApi.getWallet(),
      authApi.getMe(),
      claimsApi.list(1, 50).catch(() => ({ items: [], pagination: { page: 1, limit: 50, total: 0, pages: 1 } })),
    ]);
    return mapWalletToDashboard(wallet, user, claimsPage.items);
  },
};
