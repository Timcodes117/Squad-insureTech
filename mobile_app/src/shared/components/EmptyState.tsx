import { Box } from '@/shared/layouts/Box';
import { Text } from '@/shared/typography/Text';

type Props = {
  title?: string;
  description?: string;
};

// TODO: illustration + CTA slot.

export function EmptyState({ title, description }: Props) {
  return (
    <Box className="items-center justify-center px-6 py-10">
      <Text className="text-center text-base font-semibold">{title ?? 'Nothing here yet'}</Text>
      {description ? <Text className="mt-2 text-center text-neutral-600">{description}</Text> : null}
    </Box>
  );
}
