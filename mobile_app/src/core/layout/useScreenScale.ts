import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { createScreenScalers, type ScreenScalers } from '@/core/layout/screenScale';

/**
 * Live window dimensions → scaler helpers. Re-computes on resize / rotation.
 *
 * @example
 * const s = useScreenScale();
 * <Text style={{ fontSize: s.moderateScale(16) }}>Hello</Text>
 */
export function useScreenScale(): ScreenScalers {
  const { width, height } = useWindowDimensions();
  return useMemo(() => createScreenScalers(width, height), [width, height]);
}
