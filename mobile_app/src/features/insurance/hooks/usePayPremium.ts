import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateAuthUser } from '@/features/auth/services/authSession';
import authRepository from '@/features/auth/repository/auth.repository';
import { LEDGER_QUERY_KEY } from '@/features/transactions/hooks/useTransactions';
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/hooks/useNotifications';

import { premiumApi } from '../api/premium.api';

export function usePayPremium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => premiumApi.payPremium(),
    onSuccess: async () => {
      const user = await authRepository.getMe();
      updateAuthUser(user);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LEDGER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['insurance'] }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
      ]);
    },
  });
}
