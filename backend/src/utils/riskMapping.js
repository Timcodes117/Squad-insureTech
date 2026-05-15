'use strict';

const HIGH_KEYWORDS = [
  'bricklayer',
  'welder',
  'driver',
  'okada',
  'conductor',
  'porter',
  'mechanic',
  'construction',
  'electrician',
  'plumber',
  'security',
];

const MEDIUM_KEYWORDS = [
  'trader',
  'market',
  'vendor',
  'tailor',
  'hairdresser',
  'barber',
  'cook',
  'cleaner',
  'farmer',
];

// Weekly premium per tier, in kobo: ₦500 / ₦750 / ₦1000.
const PREMIUM_BY_TIER = Object.freeze({
  low: 50_000,
  medium: 75_000,
  high: 100_000,
});

function mapOccupationToRiskTier(occupationString) {
  if (typeof occupationString !== 'string' || !occupationString.trim()) {
    return 'low';
  }
  const occ = occupationString.toLowerCase();
  if (HIGH_KEYWORDS.some((kw) => occ.includes(kw))) return 'high';
  if (MEDIUM_KEYWORDS.some((kw) => occ.includes(kw))) return 'medium';
  return 'low';
}

function weeklyPremiumForTier(tier) {
  return PREMIUM_BY_TIER[tier] ?? PREMIUM_BY_TIER.low;
}

module.exports = {
  mapOccupationToRiskTier,
  weeklyPremiumForTier,
  PREMIUM_BY_TIER,
  HIGH_KEYWORDS,
  MEDIUM_KEYWORDS,
};
