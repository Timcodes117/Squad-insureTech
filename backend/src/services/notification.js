'use strict';

const logger = require('../config/logger');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSMS } = require('./sms');
const { sendEmail } = require('./email');

// Single entry point for user-facing messages. Persists the in-app feed entry
// first, then best-effort SMS and email in parallel. Errors on either channel
// are swallowed so the caller's business flow is never blocked.
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

  try {
    const user = await User.findById(userId).select('phone email');
    const [smsResult, emailResult] = await Promise.allSettled([
      user?.phone ? sendSMS(user.phone, body) : Promise.resolve({ sent: false, skipped: true }),
      user?.email
        ? sendEmail({ to: user.email, subject: title, text: body })
        : Promise.resolve({ sent: false, skipped: true }),
    ]);

    if (smsResult.status === 'fulfilled') {
      const sms = smsResult.value;
      if (sms.sent) doc.channels.sms = { sent: true, sentAt: new Date(), sid: sms.sid };
      else if (sms.error) doc.channels.sms = { sent: false, error: sms.error };
    }

    if (emailResult.status === 'fulfilled') {
      const email = emailResult.value;
      if (email.sent) {
        doc.channels.email = {
          sent: true,
          sentAt: new Date(),
          messageId: email.messageId,
          address: user?.email,
        };
      } else if (email.error) {
        doc.channels.email = { sent: false, error: email.error, address: user?.email };
      }
    }

    await doc.save();
  } catch (err) {
    logger.warn({ err, userId, type }, 'notify: SMS/email path failed (swallowed)');
  }

  return doc;
}

module.exports = { notifyUser };
