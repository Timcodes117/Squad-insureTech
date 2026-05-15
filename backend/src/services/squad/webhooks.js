'use strict';

const crypto = require('crypto');
const config = require('../../config/env');

// Squad uppercases the digest before sending it in x-squad-encrypted-body,
// so both sides are normalised to uppercase before timing-safe compare.
function verifyWebhookSignature(rawBodyBuffer, signatureFromHeader) {
  if (!rawBodyBuffer || !signatureFromHeader) return false;

  const body = Buffer.isBuffer(rawBodyBuffer)
    ? rawBodyBuffer
    : Buffer.from(
        typeof rawBodyBuffer === 'string' ? rawBodyBuffer : JSON.stringify(rawBodyBuffer)
      );

  const digest = crypto
    .createHmac('sha512', config.squad.secretKey)
    .update(body)
    .digest('hex')
    .toUpperCase();

  const provided = String(signatureFromHeader).trim().toUpperCase();

  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

module.exports = { verifyWebhookSignature };
