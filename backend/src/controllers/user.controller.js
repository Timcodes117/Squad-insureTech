'use strict';

const QRCode = require('qrcode');
const logger = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Wallet = require('../models/Wallet');
const Claim = require('../models/Claim');
const squad = require('../services/squad');
const { notifyUser } = require('../services/notification');
const { generateMembershipNumber } = require('../models/User');

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

// Locks one week's premium against withdrawal if the user hasn't burned yet
// this week — otherwise they could pull money that's about to be owed.
function computeReserved(user) {
  const premium = user.weeklyPremium || 0;
  if (!premium) return 0;
  if (!user.lastPremiumBurnAt) return premium;
  const lastBurnTs = new Date(user.lastPremiumBurnAt).getTime();
  if (Date.now() - lastBurnTs >= SIX_DAYS_MS) return premium;
  return 0;
}

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

const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const wallet = await Wallet.findOne({ userId: req.user._id }).select('ledger balance').lean();
  if (!wallet) throw AppError.notFound('Wallet not found');

  const sorted = (wallet.ledger || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = sorted.length;
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit).map((e) => ({
    type: e.type,
    amount: e.amount,
    category: e.category,
    description: e.description,
    balanceAfter: e.balanceAfter,
    reference: e.reference,
    createdAt: e.createdAt,
  }));

  res.json({
    success: true,
    data: {
      balance: wallet.balance,
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    },
  });
});

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

  const User = require('../models/User');
  // BVN is select:false on the schema; explicit project to pull it back.
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

const getWithdrawable = asyncHandler(async (req, res) => {
  const user = req.user;
  const wallet = await Wallet.findOne({ userId: user._id }).select('balance').lean();
  const walletBalance = wallet?.balance ?? 0;
  const reserved = computeReserved(user);
  const withdrawableAmount = Math.max(0, walletBalance - reserved);

  res.json({
    success: true,
    data: {
      walletBalance,
      reserved,
      withdrawableAmount,
      reason: reserved > 0
        ? `₦${(reserved / 100).toLocaleString()} reserved for this week's premium`
        : null,
    },
  });
});

// If the Squad transfer fails after the wallet debit, we immediately credit
// back with category 'reversal' — money never sits in limbo.
const withdraw = asyncHandler(async (req, res) => {
  const user = req.user;
  const { amount, bankCode, accountNumber } = req.body;

  const wallet = await Wallet.findOne({ userId: user._id }).select('balance');
  if (!wallet) throw AppError.notFound('Wallet not found');

  const reserved = computeReserved(user);
  const withdrawableAmount = Math.max(0, wallet.balance - reserved);

  if (amount > withdrawableAmount) {
    throw AppError.badRequest(
      `Requested ₦${(amount / 100).toLocaleString()} exceeds the maximum withdrawable of ₦${(withdrawableAmount / 100).toLocaleString()}.${reserved > 0 ? ` ₦${(reserved / 100).toLocaleString()} is reserved for this week's premium.` : ''}`,
      { details: { walletBalance: wallet.balance, reserved, withdrawableAmount, requested: amount } }
    );
  }

  const lookup = await squad.lookupAccount(bankCode, accountNumber);
  if (!lookup.success || !lookup.accountName) {
    throw AppError.badRequest(
      lookup.error || 'Could not verify destination bank account. Check bank code + account number.'
    );
  }
  const accountName = lookup.accountName;

  // Debit first — if Wallet.debit throws (insufficient funds, race), Squad is never called.
  const debitRef = `WD_${user.id}_${Date.now()}`;
  await Wallet.debit({
    userId: user._id,
    amount,
    category: 'withdrawal',
    reference: debitRef,
    description: `Withdrawal to ${accountName}`,
  });

  // Initiate transfer.
  const transfer = await squad.initiateTransfer({
    amount,
    bankCode,
    accountNumber,
    accountName,
    remark: 'BetaHealth withdrawal',
  });

  if (!transfer.success || transfer.status === 'failed') {
    try {
      await Wallet.credit({
        userId: user._id,
        amount,
        category: 'reversal',
        reference: `${debitRef}_REVERSED`,
        description: `Withdrawal failed - reversed (${transfer.error || transfer.status || 'unknown error'})`,
      });
    } catch (err) {
      logger.error(
        { err, userId: user.id, debitRef, transfer },
        'withdraw: CRITICAL — reversal failed; manual reconciliation required'
      );
    }
    await notifyUser(
      user._id,
      'withdrawal_failed',
      'Withdrawal failed',
      `BetaHealth: your ₦${(amount / 100).toLocaleString()} withdrawal could not be processed. Your wallet has been refunded.`,
      { amount, error: transfer.error || transfer.status, reference: transfer.reference || null }
    );
    return res.status(502).json({
      success: false,
      error: transfer.error || 'Transfer failed to initiate. Your wallet has been refunded.',
      data: { reference: transfer.reference, status: transfer.status },
    });
  }

  await notifyUser(
    user._id,
    'withdrawal_complete',
    'Withdrawal sent',
    `BetaHealth: ₦${(amount / 100).toLocaleString()} withdrawn to your ${accountName} account.`,
    { amount, accountName, bankCode, accountNumber, reference: transfer.reference }
  );

  res.json({
    success: true,
    message: 'Withdrawal initiated',
    data: {
      amount,
      accountName,
      bankCode,
      accountNumber,
      reference: transfer.reference,
      status: transfer.status,
    },
  });
});

// Returns the user's membership number + a QR code as a PNG data URL.
// Generates the membership number lazily for legacy rows that pre-date the
// pre-save hook.
const getMembershipCard = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.membershipNumber) {
    user.membershipNumber = generateMembershipNumber();
    try {
      await user.save();
    } catch (err) {
      // Unique-collision retry (one shot is enough — 30 bits of entropy).
      if (err.code === 11000) {
        user.membershipNumber = generateMembershipNumber();
        await user.save();
      } else {
        throw err;
      }
    }
  }

  const payload = user.membershipNumber;
  let qrCodeDataUrl = null;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
    });
  } catch (err) {
    logger.warn({ err }, 'card: failed to generate QR — returning payload only');
  }

  res.json({
    success: true,
    data: {
      membershipNumber: user.membershipNumber,
      fullName: user.fullName,
      qrPayload: payload,
      qrCodeDataUrl,
    },
  });
});

module.exports = {
  getWallet,
  listTransactions,
  listClaims,
  retryVirtualAccount,
  getWithdrawable,
  withdraw,
  getMembershipCard,
};
