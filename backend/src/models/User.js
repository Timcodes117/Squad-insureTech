'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { customAlphabet } = require('nanoid');

const NIGERIAN_PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

// Crockford base32 — no I, L, O, U so the code stays unambiguous if a user has
// to read it aloud as a fallback when their QR can't be scanned.
const membershipNanoid = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 9);
const MEMBERSHIP_PREFIX = 'BH-';

function generateMembershipNumber() {
  return `${MEMBERSHIP_PREFIX}${membershipNanoid()}`;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      validate: {
        validator: (v) => NIGERIAN_PHONE_REGEX.test(v),
        message: 'Invalid Nigerian phone number',
      },
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    bvn: {
      type: String,
      length: 11,
      select: false,
    },
    occupation: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    riskTier: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
      index: true,
    },
    weeklyPremium: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'hospital', 'admin'],
      default: 'user',
      index: true,
    },
    // Pay-to-activate: registered users start inactive and are flipped active
    // by the funding webhook once balance >= weeklyPremium.
    isActive: {
      type: Boolean,
      default: false,
    },
    firstPremiumAt: {
      type: Date,
      default: null,
    },
    lastPremiumBurnAt: {
      type: Date,
      default: null,
    },
    squadCustomerIdentifier: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Customer-facing membership number, e.g. BH-AB23JKL5M. Printed on physical
    // cards and encoded into the user's QR code. Generated at registration; if
    // missing on an existing user (legacy row), the /users/me/card endpoint
    // backfills it on first read.
    membershipNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    virtualAccountNumber: {
      type: String,
      sparse: true,
      index: true,
    },
    virtualAccountBankCode: {
      type: String,
    },
    virtualAccountBankName: {
      type: String,
    },
    preAuthCode: {
      type: String,
    },
    preAuthExpiresAt: {
      type: Date,
    },
    // Login OTP (request-otp → verify-otp two-step flow).
    loginOtp: {
      type: String,
      select: false,
    },
    loginOtpExpiresAt: {
      type: Date,
    },
    // Password reset (forgot-password → reset-password two-step flow).
    passwordResetCode: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
    },
    // Face verification token issued by /hospital/users/face-verify, single-use
    // and short-lived. Attached to a claim when submitted with this token.
    faceVerifiedToken: {
      type: String,
    },
    faceVerifiedExpiresAt: {
      type: Date,
    },
    coverageLimit: {
      type: Number,
      default: 2_000_000,
    },
    coverageRemaining: {
      type: Number,
      default: 2_000_000,
    },
    coverageResetAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    delete ret.passwordHash;
    delete ret.bvn;
    return ret;
  },
});

userSchema.pre('save', async function preSave(next) {
  try {
    if (this.isNew && !this.coverageResetAt) {
      const created = this.createdAt || new Date();
      this.coverageResetAt = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    if (this.isNew && !this.membershipNumber) {
      this.membershipNumber = generateMembershipNumber();
    }

    if (!this.isModified('passwordHash')) {
      return next();
    }

    // Skip re-hashing if the value is already a bcrypt digest (seed scripts pass raw passwords).
    if (typeof this.passwordHash === 'string' && /^\$2[aby]\$\d+\$/.test(this.passwordHash)) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return this.toJSON();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.NIGERIAN_PHONE_REGEX = NIGERIAN_PHONE_REGEX;
module.exports.generateMembershipNumber = generateMembershipNumber;
