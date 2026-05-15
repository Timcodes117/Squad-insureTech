import { useMutation } from '@tanstack/react-query';

import hospitalsRepository from '../repository/hospitals.repository';

export function useHospitalVerification() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof hospitalsRepository.verifyCoverage>[0]) =>
      hospitalsRepository.verifyCoverage(payload),
  });
}
