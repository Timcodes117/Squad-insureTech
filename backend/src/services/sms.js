'use strict';

const config = require('../config/env');
const logger = require('../config/logger');

let _client = null;
let _disabled = null;

function isConfigured() {
  return Boolean(
    config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber
  );
}

function getClient() {
  if (_disabled) return null;
  if (_client) return _client;
  if (!isConfigured()) {
    _disabled = true;
    return null;
  }
  try {
    // Lazy-require so the package never loads if Twilio is unconfigured.
    // eslint-disable-next-line global-require
    const twilio = require('twilio');
    _client = twilio(config.twilio.accountSid, config.twilio.authToken);
    return _client;
  } catch (err) {
    logger.error({ err }, 'sms: failed to init twilio client — disabling');
    _disabled = true;
    return null;
  }
}

function toE164(phone) {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('234')) return `+${trimmed}`;
  if (trimmed.startsWith('0')) return `+234${trimmed.slice(1)}`;
  return `+${trimmed}`;
}

// Never throws. Returns { sent: bool, sid?, error? }.
async function sendSMS(toPhone, message) {
  const client = getClient();
  if (!client) {
    logger.info({ to: toPhone }, '[SMS skipped - Twilio not configured]');
    return { sent: false, skipped: true };
  }
  try {
    const to = toE164(toPhone);
    const result = await client.messages.create({
      to,
      from: config.twilio.phoneNumber,
      body: message,
    });
    logger.info({ to, sid: result.sid }, 'sms: sent');
    return { sent: true, sid: result.sid };
  } catch (err) {
    logger.warn({ err: err.message, to: toPhone }, 'sms: send failed (swallowed)');
    return { sent: false, error: err.message };
  }
}

module.exports = { sendSMS, isConfigured, toE164 };
