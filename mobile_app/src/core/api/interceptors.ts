import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { readSessionToken } from '@/features/auth/sessionStorage';
import type { ApiErrorEnvelope } from '@/types/api';
import { toApiError } from '@/core/api/unwrapResponse';

import { notifyUnauthorized } from './sessionBridge';

export function applyApiInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await readSessionToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorEnvelope>) => {
      const status = error.response?.status;
      const body = error.response?.data;

      if (status === 401) {
        notifyUnauthorized();
      }

      if (body && body.success === false) {
        return Promise.reject(toApiError(body.error || 'Request failed', status, body.code, body.details));
      }

      const message = error.message || 'Network error';
      return Promise.reject(toApiError(message, status));
    },
  );
}
