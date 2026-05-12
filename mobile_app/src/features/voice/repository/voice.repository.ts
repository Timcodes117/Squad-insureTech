import { voiceApi } from '../api/voice.api';
import type { VoicePreference } from '../types/voice.types';

class VoiceRepository {
  async getVoicePreference(): Promise<VoicePreference> {
    return voiceApi.getVoicePreference();
  }
}

export default new VoiceRepository();
