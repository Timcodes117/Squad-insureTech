import { apiClient } from '@/core/api/client';
import { unwrapResponse } from '@/core/api/unwrapResponse';

import type { AuthSession, RegisterPayload, RegisterResult, RequestOtpResult } from '../types/auth.types';
import type { BackendUser } from '@/types/backend';

type AuthTokenResponse = {
  user: BackendUser;
  token: string;
};

export const authApi = {
  requestOtp: async (identifier: string, password: string): Promise<RequestOtpResult> => {
    const res = await apiClient.post('/auth/login/request-otp', { identifier, password });
    return unwrapResponse<RequestOtpResult>(res);
  },

  verifyOtp: async (identifier: string, code: string): Promise<AuthSession> => {
    const res = await apiClient.post('/auth/login/verify-otp', { identifier, code });
    const data = unwrapResponse<AuthTokenResponse>(res);
    return { user: data.user, token: data.token };
  },

  register: async (payload: RegisterPayload): Promise<RegisterResult> => {
    const res = await apiClient.post('/auth/register', payload);
    const data = unwrapResponse<AuthTokenResponse & { virtualAccountWarning?: string }>(res);
    return {
      user: data.user,
      token: data.token,
      virtualAccountWarning: data.virtualAccountWarning,
    };
  },

  getMe: async (): Promise<BackendUser> => {
    const res = await apiClient.get('/auth/me');
    const data = unwrapResponse<{ user: BackendUser }>(res);
    return data.user;
  },

  retryVirtualAccount: async (): Promise<BackendUser> => {
    await apiClient.post('/users/me/virtual-account/retry');
    return authApi.getMe();
  },
};
