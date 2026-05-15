import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useRegistrationDraftStore } from '@/features/auth/registration/registrationDraftStore';
import { HospitalRow } from '@/features/hospitals/components/HospitalRow';
import { MOCK_PARTNER_HOSPITALS } from '@/features/hospitals/constants/mockPartnerHospitals';
import { useMemberLocation } from '@/features/hospitals/hooks/useMemberLocation';
import type { HospitalListFilter } from '@/features/hospitals/types/partnerHospital.types';
import { filterAndSortHospitals } from '@/features/hospitals/utils/hospitalFilters';
import { DashboardScreenShell } from '@/shared/ui/dashboard';
import { Text } from '@/shared/typography/Text';

const FILTER_TABS: { id: HospitalListFilter; label: string }[] = [
  { id: 'my_lga', label: 'My LGA' },
  { id: 'my_state', label: 'My state' },
  { id: 'all', label: 'All network' },
];

export default function PartnerHospitalsScreen() {
  const router = useRouter();
  const member = useMemberLocation();
  const [filter, setFilter] = useState<HospitalListFilter>('my_lga');
  const [search, setSearch] = useState('');

  const hospitals = useMemo(
    () => filterAndSortHospitals(MOCK_PARTNER_HOSPITALS, member, filter, search),
    [member, filter, search],
  );

  const filterHint =
    filter === 'my_lga'
      ? `Showing partners in ${member.lga}, ${member.state}`
      : filter === 'my_state'
        ? `Showing partners in ${member.state}`
        : 'Full BetaHealth partner network';

  return (
    <DashboardScreenShell title="Partner hospitals" subtitle="In-network primary care" onBack={() => router.back()}>
      <View className="px-5">
        <View className="flex-row items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <Search size={18} color="#737373" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or area"
            placeholderTextColor="#a3a3a3"
            className="flex-1 text-base text-neutral-900"
            accessibilityLabel="Search hospitals"
          />
        </View>
        <Text className="mt-2 text-xs text-neutral-500">{filterHint}</Text>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2 px-5">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(tab.id)}
              className={`rounded-full px-4 py-2 active:opacity-90 ${active ? 'bg-brand-600' : 'bg-neutral-100'}`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-neutral-600'}`}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2 px-5">
        {hospitals.length === 0 ? (
          <View className="py-10">
            <Text className="text-center text-sm text-neutral-500">
              No hospitals match this filter. Try &quot;My state&quot; or &quot;All network&quot;.
            </Text>
          </View>
        ) : (
          hospitals.map((hospital, idx) => (
            <HospitalRow
              key={hospital.id}
              hospital={hospital}
              bordered={idx < hospitals.length - 1}
              onPress={() => router.push(`/hospital/${hospital.id}`)}
            />
          ))
        )}
      </View>
    </DashboardScreenShell>
  );
}
