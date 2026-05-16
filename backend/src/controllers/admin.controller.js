'use strict';

const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Claim = require('../models/Claim');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Hospital = require('../models/Hospital');
const PoolWallet = require('../models/PoolWallet');
const squad = require('../services/squad');
const { notifyUser } = require('../services/notification');
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

  await notifyUser(
    user._id,
    'claim_approved',
    'Claim paid',
    `BetaHealth paid ₦${(amountCovered / 100).toLocaleString()} for your bill at ${hospital.name}. Coverage remaining: ₦${(user.coverageRemaining / 100).toLocaleString()}.`,
    {
      claimId: claim.id,
      amountCovered,
      amountGap,
      coverageRemaining: user.coverageRemaining,
      hospitalName: hospital.name,
      adminApproved: true,
    }
  );

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

// POST /api/v1/admin/dev/fund-user
// Dev-only shortcut: simulates a Squad funding webhook from the API. Same
// end-state — credits the user's wallet (idempotent on reference), flips them
// active when balance crosses the weekly premium, fires funding_received and
// cover_activated notifications. Frontend can call this in test mode instead
// of having to sign a webhook locally.
const devFundUser = asyncHandler(async (req, res) => {
  const { userId, phone, membership, amountKobo, reference } = req.body;

  if (!userId && !phone && !membership) {
    throw AppError.badRequest('Provide one of userId, phone, or membership');
  }
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    throw AppError.badRequest('amountKobo must be a positive integer (kobo)');
  }

  let user;
  if (userId) user = await User.findById(userId);
  else if (membership) user = await User.findOne({ membershipNumber: membership });
  else user = await User.findOne({ phone });
  if (!user) throw AppError.notFound('User not found');

  const ref = reference || `DEV_FUND_${user.id}_${Date.now()}`;

  if (await Wallet.hasReference(user._id, ref)) {
    return res.json({ success: true, duplicate: true, data: { reference: ref } });
  }

  const { wallet } = await Wallet.credit({
    userId: user._id,
    amount: amountKobo,
    category: 'funding',
    reference: ref,
    description: `Dev funding (₦${amountKobo / 100})`,
  });

  const wasInactive = !user.isActive;
  if (wasInactive && user.weeklyPremium && wallet.balance >= user.weeklyPremium) {
    user.isActive = true;
    await user.save();
  }
  const justActivated = wasInactive && user.isActive;

  const amountNaira = (amountKobo / 100).toLocaleString();
  const balanceNaira = (wallet.balance / 100).toLocaleString();
  await notifyUser(
    user._id,
    'funding_received',
    'Wallet funded',
    `BetaHealth: ₦${amountNaira} received. Wallet balance: ₦${balanceNaira}.${justActivated ? ' Cover active.' : ''}`,
    { amount: amountKobo, balance: wallet.balance, reference: ref, source: 'dev-funding' }
  );
  if (justActivated) {
    await notifyUser(
      user._id,
      'cover_activated',
      'Cover activated',
      `BetaHealth: your cover is active. Weekly premium ₦${(user.weeklyPremium / 100).toLocaleString()} will burn each week.`,
      { weeklyPremium: user.weeklyPremium }
    );
  }

  res.json({
    success: true,
    data: {
      userId: user.id,
      reference: ref,
      amount: amountKobo,
      newBalance: wallet.balance,
      activated: justActivated,
    },
  });
});

// GET /api/v1/admin/stats — overview tiles for the admin dashboard.
const getStats = asyncHandler(async (_req, res) => {
  const [
    pool,
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalHospitals,
    verifiedHospitals,
    flaggedHospitals,
    totalClaims,
    paidClaims,
    flaggedClaims,
    rejectedClaims,
    approvedClaims,
  ] = await Promise.all([
    PoolWallet.getOrCreate(),
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    Hospital.countDocuments({}),
    Hospital.countDocuments({ isVerified: true }),
    Hospital.countDocuments({ flagged: true }),
    Claim.countDocuments({}),
    Claim.countDocuments({ status: 'paid' }),
    Claim.countDocuments({ status: 'flagged' }),
    Claim.countDocuments({ status: 'rejected' }),
    Claim.countDocuments({ status: 'approved' }),
  ]);

  const totalPaidAgg = await Claim.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, sum: { $sum: '$amountCovered' } } },
  ]);
  const totalPaidKobo = totalPaidAgg[0]?.sum || 0;

  res.json({
    success: true,
    data: {
      pool: {
        balance: pool.balance,
        platformBalance: pool.platformBalance,
      },
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
      hospitals: {
        total: totalHospitals,
        verified: verifiedHospitals,
        flagged: flaggedHospitals,
      },
      claims: {
        total: totalClaims,
        paid: paidClaims,
        approved: approvedClaims,
        flagged: flaggedClaims,
        rejected: rejectedClaims,
        totalPaidAmount: totalPaidKobo,
      },
    },
  });
});

// GET /api/v1/admin/pool — pool wallet detail + recent ledger.
const getPool = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 200);
  const pool = await PoolWallet.findOne({ key: 'MAIN_POOL' }).lean();
  if (!pool) return res.json({ success: true, data: null });
  const ledger = (pool.ledger || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
  res.json({
    success: true,
    data: {
      balance: pool.balance,
      platformBalance: pool.platformBalance,
      ledger,
    },
  });
});

// GET /api/v1/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').toString().trim();

  const query = {};
  if (search) {
    const r = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { email: r },
      { phone: r },
      { fullName: r },
      { membershipNumber: r },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/v1/admin/hospitals?flagged=true|false
const listHospitals = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.flagged === 'true') query.flagged = true;
  if (req.query.flagged === 'false') query.flagged = { $ne: true };
  if (req.query.verified === 'true') query.isVerified = true;
  if (req.query.verified === 'false') query.isVerified = { $ne: true };

  const [items, total] = await Promise.all([
    Hospital.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Hospital.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

// POST /api/v1/admin/hospitals/:id/verify — flip isVerified on. Used when Squad's
// account lookup wasn't profiled and we manually confirmed the bank account.
const verifyHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) throw AppError.notFound('Hospital not found');
  hospital.isVerified = true;
  await hospital.save();
  logger.info({ hospitalId: hospital.id }, 'admin: hospital verified');
  res.json({ success: true, data: { hospital: hospital.toJSON() } });
});

// GET /api/v1/admin/claims?status=paid|flagged|rejected|approved|pending
const listClaims = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;

  const [items, total] = await Promise.all([
    Claim.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName phone membershipNumber')
      .populate('hospitalId', 'name flagged')
      .lean(),
    Claim.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

module.exports = {
  approveFlaggedClaim,
  triggerPremiumBurn,
  triggerCoverageReset,
  triggerHospitalAnomalyScan,
  clearHospitalFlag,
  devFundUser,
  getStats,
  getPool,
  listUsers,
  listHospitals,
  verifyHospital,
  listClaims,
};
