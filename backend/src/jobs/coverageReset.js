'use strict';

const logger = require('../config/logger');
const User = require('../models/User');
const { notifyUser } = require('../services/notification');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Each user resets on their own rolling 30-day cycle from registration. The
// daily job picks up whoever's coverageResetAt has elapsed since last run.
async function runCoverageReset(opts = {}) {
  const { userId } = opts;
  const now = new Date();
  const query = userId
    ? { _id: userId }
    : { coverageResetAt: { $lte: now } };

  const users = await User.find(query);
  const summary = { scanned: users.length, reset: 0, skipped: 0 };

  for (const user of users) {
    if (user.coverageResetAt && new Date(user.coverageResetAt) > now) {
      summary.skipped += 1;
      continue;
    }
    const oldRemaining = user.coverageRemaining;
    user.coverageRemaining = user.coverageLimit;
    user.coverageResetAt = new Date(now.getTime() + THIRTY_DAYS_MS);
    await user.save();
    summary.reset += 1;

    await notifyUser(
      user._id,
      'coverage_reset',
      'Coverage refreshed',
      `BetaHealth: your monthly cover has been refreshed. New limit ₦${(user.coverageLimit / 100).toLocaleString()}.`,
      {
        coverageLimit: user.coverageLimit,
        previousRemaining: oldRemaining,
        nextResetAt: user.coverageResetAt,
      }
    );

    logger.info(
      {
        userId: user.id,
        from: oldRemaining,
        to: user.coverageRemaining,
        nextReset: user.coverageResetAt,
      },
      'coverageReset: reset user coverage'
    );
  }

  logger.info({ summary }, 'coverageReset: completed');
  return summary;
}

module.exports = { runCoverageReset };
