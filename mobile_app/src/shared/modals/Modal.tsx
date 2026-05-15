import { Modal as RNModal } from 'react-native';

import { Box } from '@/shared/layouts/Box';
import { Text } from '@/shared/typography/Text';

type Props = {
  visible: boolean;
  title?: string;
  onRequestClose?: () => void;
};

// TODO: bottom sheet alternative + focus trap for a11y.

export function Modal({ visible, title, onRequestClose }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Box className="flex-1 items-center justify-center bg-black/40 px-6">
        <Box className="w-full rounded-xl bg-white p-4">
          {title ? <Text className="mb-2 font-semibold">{title}</Text> : null}
          <Text className="text-neutral-600">TODO: modal content</Text>
        </Box>
      </Box>
    </RNModal>
  );
}
