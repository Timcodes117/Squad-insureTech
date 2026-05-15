import { Box } from '@/shared/layouts/Box';

type Props = {
  /** TODO: drive width via layout measurement (avoid inline styles). */
  value: number;
  max?: number;
  className?: string;
};

// TODO: animated progress + a11yValue.

export function ProgressBar({ value: _value, max: _max = 100, className }: Props) {
  return (
    <Box className={className ?? 'h-2 w-full overflow-hidden rounded-full bg-neutral-200'}>
      <Box className="h-full w-1/2 rounded-full bg-black" />
    </Box>
  );
}
