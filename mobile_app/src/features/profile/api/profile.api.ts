import { apiClient } from '@/core/api/client';

import type { UserProfile } from '../types/profile.types';

export const profileApi = {
  // TODO: GET /me
  getProfile: async (): Promise<UserProfile> => {
    void apiClient;
    return { id: '', fullName: '' };
  },
};
