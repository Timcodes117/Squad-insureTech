import { TextInput } from 'react-native';

type Props = {
  value?: string;
  placeholder?: string;
  className?: string;
  onChangeText?: (text: string) => void;
};

// TODO: label, error text, icons, react-hook-form Controller integration.

export function Input({ value, placeholder, className, onChangeText }: Props) {
  return (
    <TextInput
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
      className={className ?? 'rounded-md border border-neutral-300 px-3 py-2'}
    />
  );
}
