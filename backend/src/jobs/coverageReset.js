'use strict';

const logger = require('../config/logger');
const User = require('../models/User');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Resets coverageRemaining = coverageLimit and rolls coverageResetAt forward
// 30 days, but only for users whose own rolling 30-day cycle has elapsed.
// Each user resets on their own date — no global month.
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
