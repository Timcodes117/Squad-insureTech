import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { buildMemberQrPayload } from '@/features/profile/constants/mockMemberProfile';
import { Text } from '@/shared/typography/Text';

type Props = {
  visible: boolean;
  onClose: () => void;
  qrPayload?: string;
  qrCodeDataUrl?: string;
  membershipNumber?: string;
  memberName?: string;
};

const INSTRUCTIONS = [
  'Show this code at the hospital front desk when you arrive.',
  'Staff scan it to confirm your cover and member ID—not for you to scan.',
  'Turn brightness up on your screen before staff scan the code.',
] as const;

export function MemberQrModal({
  visible,
  onClose,
  qrPayload,
  qrCodeDataUrl,
  membershipNumber,
  memberName,
}: Props) {
  const [fallbackPayload, setFallbackPayload] = useState(() => buildMemberQrPayload());

  useEffect(() => {
    if (!visible || qrPayload) {
      return;
    }
    setFallbackPayload(buildMemberQrPayload({ issuedAt: Date.now() }));
  }, [visible, qrPayload]);

  const displayPayload = qrPayload ?? fallbackPayload;
  const memberId = membershipNumber ?? '—';
  const name = memberName ?? 'Member';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-5" onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-neutral-900">My member QR</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10}>
              <X size={22} color="#525252" />
            </Pressable>
          </View>

          <Text className="text-sm text-neutral-600">
            {name} · {memberId}
          </Text>
          <Text className="mt-1 text-xs text-neutral-400">Show this at partner hospital reception</Text>

          <View className="mt-5 items-center self-center rounded-2xl border border-neutral-200 bg-white p-5">
            {qrCodeDataUrl ? (
              <Image source={{ uri: qrCodeDataUrl }} style={{ width: 200, height: 200 }} accessibilityIgnoresInvertColors />
            ) : (
              <QRCode value={displayPayload} size={200} color="#171717" backgroundColor="#ffffff" />
            )}
          </View>

          <View className="mt-5 gap-2">
            {INSTRUCTIONS.map((line, i) => (
              <View key={line} className="flex-row gap-2">
                <Text className="text-sm font-semibold text-brand-600">{i + 1}.</Text>
                <Text className="flex-1 text-sm leading-relaxed text-neutral-600">{line}</Text>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="mt-6 items-center rounded-xl bg-brand-600 py-4 active:opacity-90"
          >
            <Text className="font-semibold text-white">Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
