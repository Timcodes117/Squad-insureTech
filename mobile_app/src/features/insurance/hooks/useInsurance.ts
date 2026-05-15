import { useQuery } from '@tanstack/react-query';

import insuranceRepository from '../repository/insurance.repository';

export function useInsurance() {
  return useQuery({
    queryKey: ['insurance', 'coverage'],
    queryFn: () => insuranceRepository.getCoverage(),
    enabled: false,
  });
}
