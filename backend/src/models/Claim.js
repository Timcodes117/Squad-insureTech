'use strict';

const mongoose = require('mongoose');

// Money in KOBO.

const claimSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
      index: true,
    },

    amount: { type: Number, required: true, min: 1 },
    treatmentType: { type: String, required: true, trim: true },
    clinicalNote: { type: String, trim: true },
    preAuthCode: { type: String },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid', 'flagged'],
      default: 'pending',
      index: true,
    },

    auditorChecks: {
      coverageOk: { type: Boolean },
      duplicateOk: { type: Boolean },
      whitelistOk: { type: Boolean },
      riskMatchOk: { type: Boolean },
      cooldownOk: { type: Boolean },
      weekOneCapApplied: { type: Boolean },
      effectiveLimit: { type: Number },
      notes: { type: String },
    },

    amountCovered: { type: Number, default: 0 },
    amountGap: { type: Number, default: 0 },

    squadTransferReference: { type: String, index: true },
    squadTransferStatus: { type: String },

    paidAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

claimSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

claimSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Claim', claimSchema);
