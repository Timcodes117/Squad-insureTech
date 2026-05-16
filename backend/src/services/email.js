'use strict';

const config = require('../config/env');
const logger = require('../config/logger');

let _transport = null;
let _disabled = null;

function isConfigured() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
}

function getTransport() {
  if (_disabled) return null;
  if (_transport) return _transport;
  if (!isConfigured()) {
    _disabled = true;
    return null;
  }
  try {
    // Lazy-require so nodemailer never loads if SMTP isn't configured.
    // eslint-disable-next-line global-require
    const nodemailer = require('nodemailer');
    _transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      // Force IPv4 — Render's free tier doesn't route IPv6 to Gmail,
      // causing ENETUNREACH on smtp.gmail.com's AAAA records.
      family: 4,
      // Fail fast so a slow SMTP server can't stall API responses; the
      // notifyUser flow runs the send in the background anyway.
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 10000,
    });
    return _transport;
  } catch (err) {
    logger.error({ err }, 'email: failed to init transport — disabling');
    _disabled = true;
    return null;
  }
}

// Never throws. Returns { sent, messageId?, error?, skipped? }.
async function sendEmail({ to, subject, text, html }) {
  const transport = getTransport();
  if (!transport) {
    logger.info({ to }, '[email skipped - SMTP not configured]');
    return { sent: false, skipped: true };
  }
  if (!to) {
    return { sent: false, skipped: true };
  }
  try {
    const info = await transport.sendMail({
      from: config.smtp.from || config.smtp.user,
      to,
      subject,
      text,
      html: html || undefined,
    });
    logger.info({ to, messageId: info.messageId }, 'email: sent');
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.warn({ err: err.message, to }, 'email: send failed (swallowed)');
    return { sent: false, error: err.message };
  }
}

module.exports = { sendEmail, isConfigured };
