import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';

import profileRepository from '../repository/profile.repository';

export function useProfile() {
  const enabled = useAuthenticatedQueryEnabled();
  return useQuery({
    queryKey: ['profile', 'bundle'],
    queryFn: () => profileRepository.getProfileBundle(),
    enabled,
  });
}
