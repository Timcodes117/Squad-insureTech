import { useMutation } from '@tanstack/react-query';

import onboardingRepository from '../repository/onboarding.repository';

export function useOnboarding() {
  const saveProgress = useMutation({
    mutationFn: () => onboardingRepository.saveProgress(),
  });

  return { saveProgress };
}
