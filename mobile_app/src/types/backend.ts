export type RiskTier = 'low' | 'medium' | 'high';
export type Gender = 'male' | 'female';
export type LedgerType = 'credit' | 'debit';
export type LedgerCategory =
  | 'funding'
  | 'premium_burn'
  | 'claim_settlement'
  | 'withdrawal'
  | 'reversal';

export type BackendUser = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  dob: string;
  occupation: string;
  gender: Gender;
  address?: string;
  riskTier: RiskTier;
  weeklyPremium: number;
  role: 'user' | 'hospital' | 'admin';
  isActive: boolean;
  firstPremiumAt?: string | null;
  lastPremiumBurnAt?: string | null;
  membershipNumber?: string;
  virtualAccountNumber?: string | null;
  virtualAccountBankCode?: string | null;
  virtualAccountBankName?: string | null;
  coverageLimit: number;
  coverageRemaining: number;
  coverageResetAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WalletSnapshot = {
  balance: number;
  virtualAccountNumber: string | null;
  virtualAccountBankCode: string | null;
  virtualAccountBankName: string | null;
  /** Beneficiary name for bank transfers (member legal name) */
  fundingAccountName?: string | null;
  coverageLimit: number;
  coverageRemaining: number;
  coverageResetAt?: string;
  isActive: boolean;
  riskTier: RiskTier;
  weeklyPremium: number;
};

export type LedgerEntry = {
  id?: string;
  type: LedgerType;
  amount: number;
  category: LedgerCategory;
  description: string;
  balanceAfter: number;
  reference?: string;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type MembershipCard = {
  membershipNumber: string;
  fullName: string;
  qrPayload: string;
  qrCodeDataUrl: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
};

export type WithdrawableResponse = {
  walletBalance: number;
  reserved: number;
  withdrawableAmount: number;
  reason: string | null;
};

export type ClaimItem = {
  id: string;
  amount: number;
  treatmentType: string;
  status: string;
  amountCovered?: number;
  amountGap?: number;
  createdAt: string;
};
