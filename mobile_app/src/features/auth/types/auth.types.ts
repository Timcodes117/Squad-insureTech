import type { BackendUser } from '@/types/backend';

export type AuthSession = {
  user: BackendUser;
  token: string;
};

export type RegisterPayload = {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  dob: string;
  bvn: string;
  occupation: string;
  gender: 'male' | 'female';
  address?: string;
};

export type RegisterResult = AuthSession & {
  virtualAccountWarning?: string;
};

export type RequestOtpResult = {
  identifier: string;
  expiresAt: string;
};
