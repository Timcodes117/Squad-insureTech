'use strict';

// Pure auditor — takes pre-fetched data, returns a verdict. The caller persists
// and moves money. Amounts in kobo.

const COOLDOWN_MS = 72 * 60 * 60 * 1000;
const WEEK_ONE_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_ONE_CAP_KOBO = 500_000;

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

  checks.whitelistOk = Boolean(hospital?.isVerified && hospital?.isActive);
  if (!checks.whitelistOk) notes.push('Hospital not whitelisted/verified.');

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

  if (user?.coverageLimit && amount > user.coverageLimit * 0.8) {
    checks.riskMatchOk = false;
    notes.push('Claim amount exceeds 80% of coverage limit in a single visit.');
  }

  if (preAuthCode) notes.push(`PreAuth code presented: ${preAuthCode}.`);

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
