export type PartnerHospital = {
  id: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  phone: string;
  latitude: number;
  longitude: number;
  services: readonly string[];
};

export type HospitalListFilter = 'my_lga' | 'my_state' | 'all';

export type MemberLocation = {
  state: string;
  lga: string;
  latitude?: number;
  longitude?: number;
};

export type HospitalListItem = PartnerHospital & {
  distanceKm: number | null;
  matchTier: 'lga' | 'state' | 'other';
};
