import { apiClient } from '@/core/api/client';

import type { AuthSession } from '../types/auth.types';

export const authApi = {
  // TODO: replace with real backend routes (Node.js only — never Squad directly).
  login: async (): Promise<AuthSession> => {
    void apiClient;
    return null;
  },
  register: async (): Promise<AuthSession> => {
    void apiClient;
    return null;
  },
  verifyOtp: async (): Promise<AuthSession> => {
    void apiClient;
    return null;
  },
};
