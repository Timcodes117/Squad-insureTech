import { useQuery } from '@tanstack/react-query';

import walletRepository from '../repository/wallet.repository';

export function useWallet() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletRepository.getWallet(),
    enabled: false,
  });
}

export function useVirtualAccount() {
  return useQuery({
    queryKey: ['wallet', 'virtual-account'],
    queryFn: () => walletRepository.getVirtualAccount(),
    enabled: false,
  });
}
