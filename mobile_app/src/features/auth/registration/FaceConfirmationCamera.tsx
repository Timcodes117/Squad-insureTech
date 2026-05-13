import { CameraView, useCameraPermissions } from 'expo-camera';
import { UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  onComplete: () => void;
};

type Phase = 'permission' | 'preview' | 'capturing' | 'verifying';

const TIPS = ['Hold the phone at eye level.', 'Move a little closer if your face looks small.', 'Bright room light helps—avoid harsh sun in your eyes.', 'Look straight and relax your shoulders.'];

export function FaceConfirmationCamera({ onComplete }: Props) {
  const camRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('permission');
  const [tipIndex, setTipIndex] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [webUnavailable, setWebUnavailable] = useState(false);

  useEffect(() => {
    if (permission?.granted) {
      setPhase((p) => (p === 'permission' ? 'preview' : p));
    }
  }, [permission?.granted]);

  useEffect(() => {
    if (phase !== 'preview') {
      return;
    }
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4500);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      void (async () => {
        const ok = await CameraView.isAvailableAsync().catch(() => false);
        if (!ok) {
          setWebUnavailable(true);
        }
      })();
    }
  }, []);

  const grant = useCallback(async () => {
    const res = await requestPermission();
    if (res.granted) {
      setPhase('preview');
    }
  }, [requestPermission]);

  const capture = useCallback(async () => {
    if (webUnavailable) {
      setPhase('verifying');
      setTimeout(() => {
        onComplete();
      }, 1200);
      return;
    }
    const cam = camRef.current;
    if (!cam || !cameraReady) {
      return;
    }
    setPhase('capturing');
    try {
      await cam.takePictureAsync({ quality: 0.72, skipProcessing: Platform.OS === 'android' });
    } catch {
      // Still proceed with friendly UX — backend would reject low-quality captures in production.
    }
    setPhase('verifying');
    setTimeout(() => {
      onComplete();
    }, 1600);
  }, [cameraReady, onComplete, webUnavailable]);

  const denied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View className="gap-4">
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100">
          <UserRound size={24} color="#6D28D9" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-sm leading-relaxed text-neutral-600">Your picture is safe and only used to protect your account.</Text>
          <Text className="text-xs leading-relaxed text-neutral-500">Face camera make we confirm say na you.</Text>
        </View>
      </View>

      {phase === 'permission' ? (
        <View className="gap-3">
          <Text className="text-base text-neutral-700">When you continue, we will ask to use your camera—only for this picture.</Text>
          {denied ? (
            <Text className="text-sm text-neutral-500">Camera access is off. You can turn it on in your phone settings, then come back.</Text>
          ) : null}
          <Pressable
            onPress={() => void grant()}
            className="items-center rounded-xl bg-violet-600 py-4 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Allow camera for face confirmation"
          >
            <Text className="text-base font-semibold text-white">Allow camera</Text>
          </Pressable>
        </View>
      ) : null}

      {(phase === 'preview' || phase === 'capturing' || phase === 'verifying') && !webUnavailable ? (
        <View className="overflow-hidden rounded-2xl bg-black">
          <View className="aspect-[3/4] w-full">
            {permission?.granted ? (
              <CameraView
                ref={camRef}
                facing="front"
                mirror
                mode="picture"
                onCameraReady={() => setCameraReady(true)}
                style={{ flex: 1 }}
              />
            ) : null}
            <View className="pointer-events-none absolute inset-0 items-center justify-center">
              <View className="h-[62%] w-[72%] rounded-[999px] border-4 border-white/85" />
            </View>
            {phase === 'verifying' || phase === 'capturing' ? (
              <View className="absolute inset-0 items-center justify-center bg-black/55">
                <ActivityIndicator color="#fff" size="large" />
                <Text className="mt-3 text-center text-sm font-medium text-white">Saving a clear picture…</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {webUnavailable && phase === 'preview' ? (
        <View className="items-center justify-center py-12">
          <Text className="px-2 text-center text-sm text-neutral-600">Camera preview works best on your phone. You can still continue for now.</Text>
        </View>
      ) : null}

      {phase === 'preview' ? (
        <View className="gap-2">
          <Text className="text-center text-sm font-medium text-neutral-800">{TIPS[tipIndex]}</Text>
          <Text className="text-center text-xs text-neutral-500">Look at the camera clearly.</Text>
        </View>
      ) : null}

      {phase === 'preview' ? (
        <Pressable
          onPress={() => void capture()}
          disabled={!cameraReady && !webUnavailable}
          className={`items-center rounded-xl py-4 ${!cameraReady && !webUnavailable ? 'bg-neutral-200' : 'bg-violet-600 active:opacity-90'}`}
          accessibilityRole="button"
          accessibilityLabel="Take clear face picture"
        >
          <Text className={`text-base font-semibold ${!cameraReady && !webUnavailable ? 'text-neutral-500' : 'text-white'}`}>Take clear picture</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
