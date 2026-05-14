'use strict';

const logger = require('../config/logger');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { verifyWebhookSignature } = require('../services/squad');
const { sendSMS } = require('../services/sms');
const asyncHandler = require('../utils/asyncHandler');

// Squad sends amounts in NAIRA. Internally we store kobo. Convert at the boundary.
function parseAmountToKobo(raw) {
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function extractEvent(body) {
  const root = body || {};
  const data = root.data || root.transaction || root;
  const virtualAccountNumber =
    data.virtual_account_number ||
    data.account_number ||
    data.virtualAccount ||
    data.virtualAccountNumber;
  const transactionReference =
    data.transaction_reference ||
    data.transactionReference ||
    data.reference;
  const customerIdentifier = data.customer_identifier || data.customerIdentifier;
  const rawAmount =
    data.settled_amount ??
    data.settledAmount ??
    data.principal_amount ??
    data.principalAmount ??
    data.amount;
  return {
    transactionReference,
    virtualAccountNumber,
    customerIdentifier,
    amountKobo: parseAmountToKobo(rawAmount),
  };
}

const handleSquadWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-squad-encrypted-body'] || req.headers['x-squad-signature'];

  if (!verifyWebhookSignature(req.rawBody, signature)) {
    logger.warn(
      { hasSig: Boolean(signature), hasBody: Boolean(req.rawBody) },
      'webhook: signature verification failed'
    );
    return res.status(401).json({ success: false, error: 'Invalid signature' });
  }

  const event = extractEvent(req.body);
  if (!event.virtualAccountNumber && !event.customerIdentifier) {
    return res.status(200).json({ success: true, ignored: true, reason: 'unsupported event' });
  }
  if (!event.transactionReference) {
    return res.status(200).json({ success: true, ignored: true, reason: 'no reference' });
  }
  if (!event.amountKobo || event.amountKobo <= 0) {
    return res.status(200).json({ success: true, ignored: true, reason: 'no amount' });
  }

  const user = await User.findOne(
    event.virtualAccountNumber
      ? { virtualAccountNumber: event.virtualAccountNumber }
      : { squadCustomerIdentifier: event.customerIdentifier }
  );
  if (!user) {
    return res.status(200).json({ success: true, ignored: true, reason: 'user not found' });
  }

  // Idempotency: Squad retries on transient errors. Same reference => no-op.
  if (await Wallet.hasReference(user._id, event.transactionReference)) {
    return res.status(200).json({ success: true, duplicate: true });
  }

  // FUNDING = FULL USER CREDIT. NO SPLIT. NO POOL/PLATFORM CREDIT.
  // The 90/10 split happens on the weekly PREMIUM BURN, not on funding —
  // because users can pre-fund many weeks ahead and that money is 100% theirs
  // until a premium actually burns.
  const { wallet } = await Wallet.credit({
    userId: user._id,
    amount: event.amountKobo,
    category: 'funding',
    reference: event.transactionReference,
    description: `Wallet top-up via Squad (₦${event.amountKobo / 100})`,
  });

  // Pay-to-activate: if the user is inactive and their NEW balance meets the
  // weekly premium, flip them active.
  if (!user.isActive && user.weeklyPremium && wallet.balance >= user.weeklyPremium) {
    user.isActive = true;
    await user.save();
  }

  try {
    await sendSMS(
      user.phone,
      `BetaHealth: ₦${(event.amountKobo / 100).toLocaleString()} received. Wallet balance: ₦${(wallet.balance / 100).toLocaleString()}.${user.isActive ? ' Cover active.' : ''}`
    );
  } catch (err) {
    logger.warn({ err }, 'webhook: sms send failed (swallowed)');
  }

  logger.info(
    {
      userId: user.id,
      reference: event.transactionReference,
      amountKobo: event.amountKobo,
      newBalance: wallet.balance,
      activated: user.isActive,
    },
    'webhook: funded (no split)'
  );

  return res.status(200).json({ success: true });
});

module.exports = { handleSquadWebhook };
