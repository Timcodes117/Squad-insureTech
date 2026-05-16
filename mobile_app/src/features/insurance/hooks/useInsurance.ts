import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';

import insuranceRepository from '../repository/insurance.repository';

export function useInsurance() {
  const enabled = useAuthenticatedQueryEnabled();
  return useQuery({
    queryKey: ['insurance', 'dashboard'],
    queryFn: () => insuranceRepository.getDashboard(),
    enabled,
  });
}
