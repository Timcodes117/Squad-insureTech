import { useCallback } from 'react';

import authRepository from '@/features/auth/repository/auth.repository';
import { updateAuthUser } from '@/features/auth/services/authSession';

/** Refetch `/auth/me` and sync Zustand (for dashboard greeting, etc.). */
export function useRefreshMemberSession() {
  return useCallback(async () => {
    const user = await authRepository.getMe();
    updateAuthUser(user);
  }, []);
}
