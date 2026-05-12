import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// TODO: attach access token from secure storage.
// TODO: refresh token flow + single-flight queue.
// TODO: normalize backend error shape for UI.

export function applyApiInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // TODO: Authorization header
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // TODO: map 401 to logout / refresh
      return Promise.reject(error);
    },
  );
}
