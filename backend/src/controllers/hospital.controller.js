'use strict';

const { customAlphabet } = require('nanoid');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Claim = require('../models/Claim');
const PoolWallet = require('../models/PoolWallet');
const squad = require('../services/squad');
const { auditClaim } = require('../services/claimAuditor');
const { notifyUser } = require('../services/notification');

const preAuthCodeGen = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const faceTokenGen = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 24);
const PRE_AUTH_TTL_MS = 4 * 60 * 60 * 1000;
const FACE_TTL_MS = 10 * 60 * 1000;

// Open registration is a hackathon shortcut. Production should gate this behind
// admin approval + KYB document upload.
const registerHospital = asyncHandler(async (req, res) => {
  const { name, contactPhone, email, address, bankCode, accountNumber } = req.body;

  if (email) {
    const dup = await Hospital.findOne({ email }).lean();
    if (dup) throw AppError.conflict('A hospital with this email already exists');
  }

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

const lookupUser = asyncHandler(async (req, res) => {
  const { phone, membership } = req.query;

  // Either phone or membership number (from card QR) resolves the patient.
  const query = membership ? { membershipNumber: membership } : { phone };
  const user = await User.findOne(query);
  if (!user) {
    throw AppError.notFound(
      membership
        ? 'No BetaHealth user with that membership number'
        : 'No BetaHealth user with that phone'
    );
  }

  // The pre-auth code is the phishing-resistance gate: the user reads it aloud
  // and the hospital must include it when submitting the claim. Without this a
  // hospital with the patient's phone number alone could fabricate claims.
  const code = preAuthCodeGen();
  user.preAuthCode = code;
  user.preAuthExpiresAt = new Date(Date.now() + PRE_AUTH_TTL_MS);
  await user.save();

  await notifyUser(
    user._id,
    'preauth_code',
    'Hospital pre-auth code',
    `BetaHealth: Your hospital pre-auth code is ${code}. Share ONLY with the hospital staff treating you. Expires in 4 hours.`,
    { code, expiresAt: user.preAuthExpiresAt }
  );

  res.json({
    success: true,
    data: {
      fullName: user.fullName,
      phone: user.phone,
      membershipNumber: user.membershipNumber || null,
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

// Dummy face verification for the cash-claim flow. Always returns verified=true
// for the demo — the real implementation would call a face-match service here.
// Issues a single-use, short-lived token the hospital can attach to the claim
// so the audit trail records that face verification happened.
const verifyFace = asyncHandler(async (req, res) => {
  const { phone, image } = req.body;

  const user = await User.findOne({ phone });
  if (!user) throw AppError.notFound('No BetaHealth user with that phone');

  const token = `fv_${faceTokenGen()}`;
  user.faceVerifiedToken = token;
  user.faceVerifiedExpiresAt = new Date(Date.now() + FACE_TTL_MS);
  await user.save();

  await notifyUser(
    user._id,
    'face_verified',
    'Face verified at hospital',
    `BetaHealth: a hospital just confirmed your identity by face check. If this wasn't you, contact support.`,
    { expiresAt: user.faceVerifiedExpiresAt }
  );

  res.json({
    success: true,
    data: {
      verified: true,
      confidence: 0.97,
      faceVerificationToken: token,
      expiresAt: user.faceVerifiedExpiresAt,
      // Mocked for the hackathon — the bytes are ignored.
      imageBytesReceived: typeof image === 'string' ? image.length : 0,
    },
  });
});

function isPreAuthValid(user, providedCode) {
  if (!user.preAuthCode || !user.preAuthExpiresAt) return false;
  if (user.preAuthCode !== String(providedCode)) return false;
  if (new Date(user.preAuthExpiresAt).getTime() < Date.now()) return false;
  return true;
}

const submitClaim = asyncHandler(async (req, res) => {
  const { phone, amount, treatmentType, clinicalNote, preAuthCode, faceVerificationToken } = req.body;
  const hospital = req.hospital;

  const user = await User.findOne({ phone });
  if (!user) throw AppError.notFound('No BetaHealth user with that phone');

  if (!isPreAuthValid(user, preAuthCode)) {
    throw AppError.unauthorized('preAuthCode invalid or expired — request a fresh one from the patient');
  }

  // Optional face-verify gate. If a token is sent, it must match and be unexpired.
  // If omitted, the claim is still accepted (back-compat with hospitals that
  // haven't shipped the face-verify UI yet).
  let faceVerified = false;
  if (faceVerificationToken) {
    const matches =
      user.faceVerifiedToken === String(faceVerificationToken) &&
      user.faceVerifiedExpiresAt &&
      new Date(user.faceVerifiedExpiresAt).getTime() >= Date.now();
    if (!matches) {
      throw AppError.unauthorized('Face verification token invalid or expired — re-run /face-verify');
    }
    faceVerified = true;
  }

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

  const claim = new Claim({
    userId: user._id,
    hospitalId: hospital._id,
    amount,
    treatmentType,
    clinicalNote,
    preAuthCode,
    faceVerified,
    auditorChecks: audit.checks,
  });

  if (audit.decision === 'rejected') {
    claim.status = 'rejected';
    claim.rejectionReason = audit.checks.notes;
    await claim.save();
    await notifyUser(
      user._id,
      'claim_rejected',
      'Claim rejected',
      `BetaHealth: your claim at ${hospital.name} was rejected. ${audit.checks.notes}`,
      { claimId: claim.id, reason: audit.checks.notes }
    );
    return res.status(200).json({
      success: true,
      message: 'Claim rejected by auditor',
      data: { claim: claim.toJSON(), decision: 'rejected' },
    });
  }

  if (audit.decision === 'flagged') {
    claim.status = 'flagged';
    await claim.save();
    await notifyUser(
      user._id,
      'claim_flagged',
      'Claim under review',
      `BetaHealth: your claim at ${hospital.name} is under review. We'll update you shortly.`,
      { claimId: claim.id }
    );
    return res.status(200).json({
      success: true,
      message: 'Claim flagged for manual review — admin must approve before payout',
      data: { claim: claim.toJSON(), decision: 'flagged' },
    });
  }

  // Honour the auditor's effectiveLimit so the week-1 cap caps amountCovered.
  const effectiveLimit = audit.effectiveLimit ?? user.coverageRemaining;
  const amountCovered = Math.min(amount, effectiveLimit);
  const amountGap = amount - amountCovered;

  const pool = await PoolWallet.getOrCreate();
  if (pool.balance < amountCovered) {
    claim.status = 'flagged';
    claim.rejectionReason = 'Insufficient pool float — HMO must top up';
    await claim.save();
    await notifyUser(
      user._id,
      'claim_flagged',
      'Claim under review',
      `BetaHealth: your claim at ${hospital.name} is under review. We'll update you shortly.`,
      { claimId: claim.id, reason: 'pool float' }
    );
    return res.status(200).json({
      success: true,
      message: 'Claim approved by auditor but pool float is too low — flagged for ops',
      data: { claim: claim.toJSON(), decision: 'flagged' },
    });
  }

  const transfer = await squad.initiateTransfer({
    amount: amountCovered,
    bankCode: hospital.bankCode,
    accountNumber: hospital.accountNumber,
    accountName: hospital.accountName,
    remark: `BetaHealth claim ${claim._id}`,
  });

  if (!transfer.success || transfer.status === 'failed') {
    // Claim stays at "approved" with a stale reference. A reconciliation worker
    // will requery and either flip to "paid" or roll the audit back.
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

  // We only debit the pool and decrement coverage on a clear success. Squad's
  // sandbox returns "success" or "processing"; both are treated as committed.
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

  await PoolWallet.debitPool({
    amount: amountCovered,
    category: 'claim_settlement',
    reference: transfer.reference,
    description: `Claim ${claim._id} payout to ${hospital.name}`,
  });
  user.coverageRemaining = Math.max(0, user.coverageRemaining - amountCovered);
  // Single-use pre-auth + face token: clear both so they can't authorise another claim.
  user.preAuthCode = undefined;
  user.preAuthExpiresAt = undefined;
  user.faceVerifiedToken = undefined;
  user.faceVerifiedExpiresAt = undefined;
  await user.save();

  claim.status = 'paid';
  claim.amountCovered = amountCovered;
  claim.amountGap = amountGap;
  claim.squadTransferReference = transfer.reference;
  claim.squadTransferStatus = transfer.status;
  claim.paidAt = new Date();
  await claim.save();

  const paidNaira = (amountCovered / 100).toLocaleString();
  const remainNaira = (user.coverageRemaining / 100).toLocaleString();
  let msg = `BetaHealth paid ₦${paidNaira} of your bill at ${hospital.name}. Coverage remaining: ₦${remainNaira}.`;
  if (amountGap > 0) {
    msg += ` Please pay ₦${(amountGap / 100).toLocaleString()} balance to the hospital.`;
  }
  await notifyUser(user._id, 'claim_approved', 'Claim paid', msg, {
    claimId: claim.id,
    amountCovered,
    amountGap,
    coverageRemaining: user.coverageRemaining,
    hospitalName: hospital.name,
  });

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
  verifyFace,
  submitClaim,
  listClaims,
};
