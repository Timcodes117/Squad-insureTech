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
  keyboardType?: 'default' | 'numeric' | 'number-pad' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  accessibilityLabel?: string;
  secureTextEntry?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  multiline?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
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
  multiline = false,
  returnKeyType,
  onSubmitEditing,
}: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <Text className="text-brand-600">*</Text> : null}
      </Text>
      <View
        className={`flex-row rounded-xl border border-neutral-200 bg-white px-3 ${
          multiline ? 'min-h-[96px] items-start py-3' : 'min-h-[52px] items-center'
        }`}
      >
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
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={{ flex: 1, minWidth: 0 }}
          className={`native:text-[16px] text-base text-neutral-900 ${multiline ? 'py-0' : 'py-3.5'}`}
        />
        {rightAccessory}
      </View>
    </View>
  );
}
