import { apiClient } from '@/core/api/client';

import type { VoicePreference } from '../types/voice.types';

export const voiceApi = {
  // TODO: sync selected assistant voice with backend profile if required.
  getVoicePreference: async (): Promise<VoicePreference> => {
    void apiClient;
    return { voiceId: null };
  },
};
