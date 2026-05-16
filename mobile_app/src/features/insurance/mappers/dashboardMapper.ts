import { koboToNaira } from '@/core/api/kobo';
import type { WalletSnapshot } from '@/types/backend';
import type { BackendUser } from '@/types/backend';
import type { ClaimItem } from '@/types/backend';

export type CoverStatus = 'active' | 'awaiting_funding' | 'cooldown';

/** Member journey: pay → 3-day wait → ₦5k first week (all visits) → ₦20k monthly */
export type CoverJourneyPhase = 'awaiting_funding' | 'cooldown' | 'week_one' | 'monthly';

/** Matches backend `claimAuditor.js` week-one window */
export const WEEK_ONE_MS = 7 * 24 * 60 * 60 * 1000;
/** Kobo — total hospital help allowed in the first 7 days (all visits combined) */
export const WEEK_ONE_CAP_KOBO = 500_000;
export const WEEK_ONE_CAP_NAIRA = WEEK_ONE_CAP_KOBO / 100;

const WEEK_ONE_BLOCKING = new Set(['pending', 'approved', 'paid']);

export type DashboardView = {
  coverStatus: CoverStatus;
  /** Monthly pool remaining (kobo → naira) */
  coverageRemainingNaira: number;
  coverageCapNaira: number;
  /** Amount + cap for UI (week-one window uses ₦5k total; otherwise monthly pool) */
  displayRemainingNaira: number;
  displayCapNaira: number;
  /** 0–100: share of display cap still available (full bar = unused) */
  coverageProgressPct: number;
  cooldownHoursLeft: number;
  weekOnePhaseActive: boolean;
  /** Active cover inside first 7 days — ₦5k applies to all visits combined */
  weekOnePeriodCapApplies: boolean;
  weekOneEndsLabel: string | null;
  weekOneCapNaira: number;
  weekOneSpentNaira: number;
  planLabel: string;
  resetHint: string;
  coverJourneyPhase: CoverJourneyPhase;
  /** Home / Coverage card title above the amount */
  coverCardTitle: string;
  coverCardSubtitle: string;
  /** Plain-language path: wait → ₦5k week → ₦20k monthly */
  coverJourneyExplainer: string;
};

/** 72 hours — same as backend `COOLDOWN_MS` */
export const COOLDOWN_MS = 72 * 60 * 60 * 1000;
export const COOLDOWN_HOURS = 72;
export const COOLDOWN_DAYS = 3;
export const COOLDOWN_WAIT_LABEL = '3-day wait';

export function isWeekOnePhase(user?: BackendUser | null): boolean {
  if (!user?.firstPremiumAt) return false;
  const elapsed = Date.now() - new Date(user.firstPremiumAt).getTime();
  return elapsed >= 0 && elapsed < WEEK_ONE_MS;
}

function weekOneEndsLabel(user?: BackendUser | null): string | null {
  if (!user?.firstPremiumAt) return null;
  const end = new Date(new Date(user.firstPremiumAt).getTime() + WEEK_ONE_MS);
  return end.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** Kobo spent on claims in the first 7 days after first premium */
export function sumWeekOneSpentKobo(firstPremiumAt: string | null | undefined, claims: ClaimItem[]): number {
  if (!firstPremiumAt) return 0;
  const start = new Date(firstPremiumAt).getTime();
  const end = start + WEEK_ONE_MS;
  return claims
    .filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= start && t < end && WEEK_ONE_BLOCKING.has(c.status);
    })
    .reduce((sum, c) => sum + (c.amountCovered ?? c.amount ?? 0), 0);
}

export function coverageRemainingPercent(remaining: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((remaining / cap) * 100));
}

function tierPlanLabel(tier: string, weeklyPremiumKobo: number): string {
  const weekly = koboToNaira(weeklyPremiumKobo);
  const name = tier === 'low' ? 'Basic' : tier === 'medium' ? 'Standard' : 'High-Risk';
  return `${name} · ₦${weekly.toLocaleString('en-NG')}/wk`;
}

export function hasMetFundingRequirement(wallet: WalletSnapshot): boolean {
  return wallet.weeklyPremium > 0 && wallet.balance >= wallet.weeklyPremium;
}

export function deriveCoverStatus(wallet: WalletSnapshot, user?: BackendUser | null): CoverStatus {
  const fundedEnough = hasMetFundingRequirement(wallet);

  if (user?.firstPremiumAt) {
    const elapsed = Date.now() - new Date(user.firstPremiumAt).getTime();
    if (elapsed < COOLDOWN_MS) {
      return 'cooldown';
    }
    if (wallet.isActive) {
      return 'active';
    }
  }

  if (wallet.isActive && fundedEnough) {
    return 'cooldown';
  }

  if (!fundedEnough || !wallet.isActive) {
    return 'awaiting_funding';
  }

  return wallet.isActive ? 'active' : 'awaiting_funding';
}

export function cooldownHoursLeft(wallet: WalletSnapshot, user?: BackendUser | null): number {
  const hourMs = 60 * 60 * 1000;
  if (user?.firstPremiumAt) {
    const elapsed = Date.now() - new Date(user.firstPremiumAt).getTime();
    const remaining = COOLDOWN_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / hourMs) : 0;
  }
  if (wallet.isActive && hasMetFundingRequirement(wallet)) {
    return COOLDOWN_HOURS;
  }
  return 0;
}

export function mapWalletToDashboard(
  wallet: WalletSnapshot,
  user?: BackendUser | null,
  claims: ClaimItem[] = [],
): DashboardView {
  const coverStatus = deriveCoverStatus(wallet, user);
  const coverageCapNaira = koboToNaira(wallet.coverageLimit);
  const coverageRemainingNaira = koboToNaira(wallet.coverageRemaining);
  const resetDate = wallet.coverageResetAt
    ? new Date(wallet.coverageResetAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const weekOnePhaseActive = isWeekOnePhase(user);
  const weekOnePeriodCapApplies = weekOnePhaseActive && coverStatus === 'active';
  const weekOneEndShort = weekOneEndsLabel(user);
  const weekOneSpentNaira = koboToNaira(sumWeekOneSpentKobo(user?.firstPremiumAt, claims));
  const weekOneRemainingNaira = Math.max(0, WEEK_ONE_CAP_NAIRA - weekOneSpentNaira);

  const hoursLeft = cooldownHoursLeft(wallet, user);

  let coverJourneyPhase: CoverJourneyPhase = 'monthly';
  let displayCapNaira = coverageCapNaira;
  let displayRemainingNaira = coverageRemainingNaira;
  let coverCardTitle = 'Cover balance';
  let coverCardSubtitle = `of ₦${coverageCapNaira.toLocaleString('en-NG')} monthly hospital help`;
  let coverJourneyExplainer =
    'Pay premium → 3-day activation wait → ₦5,000 for hospital visits in your first week (total) → ₦20,000 monthly after that.';

  if (coverStatus === 'awaiting_funding') {
    coverJourneyPhase = 'awaiting_funding';
    coverCardTitle = 'Hospital cover';
    coverCardSubtitle = 'Pay your first premium to begin';
    coverJourneyExplainer = `After payment: ${COOLDOWN_DAYS}-day wait (no hospital visits), then ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} for your first week at hospitals, then ₦${coverageCapNaira.toLocaleString('en-NG')} monthly.`;
  } else if (coverStatus === 'cooldown') {
    coverJourneyPhase = 'cooldown';
    coverCardTitle = 'Activating cover';
    displayCapNaira = WEEK_ONE_CAP_NAIRA;
    displayRemainingNaira = WEEK_ONE_CAP_NAIRA;
    coverCardSubtitle = `About ${hoursLeft}h left · 3-day wait before hospitals`;
    coverJourneyExplainer = weekOneEndShort
      ? `You cannot visit hospitals during the ${COOLDOWN_DAYS}-day wait. Then you get ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} in total for all visits until ${weekOneEndShort} (first week). Full ₦${coverageCapNaira.toLocaleString('en-NG')} monthly limit after that.`
      : `You cannot visit hospitals during the ${COOLDOWN_DAYS}-day wait. Then ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} for your first week at hospitals, then ₦${coverageCapNaira.toLocaleString('en-NG')} monthly.`;
  } else if (weekOnePeriodCapApplies) {
    coverJourneyPhase = 'week_one';
    displayCapNaira = WEEK_ONE_CAP_NAIRA;
    displayRemainingNaira = Math.min(coverageRemainingNaira, weekOneRemainingNaira);
    coverCardTitle = 'First-week hospital help';
    coverCardSubtitle = weekOneEndShort
      ? `₦${displayRemainingNaira.toLocaleString('en-NG')} of ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} left · all visits until ${weekOneEndShort}`
      : `₦${displayRemainingNaira.toLocaleString('en-NG')} of ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} left · first week total`;
    coverJourneyExplainer = weekOneEndShort
      ? `Hospital visits are on. This ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} is the total for every visit combined until ${weekOneEndShort}. After that, your full ₦${coverageCapNaira.toLocaleString('en-NG')} monthly pool applies.`
      : `Hospital visits are on. ₦${WEEK_ONE_CAP_NAIRA.toLocaleString('en-NG')} total for all visits in your first week, then ₦${coverageCapNaira.toLocaleString('en-NG')} monthly.`;
  } else if (coverStatus === 'active') {
    coverJourneyPhase = 'monthly';
    coverJourneyExplainer = resetDate
      ? `Full ₦${coverageCapNaira.toLocaleString('en-NG')} monthly hospital help. Pool resets ${resetDate}.`
      : `Full ₦${coverageCapNaira.toLocaleString('en-NG')} monthly hospital help.`;
  }

  const coverageProgressPct = coverageRemainingPercent(displayRemainingNaira, displayCapNaira);

  let resetHint = resetDate
    ? `Your ₦${coverageCapNaira.toLocaleString('en-NG')} monthly pool resets on ${resetDate}.`
    : `Your ₦${coverageCapNaira.toLocaleString('en-NG')} monthly pool resets every 30 days from registration.`;

  if (coverStatus === 'cooldown') {
    resetHint = coverJourneyExplainer;
  } else if (weekOnePeriodCapApplies) {
    resetHint = coverJourneyExplainer;
  }

  return {
    coverStatus,
    coverageRemainingNaira,
    coverageCapNaira,
    displayRemainingNaira,
    displayCapNaira,
    coverageProgressPct,
    cooldownHoursLeft: hoursLeft,
    weekOnePhaseActive,
    weekOnePeriodCapApplies,
    weekOneEndsLabel: weekOneEndShort,
    weekOneCapNaira: WEEK_ONE_CAP_NAIRA,
    weekOneSpentNaira,
    planLabel: tierPlanLabel(wallet.riskTier, wallet.weeklyPremium),
    resetHint,
    coverJourneyPhase,
    coverCardTitle,
    coverCardSubtitle,
    coverJourneyExplainer,
  };
}

export function statusHeadline(
  status: CoverStatus,
  weekOnePeriodCapApplies = false,
): string {
  if (status === 'cooldown') {
    return COOLDOWN_WAIT_LABEL;
  }
  if (status === 'active' && weekOnePeriodCapApplies) {
    return 'First week — hospital visits on';
  }
  switch (status) {
    case 'active':
      return 'Cover active';
    case 'awaiting_funding':
      return 'Awaiting first payment';
    default:
      return '';
  }
}

export function statusDetail(
  status: CoverStatus,
  hoursLeft: number,
  options?: { weekOnePeriodCapApplies?: boolean; weekOneCapNaira?: number; weekOneEndsLabel?: string | null; monthlyCapNaira?: number },
): string {
  const weekOne = options?.weekOneCapNaira ?? WEEK_ONE_CAP_NAIRA;
  const monthly = options?.monthlyCapNaira ?? 20_000;

  switch (status) {
    case 'active':
      if (options?.weekOnePeriodCapApplies) {
        return options.weekOneEndsLabel
          ? `You can visit hospitals now. ₦${weekOne.toLocaleString('en-NG')} total for all visits until ${options.weekOneEndsLabel}, then ₦${monthly.toLocaleString('en-NG')} monthly.`
          : `You can visit hospitals now. ₦${weekOne.toLocaleString('en-NG')} total for all visits in your first week, then ₦${monthly.toLocaleString('en-NG')} monthly.`;
      }
      return 'Hospital visits are on within your monthly limit.';
    case 'awaiting_funding':
      return `Fund your wallet and pay premium. Then a ${COOLDOWN_DAYS}-day wait, ₦${weekOne.toLocaleString('en-NG')} for your first week at hospitals, then ₦${monthly.toLocaleString('en-NG')} monthly.`;
    case 'cooldown':
      return `Account activating — no hospital visits yet. About ${hoursLeft}h left on your ${COOLDOWN_DAYS}-day wait. Then ₦${weekOne.toLocaleString('en-NG')} for your first week (all visits), then ₦${monthly.toLocaleString('en-NG')} monthly.`;
    default:
      return '';
  }
}
