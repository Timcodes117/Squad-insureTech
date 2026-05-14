'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    address: { type: String, trim: true },

    bankCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    flagged: { type: Boolean, default: false, index: true },
    flaggedAt: { type: Date },
    flagReason: { type: String },

    apiKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `hosp_${crypto.randomBytes(24).toString('hex')}`,
    },
  },
  { timestamps: true }
);

hospitalSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

hospitalSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Hospital', hospitalSchema);
