import { koboToNaira } from '@/core/api/kobo';
import type { BackendUser, WalletSnapshot } from '@/types/backend';

import { deriveCoverStatus, hasMetFundingRequirement } from './dashboardMapper';

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

/** Weekly premium billing vs wallet (backend `premiumBurn` job + ledger `premium_burn`). */
export type PremiumBillingState =
  | 'first_activation'
  | 'ready_to_pay'
  | 'paused_insufficient'
  | 'cooldown'
  | 'paid_this_week'
  | 'due_can_pay'
  | 'due_insufficient'
  | 'active';

export type PremiumBillingView = {
  state: PremiumBillingState;
  weeklyPremiumNaira: number;
  balanceNaira: number;
  shortfallNaira: number;
  canPayPremium: boolean;
  needsFunding: boolean;
  isFirstTime: boolean;
  lastBurnLabel: string | null;
};

function lastBurnLabel(user?: BackendUser | null): string | null {
  if (!user?.lastPremiumBurnAt) {
    return null;
  }
  const d = new Date(user.lastPremiumBurnAt);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function burnedWithinSixDays(user?: BackendUser | null): boolean {
  if (!user?.lastPremiumBurnAt) {
    return false;
  }
  const ts = new Date(user.lastPremiumBurnAt).getTime();
  return Number.isFinite(ts) && Date.now() - ts < SIX_DAYS_MS;
}

export function getPremiumBillingState(wallet: WalletSnapshot, user?: BackendUser | null): PremiumBillingState {
  const cover = deriveCoverStatus(wallet, user);
  if (cover === 'cooldown') {
    return 'cooldown';
  }

  const hadCoverBefore = Boolean(user?.firstPremiumAt || user?.lastPremiumBurnAt);
  const funded = hasMetFundingRequirement(wallet);
  const burnedRecently = burnedWithinSixDays(user);

  if (!wallet.isActive) {
    if (!funded) {
      return hadCoverBefore ? 'paused_insufficient' : 'first_activation';
    }
    return 'ready_to_pay';
  }

  if (burnedRecently) {
    return 'paid_this_week';
  }

  if (!funded) {
    return 'due_insufficient';
  }

  return 'due_can_pay';
}

export function mapPremiumBilling(wallet: WalletSnapshot, user?: BackendUser | null): PremiumBillingView {
  const weeklyPremiumNaira = koboToNaira(wallet.weeklyPremium);
  const balanceNaira = koboToNaira(wallet.balance);
  const shortfallNaira = Math.max(0, weeklyPremiumNaira - balanceNaira);
  const state = getPremiumBillingState(wallet, user);

  const canPayPremium =
    (state === 'ready_to_pay' || state === 'due_can_pay') && shortfallNaira === 0;
  const needsFunding =
    state === 'first_activation' ||
    state === 'paused_insufficient' ||
    state === 'due_insufficient';

  return {
    state,
    weeklyPremiumNaira,
    balanceNaira,
    shortfallNaira,
    canPayPremium,
    needsFunding,
    isFirstTime: !user?.firstPremiumAt && !user?.lastPremiumBurnAt,
    lastBurnLabel: lastBurnLabel(user),
  };
}

export function premiumStateTitle(state: PremiumBillingState, isFirstTime: boolean): string {
  switch (state) {
    case 'first_activation':
      return 'Activate your cover';
    case 'ready_to_pay':
      return isFirstTime ? 'Confirm first premium' : 'Pay missed premium';
    case 'paused_insufficient':
      return 'Cover paused — fund wallet';
    case 'cooldown':
      return '3-day wait';
    case 'paid_this_week':
      return 'Premium paid this week';
    case 'due_can_pay':
      return 'Weekly premium due';
    case 'due_insufficient':
      return 'Top up for premium';
    default:
      return 'Weekly premium';
  }
}
