'use strict';

const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Claim = require('../models/Claim');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const PoolWallet = require('../models/PoolWallet');
const squad = require('../services/squad');
const { sendSMS } = require('../services/sms');
const { runPremiumBurn } = require('../jobs/premiumBurn');
const { runCoverageReset } = require('../jobs/coverageReset');
const { runHospitalAnomalyScan } = require('../jobs/hospitalAnomalyScan');

// POST /api/v1/admin/claims/:id/approve
// Force-approve a flagged claim and run the payout.
const approveFlaggedClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) throw AppError.notFound('Claim not found');

  if (!['flagged', 'pending'].includes(claim.status)) {
    throw AppError.badRequest(`Claim is in status "${claim.status}" — only flagged/pending can be approved`);
  }

  const [user, hospital] = await Promise.all([
    User.findById(claim.userId),
    Hospital.findById(claim.hospitalId),
  ]);
  if (!user || !hospital) throw AppError.notFound('User or hospital not found for claim');

  const amountCovered = Math.min(claim.amount, user.coverageRemaining);
  const amountGap = claim.amount - amountCovered;

  if (amountCovered <= 0) {
    claim.status = 'rejected';
    claim.rejectionReason = 'No coverage remaining at approval time';
    await claim.save();
    throw AppError.badRequest('User has no coverage remaining');
  }

  const pool = await PoolWallet.getOrCreate();
  if (pool.balance < amountCovered) {
    throw AppError.badRequest('Insufficient pool float — top up before retrying');
  }

  const transfer = await squad.initiateTransfer({
    amount: amountCovered,
    bankCode: hospital.bankCode,
    accountNumber: hospital.accountNumber,
    accountName: hospital.accountName,
    remark: `BetaHealth admin-approved claim ${claim._id}`,
  });

  if (!transfer.success || transfer.status === 'failed') {
    claim.status = 'approved';
    claim.amountCovered = amountCovered;
    claim.amountGap = amountGap;
    claim.squadTransferReference = transfer.reference || null;
    claim.squadTransferStatus = transfer.status || 'failed';
    await claim.save();
    return res.json({
      success: true,
      message: 'Claim approved; payout failed initiation — requery later',
      data: { claim: claim.toJSON(), transfer },
    });
  }

  const successStates = new Set(['success', 'successful', 'processing', 'pending']);
  if (!successStates.has(transfer.status)) {
    claim.status = 'approved';
    claim.amountCovered = amountCovered;
    claim.amountGap = amountGap;
    claim.squadTransferReference = transfer.reference;
    claim.squadTransferStatus = transfer.status;
    await claim.save();
    return res.json({
      success: true,
      message: `Claim approved; payout in state ${transfer.status} — requery later`,
      data: { claim: claim.toJSON(), transfer },
    });
  }

  await PoolWallet.debitPool({
    amount: amountCovered,
    category: 'claim_settlement',
    reference: transfer.reference,
    description: `Admin-approved claim ${claim._id} payout`,
  });
  user.coverageRemaining = Math.max(0, user.coverageRemaining - amountCovered);
  await user.save();

  claim.status = 'paid';
  claim.amountCovered = amountCovered;
  claim.amountGap = amountGap;
  claim.squadTransferReference = transfer.reference;
  claim.squadTransferStatus = transfer.status;
  claim.paidAt = new Date();
  await claim.save();

  try {
    await sendSMS(
      user.phone,
      `BetaHealth paid ₦${(amountCovered / 100).toLocaleString()} for your bill at ${hospital.name}. Coverage remaining: ₦${(user.coverageRemaining / 100).toLocaleString()}.`
    );
  } catch (err) {
    logger.warn({ err }, 'admin.approveFlaggedClaim: SMS failed');
  }

  res.json({
    success: true,
    message: 'Claim approved and paid',
    data: { claim: claim.toJSON(), transfer },
  });
});

// POST /api/v1/admin/jobs/run-premium-burn
// Optional body: { userId } to scope to a single user (cleaner demo).
const triggerPremiumBurn = asyncHandler(async (req, res) => {
  const summary = await runPremiumBurn({ userId: req.body?.userId });
  res.json({ success: true, data: summary });
});

// POST /api/v1/admin/jobs/run-coverage-reset
const triggerCoverageReset = asyncHandler(async (req, res) => {
  const summary = await runCoverageReset({ userId: req.body?.userId });
  res.json({ success: true, data: summary });
});

// POST /api/v1/admin/jobs/run-hospital-anomaly-scan
const triggerHospitalAnomalyScan = asyncHandler(async (req, res) => {
  const summary = await runHospitalAnomalyScan({ hospitalId: req.body?.hospitalId });
  res.json({ success: true, data: summary });
});

// POST /api/v1/admin/hospitals/:id/clear-flag
const clearHospitalFlag = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) throw AppError.notFound('Hospital not found');
  hospital.flagged = false;
  hospital.flaggedAt = undefined;
  hospital.flagReason = undefined;
  await hospital.save();
  logger.info({ hospitalId: hospital.id }, 'admin: hospital flag cleared');
  res.json({ success: true, data: { hospital: hospital.toJSON() } });
});

module.exports = {
  approveFlaggedClaim,
  triggerPremiumBurn,
  triggerCoverageReset,
  triggerHospitalAnomalyScan,
  clearHospitalFlag,
};
