'use strict';

const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Wallet = require('../models/Wallet');
const Claim = require('../models/Claim');
const squad = require('../services/squad');

// GET /api/v1/users/me/wallet
const getWallet = asyncHandler(async (req, res) => {
  const user = req.user;
  const wallet = await Wallet.findOne({ userId: user._id }).select('balance');
  res.json({
    success: true,
    data: {
      balance: wallet?.balance ?? 0,
      virtualAccountNumber: user.virtualAccountNumber || null,
      virtualAccountBankCode: user.virtualAccountBankCode || null,
      virtualAccountBankName: user.virtualAccountBankName || null,
      coverageLimit: user.coverageLimit,
      coverageRemaining: user.coverageRemaining,
      coverageResetAt: user.coverageResetAt,
      isActive: user.isActive,
      riskTier: user.riskTier,
      weeklyPremium: user.weeklyPremium,
    },
  });
});

// GET /api/v1/users/me/transactions
const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const wallet = await Wallet.findOne({ userId: req.user._id }).select('ledger balance').lean();
  if (!wallet) throw AppError.notFound('Wallet not found');

  const sorted = (wallet.ledger || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = sorted.length;
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  res.json({
    success: true,
    data: {
      balance: wallet.balance,
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

// GET /api/v1/users/me/claims
const listClaims = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Claim.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('hospitalId', 'name address')
      .lean(),
    Claim.countDocuments({ userId: req.user._id }),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

// POST /api/v1/users/me/virtual-account/retry
const retryVirtualAccount = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.virtualAccountNumber) {
    return res.status(200).json({
      success: true,
      message: 'Virtual account already provisioned',
      data: {
        virtualAccountNumber: user.virtualAccountNumber,
        bankCode: user.virtualAccountBankCode,
        bankName: user.virtualAccountBankName,
      },
    });
  }

  // Need the BVN to retry — it's select:false, so refetch.
  const User = require('../models/User');
  const fullUser = await User.findById(user._id).select('+bvn');
  if (!fullUser?.bvn) {
    throw AppError.badRequest(
      'Cannot retry: no BVN on file. Re-register or update BVN before retrying.'
    );
  }

  const result = await squad.createVirtualAccount(fullUser);
  if (!result.success) {
    logger.warn({ userId: user.id, error: result.error }, 'VA retry: squad rejected');
    return res.status(400).json({
      success: false,
      error: result.error || 'Squad rejected virtual account creation',
    });
  }

  user.virtualAccountNumber = result.virtualAccountNumber;
  user.virtualAccountBankCode = result.bankCode;
  user.virtualAccountBankName = result.bankName;
  await user.save();

  res.json({
    success: true,
    message: 'Virtual account created',
    data: {
      virtualAccountNumber: result.virtualAccountNumber,
      bankCode: result.bankCode,
      bankName: result.bankName,
    },
  });
});

module.exports = {
  getWallet,
  listTransactions,
  listClaims,
  retryVirtualAccount,
};
