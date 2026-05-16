'use strict';

const logger = require('../config/logger');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSMS } = require('./sms');
const { sendEmail } = require('./email');

// Single entry point for user-facing messages. The flow:
//   1. Persist the in-app notification doc (synchronously — caller awaits).
//   2. Fire SMS + email in the background and patch the doc when they finish.
// API responses never wait on Twilio or SMTP. If a side-channel hangs for 30s,
// the user still gets their token / confirmation immediately. The notification
// record gets updated when the background work completes.
async function notifyUser(userId, type, title, body, data = {}) {
  if (!userId) {
    logger.warn({ type }, 'notify: missing userId — skipped');
    return null;
  }

  const doc = new Notification({
    userId,
    type,
    title,
    body,
    data,
    channels: {
      sms: { sent: false },
      email: { sent: false },
      inApp: { delivered: true, deliveredAt: new Date() },
    },
  });

  try {
    await doc.save();
  } catch (err) {
    logger.error({ err, userId, type }, 'notify: failed to persist in-app notification');
    return null;
  }

  // Fire and forget. Errors are caught + logged inside, never bubble up.
  setImmediate(() => {
    dispatchSideChannels(doc, userId, title, body).catch((err) => {
      logger.warn({ err, userId, type }, 'notify: background dispatch crashed (swallowed)');
    });
  });

  return doc;
}

async function dispatchSideChannels(doc, userId, subject, body) {
  let user;
  try {
    user = await User.findById(userId).select('phone email');
  } catch (err) {
    logger.warn({ err, userId }, 'notify: user lookup failed in background dispatch');
    return;
  }
  if (!user) return;

  const [smsResult, emailResult] = await Promise.allSettled([
    user.phone ? sendSMS(user.phone, body) : Promise.resolve({ sent: false, skipped: true }),
    user.email
      ? sendEmail({ to: user.email, subject, text: body })
      : Promise.resolve({ sent: false, skipped: true }),
  ]);

  const patch = {};
  if (smsResult.status === 'fulfilled') {
    const sms = smsResult.value;
    if (sms.sent) patch['channels.sms'] = { sent: true, sentAt: new Date(), sid: sms.sid };
    else if (sms.error) patch['channels.sms'] = { sent: false, error: sms.error };
  } else {
    patch['channels.sms'] = { sent: false, error: smsResult.reason?.message || 'unknown' };
  }

  if (emailResult.status === 'fulfilled') {
    const email = emailResult.value;
    if (email.sent) {
      patch['channels.email'] = {
        sent: true,
        sentAt: new Date(),
        messageId: email.messageId,
        address: user.email,
      };
    } else if (email.error) {
      patch['channels.email'] = { sent: false, error: email.error, address: user.email };
    }
  } else {
    patch['channels.email'] = {
      sent: false,
      error: emailResult.reason?.message || 'unknown',
      address: user.email,
    };
  }

  if (Object.keys(patch).length) {
    try {
      await Notification.updateOne({ _id: doc._id }, { $set: patch });
    } catch (err) {
      logger.warn({ err, notificationId: doc._id }, 'notify: failed to patch channels');
    }
  }
}

module.exports = { notifyUser };
