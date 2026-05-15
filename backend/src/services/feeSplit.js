'use strict';

// Burn-time split (90% pool / 10% platform). Funding is never split.
// `platform = amount - pool` so rounding can never lose a kobo.
function splitPremium(amountKobo) {
  if (!Number.isInteger(amountKobo) || amountKobo < 0) {
    throw new Error('splitPremium: amount must be a non-negative integer in kobo');
  }
  if (amountKobo === 0) return { pool: 0, platform: 0 };

  const pool = Math.round(amountKobo * 0.9);
  const platform = amountKobo - pool;
  return { pool, platform };
}

module.exports = { splitPremium };
