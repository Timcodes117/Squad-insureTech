import { create } from 'axios';

import { env } from '@/config/env';

import { applyApiInterceptors } from './interceptors';

export const apiClient = create({
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 30_000,
});

applyApiInterceptors(apiClient);
