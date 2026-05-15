'use strict';

const mongoose = require('mongoose');

const TYPES = [
  'funding_received',
  'premium_burned',
  'cover_activated',
  'cover_paused',
  'claim_approved',
  'claim_rejected',
  'claim_flagged',
  'withdrawal_complete',
  'withdrawal_failed',
  'low_balance',
  'coverage_reset',
  'preauth_code',
  'login_otp',
  'face_verified',
  'password_reset',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, enum: TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    channels: {
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        sid: { type: String },
        error: { type: String },
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        messageId: { type: String },
        address: { type: String },
        error: { type: String },
      },
      inApp: {
        delivered: { type: Boolean, default: true },
        deliveredAt: { type: Date, default: () => new Date() },
      },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

notificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES = TYPES;
