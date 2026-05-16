import { useEffect, type PropsWithChildren } from 'react';

import { setUnauthorizedHandler } from '@/core/api/sessionBridge';
import { hydrateAuthFromStorage, logout } from '@/features/auth/services/authSession';

export function AuthHydrator({ children }: PropsWithChildren) {
  useEffect(() => {
    void hydrateAuthFromStorage();

    setUnauthorizedHandler(() => {
      void logout();
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  return children;
}
