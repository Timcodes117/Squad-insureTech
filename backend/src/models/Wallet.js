'use strict';

const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// All monetary values are in KOBO (₦1 = 100 kobo).

const LEDGER_CATEGORIES = ['funding', 'premium_burn', 'claim_settlement', 'withdrawal', 'reversal'];

const ledgerEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: LEDGER_CATEGORIES, required: true },
    reference: { type: String, index: true },
    description: { type: String },
    balanceAfter: { type: Number, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    ledger: { type: [ledgerEntrySchema], default: [] },
  },
  { timestamps: true }
);

walletSchema.statics.credit = async function credit({
  userId,
  amount,
  category,
  reference,
  description,
}) {
  if (!userId) throw AppError.badRequest('userId is required');
  if (!Number.isInteger(amount) || amount <= 0) {
    throw AppError.badRequest('amount must be a positive integer (kobo)');
  }
  if (!LEDGER_CATEGORIES.includes(category)) {
    throw AppError.badRequest(`invalid ledger category: ${category}`);
  }

  // Atomic $inc first so balanceAfter on the ledger entry is the real post-update value.
  const updated = await this.findOneAndUpdate(
    { userId },
    { $inc: { balance: amount } },
    { new: true }
  );
  if (!updated) throw AppError.notFound('Wallet not found');

  const entry = {
    type: 'credit',
    amount,
    category,
    reference,
    description,
    balanceAfter: updated.balance,
    createdAt: new Date(),
  };
  await this.updateOne({ _id: updated._id }, { $push: { ledger: entry } });

  return { wallet: updated, entry };
};

walletSchema.statics.debit = async function debit({
  userId,
  amount,
  category,
  reference,
  description,
}) {
  if (!userId) throw AppError.badRequest('userId is required');
  if (!Number.isInteger(amount) || amount <= 0) {
    throw AppError.badRequest('amount must be a positive integer (kobo)');
  }
  if (!LEDGER_CATEGORIES.includes(category)) {
    throw AppError.badRequest(`invalid ledger category: ${category}`);
  }

  // Filter on balance >= amount so the decrement only applies if the funds exist.
  const updated = await this.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!updated) {
    const wallet = await this.findOne({ userId });
    if (!wallet) throw AppError.notFound('Wallet not found');
    throw AppError.badRequest('Insufficient wallet balance', {
      details: { available: wallet.balance, required: amount },
    });
  }

  const entry = {
    type: 'debit',
    amount,
    category,
    reference,
    description,
    balanceAfter: updated.balance,
    createdAt: new Date(),
  };
  await this.updateOne({ _id: updated._id }, { $push: { ledger: entry } });

  return { wallet: updated, entry };
};

walletSchema.statics.hasReference = async function hasReference(userId, reference) {
  if (!reference) return false;
  const count = await this.countDocuments({ userId, 'ledger.reference': reference });
  return count > 0;
};

module.exports = mongoose.model('Wallet', walletSchema);
module.exports.LEDGER_CATEGORIES = LEDGER_CATEGORIES;
