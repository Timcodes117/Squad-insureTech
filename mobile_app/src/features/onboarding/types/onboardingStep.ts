import type { AVPlaybackSource } from 'expo-av';
import type { DimensionValue } from 'react-native';

export type OnboardingImageResizeMode = 'contain' | 'cover';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  /** Remote hero image; omit or empty to hide the image area */
  imageUrl?: string;
  /** Height of the hero image (default 224). Width stays full of the content column with max-w-sm. */
  imageHeight?: DimensionValue;
  imageResizeMode?: OnboardingImageResizeMode;
  /**
   * Optional audio (e.g. bundled asset: `require('../../../../assets/audio/welcome.mp3')`).
   * When set, a bottom-centered FAB plays / pauses the clip.
   */
  audioSource?: AVPlaybackSource;
  /** Radio list: English, Yoruba, Igbo, Hausa, Pidgin */
  languagePicker?: boolean;
};
