import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

type Props = {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  accessibilityLabel?: string;
  secureTextEntry?: boolean;
  autoComplete?: 'password' | 'off' | 'sms-otp';
  textContentType?: TextInputProps['textContentType'];
};

export function LabeledTextInput({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  leftAccessory,
  rightAccessory,
  accessibilityLabel,
  secureTextEntry,
  autoComplete,
  textContentType,
}: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <Text className="text-violet-600">*</Text> : null}
      </Text>
      <View className="min-h-[52px] flex-row items-center rounded-xl border border-neutral-200 bg-white px-3">
        {leftAccessory}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a3a3a3"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          textContentType={textContentType}
          className="native:text-[16px] flex-1 py-3.5 text-base text-neutral-900"
        />
        {rightAccessory}
      </View>
    </View>
  );
}
