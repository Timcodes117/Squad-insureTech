import { useAuthStore } from '@/store/authStore';

/** React Query `enabled` when session user is loaded. */
export function useAuthenticatedQueryEnabled(): boolean {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  return hydrated && user !== null;
}
