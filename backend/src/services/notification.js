'use strict';

const logger = require('../config/logger');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSMS } = require('./sms');

// Single entry point for user-facing messages. Persists the in-app feed entry
// first, then best-effort SMS. Errors on the SMS leg are swallowed so the
// caller's business flow is never blocked by Twilio outages.
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
      inApp: { delivered: true, deliveredAt: new Date() },
    },
  });

  try {
    await doc.save();
  } catch (err) {
    logger.error({ err, userId, type }, 'notify: failed to persist in-app notification');
    return null;
  }

  // SMS is optional. Errors are swallowed.
  try {
    const user = await User.findById(userId).select('phone');
    if (user?.phone) {
      const sms = await sendSMS(user.phone, body);
      if (sms.sent) {
        doc.channels.sms = { sent: true, sentAt: new Date(), sid: sms.sid };
      } else if (sms.error) {
        doc.channels.sms = { sent: false, error: sms.error };
      }
      await doc.save();
    }
  } catch (err) {
    logger.warn({ err, userId, type }, 'notify: SMS path failed (swallowed)');
  }

  return doc;
}

module.exports = { notifyUser };
