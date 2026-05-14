'use strict';

const squadClient = require('./client');
const config = require('../../config/env');
const logger = require('../../config/logger');

function formatDob(dob) {
  if (!dob) return undefined;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return undefined;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeNigerianPhone(phone) {
  if (!phone) return phone;
  const trimmed = String(phone).trim();
  if (trimmed.startsWith('+234')) return `0${trimmed.slice(4)}`;
  if (trimmed.startsWith('234')) return `0${trimmed.slice(3)}`;
  return trimmed;
}

function mapGender(g) {
  if (g === 'male' || g === '1' || g === 1) return '1';
  if (g === 'female' || g === '2' || g === 2) return '2';
  return '1';
}

function parseSquadError(err) {
  const status = err?.response?.status;
  const body = err?.response?.data;
  if (body) {
    const msg = body.message || body.error || (typeof body === 'string' ? body : null);
    if (msg) return { status, message: msg, body };
  }
  return { status, message: err.message, body: null };
}

async function postOnce(path, payload) {
  return squadClient.post(path, payload);
}

// Takes a User document and asks Squad to create the individual virtual account.
// Returns { success: true, virtualAccountNumber, bankCode, bankName, raw } on success,
//         { success: false, error, status, raw } on Squad validation failure.
// Only throws on totally unexpected errors (e.g. no network).
async function createVirtualAccount(user) {
  if (!user) {
    return { success: false, error: 'User is required' };
  }
  if (!user.bvn) {
    return { success: false, error: 'BVN missing on user — cannot create virtual account' };
  }

  const { firstName, lastName } = splitName(user.fullName);
  const payload = {
    customer_identifier: user.squadCustomerIdentifier,
    first_name: firstName,
    last_name: lastName,
    mobile_num: normalizeNigerianPhone(user.phone),
    email: user.email,
    bvn: user.bvn,
    dob: formatDob(user.dob),
    gender: mapGender(user.gender),
    address: user.address || 'Nigeria',
  };
  if (config.squad.beneficiaryAccount) {
    payload.beneficiary_account = config.squad.beneficiaryAccount;
  }

  let response;
  try {
    response = await postOnce('/virtual-account', payload);
  } catch (err) {
    const { status, message, body } = parseSquadError(err);
    if (status && status >= 500) {
      logger.warn({ status }, 'squad: VA create 5xx — retrying once');
      try {
        response = await postOnce('/virtual-account', payload);
      } catch (retryErr) {
        const retry = parseSquadError(retryErr);
        logger.error({ retry }, 'squad: VA create failed after retry');
        return {
          success: false,
          status: retry.status,
          error: retry.message || 'Squad virtual account service unavailable',
          raw: retry.body,
        };
      }
    } else {
      // 4xx — most likely BVN/name/dob mismatch. Surface to caller, do not throw.
      logger.warn({ status, message }, 'squad: VA create rejected');
      return {
        success: false,
        status,
        error: message || 'Squad rejected virtual account creation',
        raw: body,
      };
    }
  }

  const data = response.data?.data || {};
  const success = response.data?.success ?? true;
  if (!success) {
    return {
      success: false,
      error: response.data?.message || 'Squad returned success=false',
      raw: response.data,
    };
  }

  return {
    success: true,
    virtualAccountNumber: data.virtual_account_number || data.account_number || null,
    bankCode: data.bank_code || null,
    bankName: data.bank || data.bank_name || null,
    raw: response.data,
  };
}

module.exports = { createVirtualAccount };
