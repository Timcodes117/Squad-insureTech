import { create } from 'zustand';

type VoiceState = {
  voiceId: string | null;
  setVoiceId: (voiceId: string | null) => void;
};

// TODO: wire to voice service + accessibility settings.
export const useVoiceStore = create<VoiceState>((set) => ({
  voiceId: null,
  setVoiceId: (voiceId) => set({ voiceId }),
}));
