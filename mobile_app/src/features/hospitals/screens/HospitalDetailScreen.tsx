import { useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, MapPin, Phone, QrCode } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { MOCK_DASHBOARD, mockStatusHeadline } from '@/features/insurance/constants/mockDashboard';
import { getPartnerHospitalById } from '@/features/hospitals/constants/mockPartnerHospitals';
import { useMemberLocation } from '@/features/hospitals/hooks/useMemberLocation';
import { formatDistanceKm, distanceKm } from '@/features/hospitals/utils/hospitalFilters';
import { MemberQrModal } from '@/features/profile/components/MemberQrModal';
import { DashboardScreenShell } from '@/shared/ui/dashboard';
import { Text } from '@/shared/typography/Text';

const BRAND = '#2563eb';

function resolveHospitalId(raw: string | string[] | undefined): string | undefined {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id?.trim() || id === 'index' || id === 'verify') {
    return undefined;
  }
  return id.trim();
}

export default function HospitalDetailScreen() {
  const router = useRouter();
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const hospitalId = resolveHospitalId(idParam);
  const member = useMemberLocation();
  const [qrOpen, setQrOpen] = useState(false);

  const hospital = useMemo(() => (hospitalId ? getPartnerHospitalById(hospitalId) : undefined), [hospitalId]);

  const distanceLabel = useMemo(() => {
    if (!hospital || member.latitude == null || member.longitude == null) {
      return null;
    }
    const km = distanceKm(member.latitude, member.longitude, hospital.latitude, hospital.longitude);
    return formatDistanceKm(km);
  }, [hospital, member]);

  if (!hospital) {
    return (
      <DashboardScreenShell title="Hospital" onBack={() => router.back()}>
        <View className="px-5 py-10">
          <Text className="text-center text-sm text-neutral-500">Hospital not found.</Text>
        </View>
      </DashboardScreenShell>
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`;
  const { coverStatus } = MOCK_DASHBOARD;
  const coverActive = coverStatus === 'active';

  return (
    <DashboardScreenShell title="Hospital details" onBack={() => router.back()}>
      <View className="px-5">
        <View className="flex-row gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <Building2 size={26} color={BRAND} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-bold text-neutral-900">{hospital.name}</Text>
            <Text className="mt-1 text-sm text-neutral-500">
              {hospital.lga} · {hospital.state}
            </Text>
            {distanceLabel ? <Text className="mt-0.5 text-xs font-semibold text-brand-700">{distanceLabel}</Text> : null}
          </View>
        </View>

        <View className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <View className="flex-row gap-2">
            <MapPin size={18} color="#525252" />
            <Text className="flex-1 text-sm leading-relaxed text-neutral-700">{hospital.address}</Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL(mapsUrl)}
            className="flex-1 items-center rounded-full border border-neutral-200 py-3 active:bg-neutral-50"
          >
            <Text className="text-sm font-semibold text-neutral-900">Open in Maps</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL(`tel:${hospital.phone.replace(/\s/g, '')}`)}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-brand-600 py-3 active:opacity-90"
          >
            <Phone size={16} color="#ffffff" />
            <Text className="text-sm font-semibold text-white">Call</Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-sm font-bold text-neutral-900">Covered services (MVP)</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {hospital.services.map((service) => (
            <View key={service} className="rounded-full bg-brand-50 px-3 py-1.5">
              <Text className="text-xs font-semibold text-brand-800">{service}</Text>
            </View>
          ))}
        </View>

        <View className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4">
          <Text className="text-sm font-bold text-neutral-900">Before you visit</Text>
          <Text className="mt-2 text-sm leading-relaxed text-neutral-600">
            {coverActive
              ? 'Cover is active. Show your member QR at the front desk so staff can confirm your plan.'
              : `Cover status: ${mockStatusHeadline(coverStatus)}. Pay your first premium and complete the 3-day wait before visiting.`}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setQrOpen(true)}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-full bg-brand-600 py-3 active:opacity-90"
          >
            <QrCode size={18} color="#ffffff" />
            <Text className="text-sm font-bold text-white">Show my member QR</Text>
          </Pressable>
        </View>
      </View>

      <MemberQrModal visible={qrOpen} onClose={() => setQrOpen(false)} />
    </DashboardScreenShell>
  );
}
