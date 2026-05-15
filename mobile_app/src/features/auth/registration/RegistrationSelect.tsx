import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/typography/Text';

type Option = { value: string; label: string };

type Props = {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string | null;
  options: readonly Option[];
  onChange: (value: string) => void;
  accessibilityLabel?: string;
};

export function RegistrationSelect({
  label,
  required,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  accessibilityLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <Text className="text-brand-600">*</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        className="min-h-[52px] flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 active:bg-neutral-50"
      >
        <Text className={`min-w-0 flex-1 text-base ${selected ? 'text-neutral-900' : 'text-neutral-400'}`} numberOfLines={2}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={20} color="#737373" />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" accessibilityLabel="Close" onPress={() => setOpen(false)} />
          <View
            className="max-h-[70%] rounded-t-2xl bg-white px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-neutral-200" />
            <Text className="mb-3 text-base font-semibold text-neutral-900">{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`border-b border-neutral-100 py-3.5 active:bg-neutral-50 ${isSelected ? 'bg-brand-50' : ''}`}
                  >
                    <Text className={`text-base ${isSelected ? 'font-semibold text-brand-800' : 'text-neutral-900'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
