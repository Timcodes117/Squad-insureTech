import { Dimensions, PixelRatio } from 'react-native';

/**
 * Logical size of the design reference (e.g. Figma / primary handset).
 * Tweak to match your layout baseline; scaling is relative to these numbers.
 */
export const DESIGN_REFERENCE_WIDTH = 390;
export const DESIGN_REFERENCE_HEIGHT = 844;

export type ScreenScalers = {
  /** Current window width (logical px). */
  width: number;
  /** Current window height (logical px). */
  height: number;
  /** Scale horizontal sizes (width-based). */
  scale: (size: number) => number;
  /** Scale vertical sizes (height-based). Use for heights tied to screen height. */
  verticalScale: (size: number) => number;
  /**
   * Dampened horizontal scale — good for font sizes so large phones/tablets
   * do not overshoot as aggressively as `scale`.
   */
  moderateScale: (size: number, dampeningFactor?: number) => number;
};

function roundToDevicePixels(value: number): number {
  return PixelRatio.roundToNearestPixel(value);
}

/**
 * Build scaler functions for a given window size (e.g. from `useWindowDimensions()`).
 */
export function createScreenScalers(screenWidth: number, screenHeight: number): ScreenScalers {
  const widthRatio = screenWidth / DESIGN_REFERENCE_WIDTH;
  const heightRatio = screenHeight / DESIGN_REFERENCE_HEIGHT;

  return {
    width: screenWidth,
    height: screenHeight,
    scale: (size: number) => roundToDevicePixels(size * widthRatio),
    verticalScale: (size: number) => roundToDevicePixels(size * heightRatio),
    moderateScale: (size: number, dampeningFactor = 0.5) => {
      const scaled = size * widthRatio;
      return roundToDevicePixels(size + (scaled - size) * dampeningFactor);
    },
  };
}

/**
 * One-off read from `Dimensions` (updates on rotation after the next layout).
 * Prefer `useScreenScale()` in React components so values track live window size.
 */
export function getScreenScale(): ScreenScalers {
  const { width, height } = Dimensions.get('window');
  return createScreenScalers(width, height);
}
