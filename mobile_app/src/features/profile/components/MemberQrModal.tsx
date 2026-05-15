import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { MOCK_DASHBOARD } from '@/features/insurance/constants/mockDashboard';
import { MOCK_MEMBER_PROFILE, buildMemberQrPayload } from '@/features/profile/constants/mockMemberProfile';
import { Text } from '@/shared/typography/Text';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const INSTRUCTIONS = [
  'Show this code at the hospital front desk when you arrive.',
  'Staff scan it to confirm your cover and member ID—not for you to scan.',
  'Turn brightness up. The code refreshes each time you open it (valid ~5 minutes in demo).',
] as const;

export function MemberQrModal({ visible, onClose }: Props) {
  const [payload, setPayload] = useState(() => buildMemberQrPayload());

  useEffect(() => {
    if (!visible) {
      return;
    }
    setPayload(
      buildMemberQrPayload({
        issuedAt: Date.now(),
        coverStatus: MOCK_DASHBOARD.coverStatus,
      }),
    );
  }, [visible]);

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
            {MOCK_MEMBER_PROFILE.name} · {MOCK_MEMBER_PROFILE.memberId}
          </Text>
          <Text className="mt-1 text-xs text-neutral-400">Dynamic code · updates when you open this screen</Text>

          <View className="mt-5 items-center self-center rounded-2xl border border-neutral-200 bg-white p-5">
            <QRCode value={payload} size={200} color="#171717" backgroundColor="#ffffff" />
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
