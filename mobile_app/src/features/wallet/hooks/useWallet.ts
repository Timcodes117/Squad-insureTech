import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';
import { nairaToKobo } from '@/core/api/kobo';

import walletRepository from '../repository/wallet.repository';
import type { WithdrawBody } from '../api/wallet.api';

export function useWallet() {
  const enabled = useAuthenticatedQueryEnabled();
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletRepository.getWallet(),
    enabled,
  });
}

export function useWalletSnapshot() {
  const enabled = useAuthenticatedQueryEnabled();
  return useQuery({
    queryKey: ['wallet', 'snapshot'],
    queryFn: () => walletRepository.getWalletSnapshot(),
    enabled,
  });
}

export function useWithdrawable() {
  const enabled = useAuthenticatedQueryEnabled();
  return useQuery({
    queryKey: ['wallet', 'withdrawable'],
    queryFn: () => walletRepository.getWithdrawable(),
    enabled,
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { amountNaira: number; bankCode: string; accountNumber: string }) => {
      const body: WithdrawBody = {
        amount: nairaToKobo(params.amountNaira),
        bankCode: params.bankCode,
        accountNumber: params.accountNumber.replace(/\D/g, '').slice(0, 10),
      };
      return walletRepository.withdraw(body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['transactions', 'ledger'] });
    },
  });
}
