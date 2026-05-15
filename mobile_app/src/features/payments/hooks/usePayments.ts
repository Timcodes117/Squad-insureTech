import { useMutation } from '@tanstack/react-query';

import paymentsRepository from '../repository/payments.repository';

export function usePayments() {
  const createTopUpIntent = useMutation({
    mutationFn: () => paymentsRepository.createTopUpIntent(),
  });

  return { createTopUpIntent };
}
