import { useQuery } from '@tanstack/react-query';

import profileRepository from '../repository/profile.repository';

export function useProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileRepository.getProfile(),
    enabled: false,
  });
}
