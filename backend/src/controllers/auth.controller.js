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
const { notifyUser } = require('../services/notification');

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 10);
const otpGen = customAlphabet('0123456789', 6);
const OTP_TTL_MS = 10 * 60 * 1000;

function userQueryFromIdentifier(identifier) {
  return identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };
}

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
    passwordHash: password,
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

  // Wallet is created eagerly so the first funding webhook has a row to credit.
  const wallet = await Wallet.create({ userId: user._id, balance: 0, ledger: [] });

  // Squad commonly rejects this on BVN/name/dob mismatch — we keep the user and
  // surface the error so they can retry via /users/me/virtual-account/retry.
  let virtualAccountWarning = null;
  try {
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

  const user = await User.findOne(userQueryFromIdentifier(identifier)).select('+passwordHash');
  if (!user) throw AppError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  // Inactive users can still log in — "inactive" only gates claim submission,
  // not API access; they need wallet visibility to fund and activate.
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

// Step 1 of two-step login: verify password, issue a 6-digit OTP via SMS + in-app.
// Does NOT return a JWT — that requires verifying the OTP next.
const requestLoginOtp = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne(userQueryFromIdentifier(identifier)).select('+passwordHash');
  if (!user) throw AppError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(password);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  const otp = otpGen();
  user.loginOtp = otp;
  user.loginOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  await user.save();

  await notifyUser(
    user._id,
    'login_otp',
    'Login code',
    `BetaHealth: your login code is ${otp}. Expires in 10 minutes. Never share this code with anyone.`,
    { expiresAt: user.loginOtpExpiresAt }
  );

  res.json({
    success: true,
    message: 'OTP sent. Check your phone or in-app notifications.',
    data: { identifier, expiresAt: user.loginOtpExpiresAt },
  });
});

// Step 2 of two-step login: exchange the OTP for a JWT.
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { identifier, code } = req.body;

  const user = await User.findOne(userQueryFromIdentifier(identifier)).select('+loginOtp');
  if (!user) throw AppError.unauthorized('Invalid credentials');

  if (!user.loginOtp || !user.loginOtpExpiresAt) {
    throw AppError.unauthorized('No OTP pending. Request a new one.');
  }
  if (new Date(user.loginOtpExpiresAt).getTime() < Date.now()) {
    throw AppError.unauthorized('OTP expired. Request a new one.');
  }
  if (String(code) !== user.loginOtp) {
    throw AppError.unauthorized('Invalid OTP');
  }

  user.loginOtp = undefined;
  user.loginOtpExpiresAt = undefined;
  await user.save();

  const token = signToken(user);
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeJSON(), token },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user.toSafeJSON() },
  });
});

module.exports = { register, login, requestLoginOtp, verifyLoginOtp, me };
