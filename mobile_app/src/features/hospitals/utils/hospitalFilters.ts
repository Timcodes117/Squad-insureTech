import type {
  HospitalListFilter,
  HospitalListItem,
  MemberLocation,
  PartnerHospital,
} from '@/features/hospitals/types/partnerHospital.types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Great-circle distance in km (Haversine). */
export function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function matchTier(hospital: PartnerHospital, member: MemberLocation): HospitalListItem['matchTier'] {
  if (normalize(hospital.lga) === normalize(member.lga)) {
    return 'lga';
  }
  if (normalize(hospital.state) === normalize(member.state)) {
    return 'state';
  }
  return 'other';
}

function passesFilter(hospital: PartnerHospital, filter: HospitalListFilter, member: MemberLocation): boolean {
  const tier = matchTier(hospital, member);
  if (filter === 'my_lga') {
    return tier === 'lga';
  }
  if (filter === 'my_state') {
    return tier === 'lga' || tier === 'state';
  }
  return true;
}

const tierOrder: Record<HospitalListItem['matchTier'], number> = {
  lga: 0,
  state: 1,
  other: 2,
};

export function filterAndSortHospitals(
  hospitals: readonly PartnerHospital[],
  member: MemberLocation,
  filter: HospitalListFilter,
  searchQuery: string,
): HospitalListItem[] {
  const q = normalize(searchQuery);

  const withMeta = hospitals
    .filter((h) => passesFilter(h, filter, member))
    .filter((h) => {
      if (!q) {
        return true;
      }
      const haystack = [h.name, h.address, h.lga, h.state].join(' ').toLowerCase();
      return haystack.includes(q);
    })
    .map((hospital) => {
      const tier = matchTier(hospital, member);
      const distance =
        member.latitude != null && member.longitude != null
          ? distanceKm(member.latitude, member.longitude, hospital.latitude, hospital.longitude)
          : null;
      return { ...hospital, distanceKm: distance, matchTier: tier };
    });

  return withMeta.sort((a, b) => {
    if (filter === 'all') {
      const tierDiff = tierOrder[a.matchTier] - tierOrder[b.matchTier];
      if (tierDiff !== 0) {
        return tierDiff;
      }
    }
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm;
    }
    return a.name.localeCompare(b.name);
  });
}

export function formatDistanceKm(km: number | null): string {
  if (km == null) {
    return '';
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}
