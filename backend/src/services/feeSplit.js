'use strict';

// All inputs/outputs are in KOBO (positive integers).
//
// Split rule for a PREMIUM BURN (not funding — funding is 100% user credit):
//   pool     = round(amount * 0.90)        // insurance pool — pays claims
//   platform = amount - pool               // BetaHealth revenue (remainder, sums exact)
//
// Two buckets only. The old 17% "reserve" bucket is gone.

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
