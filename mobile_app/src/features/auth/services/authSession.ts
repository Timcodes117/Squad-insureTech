import { queryClient } from '@/core/providers/queryClient';
import { NOTIFICATIONS_QUERY_KEY } from '@/features/notifications/hooks/useNotifications';
import notificationsRepository from '@/features/notifications/repository/notifications.repository';
import { LEDGER_QUERY_KEY } from '@/features/transactions/hooks/useTransactions';
import transactionsRepository from '@/features/transactions/repository/transactions.repository';
import { useAuthStore } from '@/store/authStore';

import { authApi } from '../api/auth.api';
import { clearSession, readSessionToken, writeSessionToken } from '../sessionStorage';
import type { BackendUser } from '@/types/backend';

import type { AuthSession, RegisterPayload } from '../types/auth.types';

function prefetchMemberData(): void {
  void queryClient.prefetchQuery({
    queryKey: LEDGER_QUERY_KEY,
    queryFn: () => transactionsRepository.listPage(1, 100),
  });
  void queryClient.prefetchQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => notificationsRepository.list(),
  });
  void queryClient.invalidateQueries({ queryKey: ['wallet'] });
  void queryClient.invalidateQueries({ queryKey: ['insurance'] });
}

export async function persistAuthSession(session: AuthSession): Promise<void> {
  await writeSessionToken(session.token);
  useAuthStore.getState().setUser(session.user);
  useAuthStore.getState().setHydrated(true);
  prefetchMemberData();
}

export async function hydrateAuthFromStorage(): Promise<boolean> {
  const token = await readSessionToken();
  if (!token) {
    useAuthStore.getState().setHydrated(true);
    return false;
  }
  try {
    const user = await authApi.getMe();
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setHydrated(true);
    prefetchMemberData();
    return true;
  } catch {
    await clearSession();
    useAuthStore.getState().clearAuth();
    return false;
  }
}

export async function logout(): Promise<void> {
  await clearSession();
  useAuthStore.getState().clearAuth();
  queryClient.removeQueries({ queryKey: ['transactions'] });
  queryClient.removeQueries({ queryKey: ['notifications'] });
  queryClient.removeQueries({ queryKey: ['wallet'] });
  queryClient.removeQueries({ queryKey: ['insurance'] });
}

export function updateAuthUser(user: BackendUser): void {
  useAuthStore.getState().setUser(user);
}

export async function registerAndPersist(payload: RegisterPayload) {
  const result = await authApi.register(payload);
  await persistAuthSession({ user: result.user, token: result.token });
  return result;
}
