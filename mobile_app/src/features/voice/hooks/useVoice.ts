import { useQuery } from '@tanstack/react-query';

import voiceRepository from '../repository/voice.repository';

export function useVoice() {
  return useQuery({
    queryKey: ['voice', 'preference'],
    queryFn: () => voiceRepository.getVoicePreference(),
    enabled: false,
  });
}
