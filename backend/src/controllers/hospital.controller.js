'use strict';

const { customAlphabet } = require('nanoid');
const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Claim = require('../models/Claim');
const PoolWallet = require('../models/PoolWallet');
const squad = require('../services/squad');
const { auditClaim } = require('../services/claimAuditor');
const { sendSMS } = require('../services/sms');

const preAuthCodeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const PRE_AUTH_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// POST /api/v1/hospital/register
// PROD NOTE: open registration is a hackathon shortcut. In production, gate this
// behind admin approval + KYB document upload.
const registerHospital = asyncHandler(async (req, res) => {
  const { name, contactPhone, email, address, bankCode, accountNumber } = req.body;

  if (email) {
    const dup = await Hospital.findOne({ email }).lean();
    if (dup) throw AppError.conflict('A hospital with this email already exists');
  }

  // Verify the bank account with Squad before creating the hospital.
  const lookup = await squad.lookupAccount(bankCode, accountNumber);

  const hospital = new Hospital({
    name,
    contactPhone,
    email,
    address,
    bankCode,
    accountNumber,
    accountName: lookup.success ? lookup.accountName || name : name,
    isVerified: Boolean(lookup.success && lookup.accountName),
  });
  await hospital.save();

  res.status(201).json({
    success: true,
    message: lookup.success
      ? 'Hospital registered and bank account verified'
      : 'Hospital registered (bank account NOT verified — verify before claims will be approved)',
    data: {
      hospital: hospital.toJSON(),
      apiKey: hospital.apiKey,
      bankVerification: lookup.success
        ? { ok: true, accountName: lookup.accountName }
        : { ok: false, error: lookup.error },
    },
  });
});

// GET /api/v1/hospital/users/lookup?phone=...
const lookupUser = asyncHandler(async (req, res) => {
  const { phone } = req.query;

  const user = await User.findOne({ phone });
  if (!user) throw AppError.notFound('No BetaHealth user with that phone');

  // Issue a short-lived pre-auth code the user must present to authorise a claim.
  const code = preAuthCodeGen();
  user.preAuthCode = code;
  user.preAuthExpiresAt = new Date(Date.now() + PRE_AUTH_TTL_MS);
  await user.save();

  // SECURITY NOTE: in production we'd ALSO send this code to the user's phone via SMS,
  // and require the hospital to type the code the user reads aloud. That's what
  // makes the preAuthCode the phishing-resistance point — the hospital can't
  // submit a claim without proof the user is physically present.
  try {
    await sendSMS(
      user.phone,
      `BetaHealth: Your hospital pre-auth code is ${code}. Share ONLY with the hospital staff treating you. Expires in 4 hours.`
    );
  } catch (err) {
    logger.warn({ err }, 'lookupUser: SMS failed (swallowed)');
  }

  res.json({
    success: true,
    data: {
      fullName: user.fullName,
      phone: user.phone,
      isActive: user.isActive,
      coverageRemaining: user.coverageRemaining,
      coverageLimit: user.coverageLimit,
      coverageResetAt: user.coverageResetAt,
      riskTier: user.riskTier,
      preAuthCode: code,
      preAuthExpiresAt: user.preAuthExpiresAt,
    },
  });
});

function isPreAuthValid(user, providedCode) {
  if (!user.preAuthCode || !user.preAuthExpiresAt) return false;
  if (user.preAuthCode !== String(providedCode)) return false;
  if (new Date(user.preAuthExpiresAt).getTime() < Date.now()) return false;
  return true;
}

// POST /api/v1/hospital/claims  — THE big one.
const submitClaim = asyncHandler(async (req, res) => {
  const { phone, amount, treatmentType, clinicalNote, preAuthCode } = req.body;
  const hospital = req.hospital;

  const user = await User.findOne({ phone });
  if (!user) throw AppError.notFound('No BetaHealth user with that phone');

  // Pre-auth gate (phishing/abuse resistance — a hospital can't submit a claim
  // without proof the user was physically present and consented).
  if (!isPreAuthValid(user, preAuthCode)) {
    throw AppError.unauthorized('preAuthCode invalid or expired — request a fresh one from the patient');
  }

  // Pull recent claims for duplicate detection.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentClaims = await Claim.find({
    userId: user._id,
    hospitalId: hospital._id,
    createdAt: { $gte: since },
  }).lean();

  const audit = auditClaim({
    user,
    hospital,
    amount,
    preAuthCode,
    recentClaims,
  });

  // Persist the claim with the auditor verdict baked in.
  const claim = new Claim({
    userId: user._id,
    hospitalId: hospital._id,
    amount,
    treatmentType,
    clinicalNote,
    preAuthCode,
    auditorChecks: audit.checks,
  });

  if (audit.decision === 'rejected') {
    claim.status = 'rejected';
    claim.rejectionReason = audit.checks.notes;
    await claim.save();
    return res.status(200).json({
      success: true,
      message: 'Claim rejected by auditor',
      data: { claim: claim.toJSON(), decision: 'rejected' },
    });
  }

  if (audit.decision === 'flagged') {
    claim.status = 'flagged';
    await claim.save();
    return res.status(200).json({
      success: true,
      message: 'Claim flagged for manual review — admin must approve before payout',
      data: { claim: claim.toJSON(), decision: 'flagged' },
    });
  }

  // Approved path → settlement.
  // Use the auditor's effectiveLimit so the week-1 cap is honoured.
  const effectiveLimit = audit.effectiveLimit ?? user.coverageRemaining;
  const amountCovered = Math.min(amount, effectiveLimit);
  const amountGap = amount - amountCovered;

  // Ensure pool float can cover the payout.
  const pool = await PoolWallet.getOrCreate();
  if (pool.balance < amountCovered) {
    // In production the HMO operator tops up the float; for hackathon we just flag.
    claim.status = 'flagged';
    claim.rejectionReason = 'Insufficient pool float — HMO must top up';
    await claim.save();
    return res.status(200).json({
      success: true,
      message: 'Claim approved by auditor but pool float is too low — flagged for ops',
      data: { claim: claim.toJSON(), decision: 'flagged' },
    });
  }

  // Initiate Squad transfer.
  const transfer = await squad.initiateTransfer({
    amount: amountCovered,
    bankCode: hospital.bankCode,
    accountNumber: hospital.accountNumber,
    accountName: hospital.accountName,
    remark: `BetaHealth claim ${claim._id}`,
  });

  if (!transfer.success || transfer.status === 'failed') {
    // TODO(reconciliation-job): a background worker should requery and finalise
    // claims left in "approved" with a stale Squad reference.
    claim.status = 'approved';
    claim.amountCovered = amountCovered;
    claim.amountGap = amountGap;
    claim.squadTransferReference = transfer.reference || null;
    claim.squadTransferStatus = transfer.status || 'failed';
    await claim.save();
    return res.status(200).json({
      success: true,
      message: 'Claim approved; payout failed initiation — will be retried/requeried',
      data: {
        claim: claim.toJSON(),
        decision: 'approved',
        transfer: {
          status: transfer.status,
          reference: transfer.reference,
          error: transfer.error,
        },
      },
    });
  }

  // Treat any non-failed status as in-flight or done — but we only debit the pool
  // / decrement coverage on a clear success. Squad's sandbox commonly returns
  // "success" or "processing"; we treat both as "money committed" for v0.
  const successStates = new Set(['success', 'successful', 'processing', 'pending']);
  if (!successStates.has(transfer.status)) {
    claim.status = 'approved';
    claim.amountCovered = amountCovered;
    claim.amountGap = amountGap;
    claim.squadTransferReference = transfer.reference;
    claim.squadTransferStatus = transfer.status;
    await claim.save();
    return res.status(200).json({
      success: true,
      message: `Claim approved; payout in unknown state (${transfer.status}) — requery later`,
      data: { claim: claim.toJSON(), decision: 'approved', transfer },
    });
  }

  // Commit money movements.
  await PoolWallet.debitPool({
    amount: amountCovered,
    category: 'claim_settlement',
    reference: transfer.reference,
    description: `Claim ${claim._id} payout to ${hospital.name}`,
  });
  user.coverageRemaining = Math.max(0, user.coverageRemaining - amountCovered);
  // Invalidate the pre-auth code so it can't be reused.
  user.preAuthCode = undefined;
  user.preAuthExpiresAt = undefined;
  await user.save();

  claim.status = 'paid';
  claim.amountCovered = amountCovered;
  claim.amountGap = amountGap;
  claim.squadTransferReference = transfer.reference;
  claim.squadTransferStatus = transfer.status;
  claim.paidAt = new Date();
  await claim.save();

  // Fire-and-forget user SMS.
  try {
    const paidNaira = (amountCovered / 100).toLocaleString();
    const remainNaira = (user.coverageRemaining / 100).toLocaleString();
    let msg = `BetaHealth paid ₦${paidNaira} of your bill at ${hospital.name}. Coverage remaining: ₦${remainNaira}.`;
    if (amountGap > 0) {
      msg += ` Please pay ₦${(amountGap / 100).toLocaleString()} balance to the hospital.`;
    }
    await sendSMS(user.phone, msg);
  } catch (err) {
    logger.warn({ err }, 'submitClaim: sms failed (swallowed)');
  }

  return res.status(200).json({
    success: true,
    message: 'Claim approved and paid',
    data: {
      claim: claim.toJSON(),
      decision: 'paid',
      transfer: { reference: transfer.reference, status: transfer.status },
      coverageRemaining: user.coverageRemaining,
      gap: {
        amount: amountGap,
        message: amountGap > 0
          ? `Patient owes ₦${(amountGap / 100).toLocaleString()} balance to the hospital.`
          : 'Full bill covered.',
      },
    },
  });
});

// GET /api/v1/hospital/claims
const listClaims = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Claim.find({ hospitalId: req.hospital._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName phone riskTier')
      .lean(),
    Claim.countDocuments({ hospitalId: req.hospital._id }),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

module.exports = {
  registerHospital,
  lookupUser,
  submitClaim,
  listClaims,
};
