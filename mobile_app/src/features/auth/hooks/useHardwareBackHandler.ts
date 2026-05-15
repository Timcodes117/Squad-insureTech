import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Runs `onBackPress` when the Android hardware back button is pressed while this screen is focused.
 * Returns `true` from the listener so the event is consumed (matches a single in-app back action).
 */
export function useHardwareBackHandler(onBackPress: () => void) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onBackPress();
        return true;
      });
      return () => sub.remove();
    }, [onBackPress]),
  );
}
