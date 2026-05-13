import { useCallback, useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

type Props = {
  value: string;
  onChange: (six: string) => void;
};

const CELL = 48;

export function OtpSixInput({ value, onChange }: Props) {
  const refs = useRef<(TextInput | null)[]>([]);

  const digits = (value.replace(/\D/g, '').slice(0, 6) + '      ').slice(0, 6).split('');

  const setAt = useCallback(
    (index: number, char: string | '') => {
      const clean = value.replace(/\D/g, '');
      const arr = clean.split('');
      while (arr.length < 6) {
        arr.push('');
      }
      arr[index] = char;
      const next = arr.join('').replace(/\D/g, '').slice(0, 6);
      onChange(next);
    },
    [onChange, value],
  );

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      const clean = value.replace(/\D/g, '');
      if (clean[index]) {
        setAt(index, '');
        return;
      }
      if (index > 0) {
        setAt(index - 1, '');
        refs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View className="flex-row justify-between gap-2" accessibilityLabel="Six digit code">
      {digits.map((d, i) => (
        <Pressable key={i} onPress={() => refs.current[i]?.focus()} className="rounded-xl border border-neutral-200 bg-white">
          <TextInput
            ref={(r) => {
              refs.current[i] = r;
            }}
            value={d.trim() ? d : ''}
            onChangeText={(t) => {
              const digit = t.replace(/\D/g, '').slice(-1);
              if (digit) {
                setAt(i, digit);
                if (i < 5) {
                  refs.current[i + 1]?.focus();
                }
              } else {
                setAt(i, '');
              }
            }}
            onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
            autoFocus={i === 0}
            keyboardType="number-pad"
            maxLength={1}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            importantForAutofill="yes"
            className="native:text-[20px] text-center text-xl font-semibold text-neutral-900"
            style={{ width: CELL, height: CELL, paddingVertical: 0 }}
            accessibilityLabel={`Digit ${i + 1}`}
          />
        </Pressable>
      ))}
    </View>
  );
}
