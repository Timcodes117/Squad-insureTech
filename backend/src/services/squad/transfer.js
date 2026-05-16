'use strict';

const { customAlphabet } = require('nanoid');
const squadClient = require('./client');
const config = require('../../config/env');
const logger = require('../../config/logger');

const refNanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12);

function parseErr(err) {
  const status = err?.response?.status;
  const body = err?.response?.data;
  const message =
    body?.message ||
    body?.error ||
    (typeof body === 'string' ? body : null) ||
    err.message;
  return { status, message, body };
}

function buildTransferReference() {
  const merchant = config.squad.merchantId || 'MBC';
  return `${merchant}_${refNanoid()}`;
}

async function lookupAccount(bankCode, accountNumber) {
  if (!bankCode || !accountNumber) {
    return { success: false, error: 'bankCode and accountNumber are required' };
  }
  if (config.squad.mockPayouts) {
    logger.info({ bankCode, accountNumber }, 'squad: MOCK lookupAccount');
    return {
      success: true,
      accountName: 'MOCK ACCOUNT (SQUAD_MOCK_PAYOUTS=true)',
      mocked: true,
    };
  }
  try {
    const res = await squadClient.post('/payout/account/lookup', {
      bank_code: String(bankCode),
      account_number: String(accountNumber),
    });
    const data = res.data?.data || {};
    const ok = res.data?.success ?? true;
    if (!ok) {
      return { success: false, error: res.data?.message || 'Lookup failed', raw: res.data };
    }
    return {
      success: true,
      accountName: data.account_name || data.accountName || null,
      raw: res.data,
    };
  } catch (err) {
    const { status, message, body } = parseErr(err);
    logger.warn({ status, message }, 'squad: account lookup failed');
    return { success: false, status, error: message, raw: body };
  }
}

// amount is in KOBO.
async function initiateTransfer({ amount, bankCode, accountNumber, accountName, remark }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, error: 'amount must be a positive integer (kobo)' };
  }
  if (!bankCode || !accountNumber || !accountName) {
    return { success: false, error: 'bankCode, accountNumber, accountName are required' };
  }

  const reference = buildTransferReference();
  if (config.squad.mockPayouts) {
    logger.info({ reference, amount }, 'squad: MOCK initiateTransfer');
    return {
      success: true,
      reference,
      status: 'success',
      mocked: true,
      raw: { mocked: true, note: 'SQUAD_MOCK_PAYOUTS=true' },
    };
  }
  const payload = {
    transaction_reference: reference,
    amount: String(amount),
    bank_code: String(bankCode),
    account_number: String(accountNumber),
    account_name: accountName,
    currency_id: 'NGN',
    remark: remark || `BetaHealth transfer ${reference}`,
  };

  try {
    const res = await squadClient.post('/payout/transfer', payload);
    const data = res.data?.data || {};
    const ok = res.data?.success ?? true;
    const txStatus =
      data.transaction_status ||
      data.status ||
      (ok ? 'success' : 'failed');

    return {
      success: ok,
      reference,
      status: String(txStatus).toLowerCase(),
      raw: res.data,
    };
  } catch (err) {
    const { status, message, body } = parseErr(err);
    logger.error({ status, message, reference }, 'squad: transfer initiation failed');
    return { success: false, reference, status: 'failed', error: message, raw: body };
  }
}

async function requeryTransfer(reference) {
  if (!reference) return { success: false, error: 'reference required' };
  try {
    const res = await squadClient.post('/payout/requery', {
      transaction_reference: reference,
    });
    const data = res.data?.data || {};
    return {
      success: res.data?.success ?? true,
      status: String(data.transaction_status || data.status || 'unknown').toLowerCase(),
      raw: res.data,
    };
  } catch (err) {
    const { status, message, body } = parseErr(err);
    logger.warn({ status, message, reference }, 'squad: requery failed');
    return { success: false, error: message, raw: body };
  }
}

module.exports = {
  buildTransferReference,
  lookupAccount,
  initiateTransfer,
  requeryTransfer,
};
