#!/usr/bin/env node
'use strict';

/**
 * scripts/simulateWebhook.js
 *
 * Build a realistic Squad virtual-account-credit webhook payload, sign it with
 * SQUAD_SECRET_KEY (HMAC SHA512, uppercase hex), and POST it to the local API.
 *
 * Usage:
 *   node scripts/simulateWebhook.js --va 0123456789 --amount 1000 [--ref CUSTOM_REF]
 *
 *   --va        Virtual account number on the target user (required)
 *   --amount    Amount in NAIRA (not kobo!) — Squad webhooks send naira. Default 1000.
 *   --ref       Transaction reference. Default: a fresh random one each run.
 *   --url       Webhook URL. Default: http://localhost:4000/api/v1/webhooks/squad
 */

const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const url = arg('--url', 'http://localhost:4000/api/v1/webhooks/squad');
const virtualAccountNumber = arg('--va');
const amountNaira = Number(arg('--amount', '1000'));
const reference =
  arg('--ref') ||
  `SQUAD_TEST_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const secret = process.env.SQUAD_SECRET_KEY;
if (!secret) {
  console.error('SQUAD_SECRET_KEY missing from .env');
  process.exit(1);
}
if (!virtualAccountNumber) {
  console.error('Pass --va <virtual_account_number>');
  process.exit(1);
}
if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
  console.error('--amount must be a positive number (naira)');
  process.exit(1);
}

const payload = {
  event: 'virtual_account.credit',
  data: {
    transaction_reference: reference,
    virtual_account_number: virtualAccountNumber,
    principal_amount: String(amountNaira),
    settled_amount: String(amountNaira),
    fee_charged: '0',
    currency_id: 'NGN',
    transaction_date: new Date().toISOString(),
    customer_identifier: null,
    sender_name: 'JOHN PAYER',
    remarks: 'BetaHealth funding test',
    channel: 'transfer',
  },
};

const rawBody = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha512', secret)
  .update(rawBody)
  .digest('hex')
  .toUpperCase();

(async () => {
  console.log('POST', url);
  console.log('x-squad-encrypted-body:', signature.slice(0, 32) + '... (len=' + signature.length + ')');
  console.log('body:', rawBody);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-squad-encrypted-body': signature,
      },
      body: rawBody,
    });
    const text = await res.text();
    console.log('\nHTTP', res.status);
    console.log(text);
    process.exit(res.ok ? 0 : 1);
  } catch (err) {
    console.error('Request failed:', err.message);
    process.exit(1);
  }
})();
