'use strict';

const logger = require('../config/logger');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const PoolWallet = require('../models/PoolWallet');
const { splitPremium } = require('../services/feeSplit');
const { sendSMS } = require('../services/sms');

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;

// Runs the weekly premium burn. Idempotent-safe: a user whose lastPremiumBurnAt
// is within the last 6 days is skipped, so re-running on the same day (or twice
// the same week) won't double-burn.
//
// Options:
//   { userId } — burn for a single user only (used by the demo trigger).
//   { dryRun } — compute without writing.
async function runPremiumBurn(opts = {}) {
  const { userId, dryRun = false } = opts;
  const sixDaysAgo = new Date(Date.now() - SIX_DAYS_MS);

  const query = userId
    ? { _id: userId }
    : {
        isActive: true,
        $or: [{ lastPremiumBurnAt: null }, { lastPremiumBurnAt: { $lt: sixDaysAgo } }],
      };

  const users = await User.find(query);
  const summary = {
    scanned: users.length,
    burned: 0,
    paused: 0,
    skipped: 0,
    totalPool: 0,
    totalPlatform: 0,
    perUser: [],
  };

  for (const user of users) {
    // Per-user idempotency guard (covers the single-user manual path too).
    if (user.lastPremiumBurnAt && new Date(user.lastPremiumBurnAt) > sixDaysAgo) {
      summary.skipped += 1;
      summary.perUser.push({ userId: user.id, status: 'skipped', reason: 'burned within last 6 days' });
      continue;
    }

    const premium = user.weeklyPremium;
    if (!premium || premium <= 0) {
      summary.skipped += 1;
      summary.perUser.push({ userId: user.id, status: 'skipped', reason: 'no weekly premium set' });
      continue;
    }

    const wallet = await Wallet.findOne({ userId: user._id }).select('balance');
    const balance = wallet?.balance ?? 0;

    if (balance < premium) {
      if (!dryRun) {
        user.isActive = false;
        await user.save();
        try {
          await sendSMS(
            user.phone,
            `BetaHealth: Your cover is paused — wallet balance too low. Top up ₦${(premium / 100).toLocaleString()} to reactivate.`
          );
        } catch (err) {
          logger.warn({ err, userId: user.id }, 'premiumBurn: paused SMS failed');
        }
      }
      summary.paused += 1;
      summary.perUser.push({ userId: user.id, status: 'paused', balance, premium });
      continue;
    }

    if (dryRun) {
      summary.burned += 1;
      summary.perUser.push({ userId: user.id, status: 'would-burn', premium });
      continue;
    }

    // Atomic debit.
    const reference = `BURN_${user.id}_${Date.now()}`;
    let updatedWallet;
    try {
      const result = await Wallet.debit({
        userId: user._id,
        amount: premium,
        category: 'premium_burn',
        reference,
        description: 'Weekly premium - BetaHealth',
      });
      updatedWallet = result.wallet;
    } catch (err) {
      logger.error({ err, userId: user.id }, 'premiumBurn: debit failed (race condition?)');
      summary.skipped += 1;
      summary.perUser.push({ userId: user.id, status: 'error', error: err.message });
      continue;
    }

    // Split 90/10 to pool + platform.
    const split = splitPremium(premium);
    if (split.pool > 0) {
      await PoolWallet.creditPool({
        amount: split.pool,
        category: 'premium_burn',
        reference,
        description: `Pool share (90%) of premium from user ${user.id}`,
      });
    }
    if (split.platform > 0) {
      await PoolWallet.creditPlatform({
        amount: split.platform,
        reference,
        description: `Platform share (10%) of premium from user ${user.id}`,
      });
    }

    // Mark first-burn + last-burn timestamps.
    const now = new Date();
    if (!user.firstPremiumAt) user.firstPremiumAt = now;
    user.lastPremiumBurnAt = now;
    if (!user.isActive) user.isActive = true; // safety; should already be true
    await user.save();

    summary.burned += 1;
    summary.totalPool += split.pool;
    summary.totalPlatform += split.platform;
    summary.perUser.push({
      userId: user.id,
      status: 'burned',
      premium,
      pool: split.pool,
      platform: split.platform,
      newBalance: updatedWallet.balance,
    });

    try {
      await sendSMS(
        user.phone,
        `BetaHealth: ₦${(premium / 100).toLocaleString()} weekly premium paid. Wallet balance: ₦${(updatedWallet.balance / 100).toLocaleString()}. You're covered.`
      );
    } catch (err) {
      logger.warn({ err, userId: user.id }, 'premiumBurn: success SMS failed');
    }
  }

  logger.info(
    {
      scanned: summary.scanned,
      burned: summary.burned,
      paused: summary.paused,
      skipped: summary.skipped,
      totalPool: summary.totalPool,
      totalPlatform: summary.totalPlatform,
      dryRun,
    },
    'premiumBurn: completed'
  );

  return summary;
}

module.exports = { runPremiumBurn };
