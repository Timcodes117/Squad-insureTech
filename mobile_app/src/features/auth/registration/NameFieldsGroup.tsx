import { View } from 'react-native';

import { LabeledTextInput } from './LabeledTextInput';

type Props = {
  firstName: string;
  middleName: string;
  lastName: string;
  onChangeFirst: (v: string) => void;
  onChangeMiddle: (v: string) => void;
  onChangeLast: (v: string) => void;
};

export function NameFieldsGroup({
  firstName,
  middleName,
  lastName,
  onChangeFirst,
  onChangeMiddle,
  onChangeLast,
}: Props) {
  return (
    <View className="gap-4">
      <LabeledTextInput
        label="First name"
        required
        value={firstName}
        onChangeText={onChangeFirst}
        placeholder="Enter your first name"
        autoCapitalize="words"
        accessibilityLabel="First name"
      />
      <LabeledTextInput
        label="Middle name"
        value={middleName}
        onChangeText={onChangeMiddle}
        placeholder="Enter your middle name (optional)"
        autoCapitalize="words"
        accessibilityLabel="Middle name, optional"
      />
      <LabeledTextInput
        label="Last name"
        required
        value={lastName}
        onChangeText={onChangeLast}
        placeholder="Enter your last name"
        autoCapitalize="words"
        accessibilityLabel="Last name"
      />
    </View>
  );
}
