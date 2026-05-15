'use strict';

const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// System-wide singleton. The pool float pays claims; platformBalance accrues
// BetaHealth's 10% fee. All values in kobo. The 90/10 split runs on premium
// burns; user funding is never split.

const ledgerEntrySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['funding', 'premium_burn', 'claim_settlement', 'reversal', 'platform_fee'],
      required: true,
    },
    bucket: {
      type: String,
      enum: ['pool', 'platform'],
      required: true,
    },
    reference: { type: String, index: true },
    description: { type: String },
    balanceAfter: { type: Number, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const poolWalletSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['MAIN_POOL'],
      required: true,
      unique: true,
      default: 'MAIN_POOL',
    },
    balance: { type: Number, default: 0, min: 0 },
    platformBalance: { type: Number, default: 0, min: 0 },
    ledger: { type: [ledgerEntrySchema], default: [] },
  },
  { timestamps: true }
);

poolWalletSchema.statics.getOrCreate = async function getOrCreate() {
  const existing = await this.findOne({ key: 'MAIN_POOL' });
  if (existing) return existing;
  return this.findOneAndUpdate(
    { key: 'MAIN_POOL' },
    { $setOnInsert: { key: 'MAIN_POOL', balance: 0, platformBalance: 0, ledger: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

function assertAmount(amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw AppError.badRequest('amount must be a positive integer (kobo)');
  }
}

poolWalletSchema.statics.creditPool = async function creditPool({ amount, category, reference, description }) {
  assertAmount(amount);
  const updated = await this.findOneAndUpdate(
    { key: 'MAIN_POOL' },
    { $inc: { balance: amount } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const entry = {
    type: 'credit',
    amount,
    category: category || 'funding',
    bucket: 'pool',
    reference,
    description,
    balanceAfter: updated.balance,
    createdAt: new Date(),
  };
  await this.updateOne({ _id: updated._id }, { $push: { ledger: entry } });
  return { pool: updated, entry };
};

poolWalletSchema.statics.creditPlatform = async function creditPlatform({ amount, reference, description }) {
  assertAmount(amount);
  const updated = await this.findOneAndUpdate(
    { key: 'MAIN_POOL' },
    { $inc: { platformBalance: amount } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const entry = {
    type: 'credit',
    amount,
    category: 'platform_fee',
    bucket: 'platform',
    reference,
    description,
    balanceAfter: updated.platformBalance,
    createdAt: new Date(),
  };
  await this.updateOne({ _id: updated._id }, { $push: { ledger: entry } });
  return { pool: updated, entry };
};

poolWalletSchema.statics.debitPool = async function debitPool({ amount, category, reference, description }) {
  assertAmount(amount);
  const updated = await this.findOneAndUpdate(
    { key: 'MAIN_POOL', balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!updated) {
    const current = await this.findOne({ key: 'MAIN_POOL' });
    throw AppError.badRequest('Insufficient pool float', {
      details: { available: current?.balance ?? 0, required: amount },
    });
  }
  const entry = {
    type: 'debit',
    amount,
    category: category || 'claim_settlement',
    bucket: 'pool',
    reference,
    description,
    balanceAfter: updated.balance,
    createdAt: new Date(),
  };
  await this.updateOne({ _id: updated._id }, { $push: { ledger: entry } });
  return { pool: updated, entry };
};

module.exports = mongoose.model('PoolWallet', poolWalletSchema);
