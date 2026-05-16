import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedQueryEnabled } from '@/core/auth/useAuthenticatedQuery';
import authRepository from '../repository/auth.repository';
import { hydrateAuthFromStorage, logout, updateAuthUser } from '../services/authSession';
import { authApi } from '../api/auth.api';

export function useAuth() {
  const queryClient = useQueryClient();
  const enabled = useAuthenticatedQueryEnabled();

  const sessionQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authRepository.getMe(),
    enabled,
  });

  const requestOtp = useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      authRepository.requestOtp(identifier, password),
  });

  const verifyOtp = useMutation({
    mutationFn: ({ identifier, code }: { identifier: string; code: string }) =>
      authRepository.verifyOtp(identifier, code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const register = useMutation({
    mutationFn: (payload: Parameters<typeof authRepository.register>[0]) => authRepository.register(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });

  const signOut = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return { sessionQuery, requestOtp, verifyOtp, register, signOut, hydrate: hydrateAuthFromStorage };
}

export function useRetryVirtualAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.retryVirtualAccount(),
    onSuccess: (user) => {
      updateAuthUser(user);
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
