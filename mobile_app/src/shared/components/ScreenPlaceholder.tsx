import { Screen } from '@/shared/layouts/Screen';
import { Text } from '@/shared/typography/Text';

type Props = {
  title: string;
};

/** Scaffold: centered route label until real UI is built. */
export function ScreenPlaceholder({ title }: Props) {
  return (
    <Screen className="flex-1 items-center justify-center bg-white">
      <Text className="text-center text-lg font-medium text-neutral-900">{title}</Text>
    </Screen>
  );
}
