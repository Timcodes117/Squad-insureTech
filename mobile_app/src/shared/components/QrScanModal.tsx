import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function QrScanModal({ visible, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const handledRef = useRef(false);

  const reset = useCallback(() => {
    setScanned(false);
    setResult(null);
    handledRef.current = false;
    onClose();
  }, [onClose]);

  const onBarcodeScanned = useCallback((scan: BarcodeScanningResult) => {
    if (handledRef.current || scan.type !== 'qr') {
      return;
    }
    handledRef.current = true;
    setScanned(true);
    setResult(scan.data);
  }, []);

  const needsPermission = !permission?.granted;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={reset}>
      <View className="flex-1 bg-neutral-900">
        <View className="flex-row items-center justify-between px-5 pb-3 pt-14">
          <Text className="text-lg font-bold text-white">Scan QR code</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={reset} hitSlop={10}>
            <X size={24} color="#ffffff" />
          </Pressable>
        </View>

        {needsPermission ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-base leading-relaxed text-white/90">
              Allow camera access to scan hospital or member QR codes.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void requestPermission()}
              className="mt-6 rounded-full bg-brand-600 px-6 py-3 active:opacity-90"
            >
              <Text className="font-semibold text-white">Allow camera</Text>
            </Pressable>
          </View>
        ) : scanned ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-lg font-bold text-white">Code scanned</Text>
            <Text className="mt-3 text-center text-sm leading-relaxed text-white/75">
              {result?.includes('betahealth')
                ? 'Member or hospital code recognised (demo). In production this would open verification.'
                : 'QR captured. Connect this flow to hospital check-in when the API is ready.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={reset}
              className="mt-8 rounded-full bg-white px-6 py-3 active:opacity-90"
            >
              <Text className="font-semibold text-neutral-900">Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mx-5 aspect-square overflow-hidden rounded-3xl border-2 border-white/30">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onBarcodeScanned}
              />
            </View>
            <Text className="mt-6 px-8 text-center text-sm leading-relaxed text-white/80">
              Point at a BetaHealth member card or hospital desk code. Scanning happens automatically.
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
}
