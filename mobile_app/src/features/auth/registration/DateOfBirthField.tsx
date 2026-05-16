import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';

import { Text } from '@/shared/typography/Text';

import {
  defaultAdultDobIso,
  formatIsoDateForBankHint,
  formatIsoDateForDisplay,
  formatIsoDateFromParts,
  parseIsoDateString,
  type IsoDateString,
} from './dobUtils';

type Props = {
  value: string;
  onChange: (isoDate: IsoDateString) => void;
};

export function DateOfBirthField({ value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => parseIsoDateString(value) ?? parseIsoDateString(defaultAdultDobIso())!);

  const selectedDate = useMemo(
    () => parseIsoDateString(value) ?? parseIsoDateString(defaultAdultDobIso())!,
    [value],
  );

  const maxDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }, []);

  const minDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  }, []);

  useEffect(() => {
    if (showPicker && Platform.OS === 'ios') {
      setIosDraft(selectedDate);
    }
  }, [showPicker, selectedDate]);

  const applyDate = (date: Date) => {
    onChange(formatIsoDateFromParts(date.getFullYear(), date.getMonth(), date.getDate()));
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'dismissed' || !date) {
      return;
    }
    if (Platform.OS === 'ios') {
      setIosDraft(date);
      return;
    }
    applyDate(date);
  };

  const display = value ? formatIsoDateForDisplay(value) : 'Select your date of birth';

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-neutral-800">
        Date of birth <Text className="text-red-500">*</Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose date of birth"
        onPress={() => setShowPicker(true)}
        className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5 active:bg-neutral-50"
      >
        <Text className={`text-base ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>{display}</Text>
        <Calendar size={20} color="#737373" />
      </Pressable>
      <Text className="text-xs leading-relaxed text-neutral-500">
        Must match your BVN and bank records exactly (same day, month, and year). You must be at least 18.
        {value ? ` On bank records this is often shown as ${formatIsoDateForBankHint(value)}.` : ''}
      </Text>

      {Platform.OS === 'ios' && showPicker ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setShowPicker(false)}>
            <Pressable className="rounded-t-2xl bg-white px-4 pb-8 pt-3" onPress={(e) => e.stopPropagation()}>
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
                  <Text className="text-base font-semibold text-neutral-500">Cancel</Text>
                </Pressable>
                <Text className="text-base font-bold text-neutral-900">Date of birth</Text>
                <Pressable
                  onPress={() => {
                    applyDate(iosDraft);
                    setShowPicker(false);
                  }}
                  hitSlop={8}
                >
                  <Text className="text-base font-semibold text-brand-700">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                minimumDate={minDate}
                onChange={onPickerChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          maximumDate={maxDate}
          minimumDate={minDate}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
}
