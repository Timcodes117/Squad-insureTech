import { Building2, ChevronRight, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { HospitalListItem } from '@/features/hospitals/types/partnerHospital.types';
import { formatDistanceKm } from '@/features/hospitals/utils/hospitalFilters';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

type Props = {
  hospital: HospitalListItem;
  bordered?: boolean;
  onPress: () => void;
};

export function HospitalRow({ hospital, bordered = false, onPress }: Props) {
  const distance = formatDistanceKm(hospital.distanceKm);
  const locationLine = [hospital.lga, hospital.state].filter(Boolean).join(' · ');

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-70">
      <View className={`flex-row gap-3 py-3.5 ${bordered ? 'border-b border-neutral-100' : ''}`}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
          <Building2 size={20} color={BRAND} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-neutral-900">{hospital.name}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={12} color="#737373" />
            <Text className="flex-1 text-xs text-neutral-500">{locationLine}</Text>
          </View>
          {distance ? <Text className="mt-0.5 text-xs font-medium text-brand-700">{distance}</Text> : null}
        </View>
        <View className="justify-center">
          <ChevronRight size={20} color="#a3a3a3" />
        </View>
      </View>
    </Pressable>
  );
}
