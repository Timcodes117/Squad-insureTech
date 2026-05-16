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
const RESET_TTL_MS = 15 * 60 * 1000;

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

  // Welcome notification so a brand-new user has at least one entry in their
  // notification feed and an email/SMS confirmation of registration.
  const premiumNaira = (user.weeklyPremium / 100).toLocaleString();
  await notifyUser(
    user._id,
    'system',
    'Welcome to BetaHealth',
    `Hi ${user.fullName.split(' ')[0]}, your BetaHealth account is ready. Fund your wallet to activate cover — weekly premium ₦${premiumNaira}. Membership: ${user.membershipNumber}.`,
    {
      membershipNumber: user.membershipNumber,
      weeklyPremium: user.weeklyPremium,
      virtualAccountNumber: user.virtualAccountNumber || null,
    }
  );

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

// Sends a 6-digit reset code via in-app notification + SMS + email.
// Generic response intentionally — never confirms or denies whether the
// account exists, so a caller can't enumerate users.
const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const user = await User.findOne(userQueryFromIdentifier(identifier));

  if (user) {
    const code = otpGen();
    user.passwordResetCode = code;
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    await notifyUser(
      user._id,
      'password_reset',
      'Password reset code',
      `BetaHealth: your password reset code is ${code}. Expires in 15 minutes. If you didn't request this, ignore this message.`,
      { expiresAt: user.passwordResetExpiresAt }
    );
  } else {
    logger.info({ identifier }, 'forgotPassword: no user — generic response anyway');
  }

  res.json({
    success: true,
    message: 'If an account exists for that identifier, a reset code has been sent.',
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, code, newPassword } = req.body;

  const user = await User.findOne(userQueryFromIdentifier(identifier)).select(
    '+passwordHash +passwordResetCode'
  );
  if (!user) throw AppError.badRequest('Invalid reset code');

  if (!user.passwordResetCode || !user.passwordResetExpiresAt) {
    throw AppError.badRequest('No reset pending. Request a new code.');
  }
  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    throw AppError.badRequest('Reset code expired. Request a new code.');
  }
  if (String(code) !== user.passwordResetCode) {
    throw AppError.badRequest('Invalid reset code');
  }

  // The pre-save hook re-hashes when passwordHash is set to a non-bcrypt string.
  user.passwordHash = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpiresAt = undefined;
  // Invalidate any pending login OTP so they can't be used after a reset.
  user.loginOtp = undefined;
  user.loginOtpExpiresAt = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful. Log in with your new password.' });
});

module.exports = {
  register,
  login,
  requestLoginOtp,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  me,
};
