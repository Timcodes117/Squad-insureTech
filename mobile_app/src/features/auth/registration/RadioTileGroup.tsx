import { Pressable, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

export type RadioTileOption = {
  id: string;
  label: string;
  hint?: string;
};

type Props = {
  options: readonly RadioTileOption[];
  value: string | null;
  onChange: (id: string) => void;
  accessibilityLabel?: string;
};

export function RadioTileGroup({ options, value, onChange, accessibilityLabel }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((opt, index) => {
        const selected = value === opt.id;
        const isLast = index === options.length - 1;
        return (
          <Pressable
            key={opt.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt.id)}
            className={`flex-row items-start gap-3 border-b border-neutral-100 py-4 active:opacity-90 ${isLast ? 'border-b-0' : ''}`}
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2 ${
                selected ? 'border-violet-600' : 'border-neutral-300'
              }`}
            >
              {selected ? <View className="h-2.5 w-2.5 rounded-full bg-violet-600" /> : null}
            </View>
            <View className="flex-1">
              <Text className={`text-base font-semibold ${selected ? 'text-violet-800' : 'text-neutral-900'}`}>{opt.label}</Text>
              {opt.hint ? <Text className="mt-1 text-sm leading-snug text-neutral-500">{opt.hint}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
