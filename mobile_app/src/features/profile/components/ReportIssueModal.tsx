import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { MOCK_MEMBER_PROFILE } from '@/features/profile/constants/mockMemberProfile';
import { Text } from '@/shared/typography/Text';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ReportIssueModal({ visible, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const reset = () => {
    setMessage('');
    setSent(false);
    onClose();
  };

  const submit = () => {
    if (!message.trim()) {
      return;
    }
    setSent(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
      <Pressable className="flex-1 justify-end bg-black/45" onPress={reset}>
        <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-5" onPress={(e) => e.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-neutral-900">Report an issue</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={reset} hitSlop={10}>
              <X size={22} color="#525252" />
            </Pressable>
          </View>

          {!sent ? (
            <>
              <Text className="text-sm leading-relaxed text-neutral-600">
                Tell us what went wrong. We will email {MOCK_MEMBER_PROFILE.supportEmail} and follow up on{' '}
                {MOCK_MEMBER_PROFILE.supportPhoneDisplay}.
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Describe the issue…"
                placeholderTextColor="#a3a3a3"
                multiline
                textAlignVertical="top"
                className="mt-4 min-h-[120px] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
              />
              <Pressable
                accessibilityRole="button"
                disabled={!message.trim()}
                onPress={submit}
                className={`mt-5 items-center rounded-xl py-4 active:opacity-90 ${!message.trim() ? 'bg-neutral-200' : 'bg-brand-600'}`}
              >
                <Text className={`font-semibold ${!message.trim() ? 'text-neutral-500' : 'text-white'}`}>Send report</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="text-sm leading-relaxed text-neutral-600">
                Thanks—your report was recorded (demo). Our team will reach out if we need more detail.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={reset}
                className="mt-6 items-center rounded-xl bg-brand-600 py-4 active:opacity-90"
              >
                <Text className="font-semibold text-white">Close</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
