'use strict';

const logger = require('../config/logger');
const Hospital = require('../models/Hospital');
const Claim = require('../models/Claim');

const DAY_MS = 24 * 60 * 60 * 1000;
const SCAN_STATUSES = ['approved', 'paid'];

// Surfaces hospitals whose last-24h activity is more than 3x their 7-day daily
// average (claim count OR payout sum). DOES NOT block any payments — only flags.
async function runHospitalAnomalyScan(opts = {}) {
  const { hospitalId } = opts;
  const now = Date.now();
  const last24 = new Date(now - DAY_MS);
  const last7d = new Date(now - 7 * DAY_MS);

  const query = hospitalId ? { _id: hospitalId, isActive: true } : { isActive: true };
  const hospitals = await Hospital.find(query);
  const summary = { scanned: hospitals.length, flagged: 0, skipped: 0, perHospital: [] };

  for (const h of hospitals) {
    // Skip hospitals with very little history — would false-positive.
    const ageDays = (now - new Date(h.createdAt).getTime()) / DAY_MS;
    if (ageDays < 3) {
      summary.skipped += 1;
      summary.perHospital.push({ hospitalId: h.id, status: 'skipped', reason: 'less than 3 days of history' });
      continue;
    }

    const [day, week] = await Promise.all([
      Claim.aggregate([
        {
          $match: {
            hospitalId: h._id,
            status: { $in: SCAN_STATUSES },
            createdAt: { $gte: last24 },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: '$amountCovered' } } },
      ]),
      Claim.aggregate([
        {
          $match: {
            hospitalId: h._id,
            status: { $in: SCAN_STATUSES },
            createdAt: { $gte: last7d },
          },
        },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: '$amountCovered' } } },
      ]),
    ]);

    const dayCount = day[0]?.count || 0;
    const daySum = day[0]?.sum || 0;
    const weekCount = week[0]?.count || 0;
    const weekSum = week[0]?.sum || 0;
    const dailyAvgCount = weekCount / 7;
    const dailyAvgSum = weekSum / 7;

    const stats = { dayCount, daySum, dailyAvgCount, dailyAvgSum };
    let trip = false;
    const reasons = [];
    if (dailyAvgCount >= 1 && dayCount > 3 * dailyAvgCount) {
      trip = true;
      reasons.push(
        `claims ${dayCount} in last 24h vs daily avg ${dailyAvgCount.toFixed(2)} (>3x)`
      );
    }
    if (dailyAvgSum >= 1 && daySum > 3 * dailyAvgSum) {
      trip = true;
      reasons.push(
        `payouts ₦${(daySum / 100).toLocaleString()} in last 24h vs daily avg ₦${(dailyAvgSum / 100).toLocaleString()} (>3x)`
      );
    }

    if (trip && !h.flagged) {
      h.flagged = true;
      h.flaggedAt = new Date();
      h.flagReason = reasons.join('; ');
      await h.save();
      summary.flagged += 1;
      summary.perHospital.push({ hospitalId: h.id, status: 'flagged', stats, reason: h.flagReason });
      logger.warn(
        { hospitalId: h.id, name: h.name, reason: h.flagReason, stats },
        'hospitalAnomalyScan: FLAGGED'
      );
    } else if (trip && h.flagged) {
      summary.perHospital.push({ hospitalId: h.id, status: 'already-flagged', stats });
    } else {
      summary.perHospital.push({ hospitalId: h.id, status: 'normal', stats });
    }
  }

  logger.info(
    { scanned: summary.scanned, flagged: summary.flagged, skipped: summary.skipped },
    'hospitalAnomalyScan: completed'
  );

  return summary;
}

module.exports = { runHospitalAnomalyScan };
