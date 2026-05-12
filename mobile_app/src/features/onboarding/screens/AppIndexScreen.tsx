import { Screen } from '@/shared/layouts/Screen';
import { Text } from '@/shared/typography/Text';

export default function AppIndexScreen() {
  return (
    <Screen className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg text-neutral-900">Hello World</Text>
    </Screen>
  );
}
