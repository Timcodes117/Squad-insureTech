import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';

/**
 * Spoken guidance for low-literacy/low-friction enrollment.
 * Stops previous speech when the line changes or the screen unmounts.
 */
export function useRegistrationStepVoice(voiceLine: string | undefined, enabled: boolean) {
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabledRef.current || !voiceLine?.trim()) {
      return;
    }
    Speech.stop();
    Speech.speak(voiceLine.trim(), {
      language: 'en-NG',
      rate: 0.94,
      pitch: 1.0,
    });
    return () => {
      Speech.stop();
    };
  }, [voiceLine]);

  const replay = () => {
    if (!voiceLine?.trim()) {
      return;
    }
    Speech.stop();
    Speech.speak(voiceLine.trim(), { language: 'en-NG', rate: 0.94, pitch: 1.0 });
  };

  return { replay };
}
