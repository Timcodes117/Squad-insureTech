import { useMutation, useQuery } from '@tanstack/react-query';

import authRepository from '../repository/auth.repository';

// TODO: wire mutations to navigation + secure token persistence.
export function useAuth() {
  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => null,
    enabled: false,
  });

  const login = useMutation({
    mutationFn: () => authRepository.login(),
  });

  const register = useMutation({
    mutationFn: () => authRepository.register(),
  });

  const verifyOtp = useMutation({
    mutationFn: () => authRepository.verifyOtp(),
  });

  return { sessionQuery, login, register, verifyOtp };
}
