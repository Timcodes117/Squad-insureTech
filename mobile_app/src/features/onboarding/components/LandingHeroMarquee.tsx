import { useEffect } from 'react';
import { Image, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const GAP = 14;
const ITEM_WIDTH_VW = 0.4;
const STRIP_HEIGHT_VH = 0.32;

/** Sources shown in order; the strip is duplicated for a seamless loop. */
const MARQUEE_SOURCES = [
  require('../../../../assets/woman.jpg'),
  require('../../../../assets/doctor-smile.jpg'),
  require('../../../../assets/pepper-woman.jpg'),
  require('../../../../assets/nurse.webp'),
] as const;

/** Horizontal scroll speed (pixels per second). */
const MARQUEE_SPEED_PX = 42;

type Props = {
  /** When true, marquee does not intercept touches (matches passive hero treatment). */
  pointerEvents?: 'none' | 'auto';
};

export function LandingHeroMarquee({ pointerEvents = 'none' }: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const itemWidth = Math.max(120, windowWidth * ITEM_WIDTH_VW);
  const stripHeight = Math.max(140, windowHeight * STRIP_HEIGHT_VH);
  const segmentWidth = MARQUEE_SOURCES.length * (itemWidth + GAP);

  const offsetX = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth <= 0) {
      return;
    }
    cancelAnimation(offsetX);
    offsetX.value = 0;
    const durationMs = (segmentWidth / MARQUEE_SPEED_PX) * 1000;
    offsetX.value = withRepeat(
      withTiming(-segmentWidth, {
        duration: Math.max(8000, durationMs),
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(offsetX);
    };
  }, [segmentWidth, offsetX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  const tiles = [...MARQUEE_SOURCES, ...MARQUEE_SOURCES];

  return (
    <View className="mt-6 w-full overflow-hidden" style={{ height: stripHeight }} pointerEvents={pointerEvents}>
      <Animated.View className="flex-row" style={animatedStyle}>
        {tiles.map((source, index) => (
          <Image
            key={`marquee-${index}`}
            accessibilityIgnoresInvertColors
            source={source}
            style={{
              width: itemWidth,
              height: stripHeight,
              marginRight: GAP,
              borderRadius: 16,
            }}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
}
