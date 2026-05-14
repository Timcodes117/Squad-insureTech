'use strict';

// Rule-based claim auditor.
// Pure-ish: takes already-fetched data, returns a decision + effective limits.
// Caller is responsible for persisting the result and moving money.
//
// All amounts are in KOBO.

const COOLDOWN_MS = 72 * 60 * 60 * 1000;        // 72 hours
const WEEK_ONE_MS = 7 * 24 * 60 * 60 * 1000;    // 7 days
const WEEK_ONE_CAP_KOBO = 500_000;              // ₦5,000 cap during week 1

function auditClaim({ user, hospital, amount, preAuthCode, recentClaims = [] }) {
  const checks = {
    coverageOk: false,
    duplicateOk: true,
    whitelistOk: false,
    riskMatchOk: true,
    cooldownOk: false,
    weekOneCapApplied: false,
    effectiveLimit: 0,
    notes: '',
  };
  const notes = [];

  // --- Whitelist ---
  checks.whitelistOk = Boolean(hospital?.isVerified && hospital?.isActive);
  if (!checks.whitelistOk) notes.push('Hospital not whitelisted/verified.');

  // --- Cooldown: must have at least one premium burn AND be past 72h since first burn ---
  const now = Date.now();
  if (!user?.firstPremiumAt) {
    checks.cooldownOk = false;
    notes.push('Cover not yet activated — no premium received.');
  } else {
    const sinceFirst = now - new Date(user.firstPremiumAt).getTime();
    if (sinceFirst < COOLDOWN_MS) {
      checks.cooldownOk = false;
      notes.push('Cover in 72-hour activation period. Full claims unlock soon.');
    } else {
      checks.cooldownOk = true;
    }
  }

  // --- Week-1 cap: first 7 days after firstPremiumAt → cap effective limit at ₦5,000 ---
  let effectiveLimit = user?.coverageRemaining ?? 0;
  if (user?.firstPremiumAt) {
    const sinceFirst = now - new Date(user.firstPremiumAt).getTime();
    if (sinceFirst < WEEK_ONE_MS) {
      effectiveLimit = Math.min(WEEK_ONE_CAP_KOBO, effectiveLimit);
      checks.weekOneCapApplied = true;
      notes.push(`Week-1 cap applied: max ₦${WEEK_ONE_CAP_KOBO / 100} for first 7 days.`);
    }
  }
  checks.effectiveLimit = effectiveLimit;

  // --- Coverage: user active + effectiveLimit > 0 ---
  if (!user?.isActive) {
    checks.coverageOk = false;
    notes.push('User account inactive.');
  } else if (effectiveLimit <= 0) {
    checks.coverageOk = false;
    notes.push('No coverage remaining for this period.');
  } else {
    checks.coverageOk = true;
    if (effectiveLimit < amount) {
      notes.push(
        `Partial coverage: effective limit ₦${effectiveLimit / 100} vs claim ₦${amount / 100} — patient owes the gap.`
      );
    }
  }

  // --- Duplicate: same user+hospital, last 24h, in [pending|approved|paid] ---
  const cutoff = now - 24 * 60 * 60 * 1000;
  const blocking = new Set(['pending', 'approved', 'paid']);
  const recentDup = recentClaims.find((c) => {
    const t = new Date(c.createdAt).getTime();
    return t >= cutoff && blocking.has(c.status);
  });
  if (recentDup) {
    checks.duplicateOk = false;
    notes.push(`Possible duplicate of claim ${recentDup._id || recentDup.id} in last 24h.`);
  }

  // --- Soft risk: single claim > 80% of coverageLimit ---
  if (user?.coverageLimit && amount > user.coverageLimit * 0.8) {
    checks.riskMatchOk = false;
    notes.push('Claim amount exceeds 80% of coverage limit in a single visit.');
  }

  if (preAuthCode) notes.push(`PreAuth code presented: ${preAuthCode}.`);

  // --- Decision precedence ---
  let decision;
  if (!checks.whitelistOk) decision = 'rejected';
  else if (!user?.isActive) decision = 'rejected';
  else if (!checks.cooldownOk) decision = 'rejected';
  else if (!checks.coverageOk) decision = 'rejected';
  else if (!checks.duplicateOk) decision = 'flagged';
  else if (!checks.riskMatchOk) decision = 'flagged';
  else decision = 'approved';

  checks.notes = notes.join(' ');

  return {
    approved: decision === 'approved',
    decision,
    checks,
    effectiveLimit,
  };
}

module.exports = {
  auditClaim,
  COOLDOWN_MS,
  WEEK_ONE_MS,
  WEEK_ONE_CAP_KOBO,
};
