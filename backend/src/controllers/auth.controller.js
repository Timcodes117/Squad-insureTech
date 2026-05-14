'use strict';

const { customAlphabet } = require('nanoid');
const logger = require('../config/logger');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../middleware/auth');
const { mapOccupationToRiskTier, weeklyPremiumForTier } = require('../utils/riskMapping');
const squad = require('../services/squad');

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);

const register = asyncHandler(async (req, res) => {
  const { email, phone, password, fullName, dob, bvn, occupation, gender, address } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] }).lean();
  if (existing) {
    const field = existing.email === email ? 'email' : 'phone';
    throw AppError.conflict(`A user with this ${field} already exists`);
  }

  const riskTier = mapOccupationToRiskTier(occupation);
  const weeklyPremium = weeklyPremiumForTier(riskTier);

  const user = new User({
    email,
    phone,
    passwordHash: password, // hashed by pre-save hook
    fullName,
    dob,
    bvn,
    occupation,
    gender,
    address,
    riskTier,
    weeklyPremium,
    squadCustomerIdentifier: `MBC_${nanoid()}`,
  });

  await user.save();

  // Create wallet eagerly so the very first webhook always finds a row to credit.
  const wallet = await Wallet.create({ userId: user._id, balance: 0, ledger: [] });

  // Provision the Squad virtual account. If Squad rejects (BVN/name/dob mismatch
  // is the common cause), keep the user — they can retry via the dedicated endpoint.
  let virtualAccountWarning = null;
  try {
    // The in-memory user doc has bvn (we just set it); passing the doc directly
    // works because the service reads fields, not the bcrypted hash.
    const vaResult = await squad.createVirtualAccount(user);

    if (vaResult.success && vaResult.virtualAccountNumber) {
      user.virtualAccountNumber = vaResult.virtualAccountNumber;
      user.virtualAccountBankCode = vaResult.bankCode;
      user.virtualAccountBankName = vaResult.bankName;
      await user.save();
    } else {
      virtualAccountWarning =
        vaResult.error ||
        'Squad declined virtual account creation (likely BVN/name/dob mismatch). You can retry from /users/me/virtual-account/retry.';
      logger.warn(
        { userId: user.id, error: vaResult.error },
        'register: VA creation failed — user saved without VA'
      );
    }
  } catch (err) {
    virtualAccountWarning =
      'Could not reach Squad to provision a virtual account. You can retry from /users/me/virtual-account/retry.';
    logger.error({ err, userId: user.id }, 'register: unexpected VA creation error');
  }

  const token = signToken(user);

  const responseData = {
    user: user.toSafeJSON(),
    token,
    wallet: { balance: wallet.balance, userId: wallet.userId },
  };
  if (virtualAccountWarning) responseData.virtualAccountWarning = virtualAccountWarning;

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: responseData,
  });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query).select('+passwordHash');
  if (!user) throw AppError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  // Inactive users can still log in — they need to see their wallet to fund it.
  // The "inactive" state only gates claim submission, not API access.

  const token = signToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toSafeJSON(),
      token,
    },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toSafeJSON() },
  });
});

module.exports = { register, login, me };
