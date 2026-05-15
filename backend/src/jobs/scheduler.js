'use strict';

const { Queue, Worker, QueueEvents } = require('bullmq');
const logger = require('../config/logger');
const { getRedis } = require('../config/redis');

const { runPremiumBurn } = require('./premiumBurn');
const { runCoverageReset } = require('./coverageReset');
const { runHospitalAnomalyScan } = require('./hospitalAnomalyScan');

const QUEUE_NAME = 'betahealth-jobs';
const TZ = 'Africa/Lagos';

// Cron expressions in Africa/Lagos local time.
const SCHEDULES = [
  { name: 'premiumBurn', pattern: '0 9 * * 1', handler: () => runPremiumBurn({}) },
  { name: 'coverageReset', pattern: '30 0 * * *', handler: () => runCoverageReset({}) },
  { name: 'hospitalAnomalyScan', pattern: '0 1 * * *', handler: () => runHospitalAnomalyScan({}) },
];

let queue = null;
let worker = null;
let queueEvents = null;

async function start() {
  const connection = getRedis();
  if (!connection) {
    logger.warn('scheduler: REDIS_URL not configured — repeatable jobs disabled. Admin manual triggers still work.');
    return { started: false };
  }

  try {
    queue = new Queue(QUEUE_NAME, { connection });
    queueEvents = new QueueEvents(QUEUE_NAME, { connection });
    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const schedule = SCHEDULES.find((s) => s.name === job.name);
        if (!schedule) throw new Error(`Unknown job name: ${job.name}`);
        logger.info({ job: job.name }, 'scheduler: running job');
        const result = await schedule.handler();
        return result;
      },
      { connection, concurrency: 1 }
    );

    worker.on('failed', (job, err) => {
      logger.error({ job: job?.name, err }, 'scheduler: job failed');
    });
    worker.on('completed', (job, result) => {
      logger.info({ job: job.name, result }, 'scheduler: job completed');
    });

    for (const s of SCHEDULES) {
      await queue.add(
        s.name,
        {},
        {
          repeat: { pattern: s.pattern, tz: TZ },
          removeOnComplete: 50,
          removeOnFail: 100,
          jobId: `${s.name}:repeat`,
        }
      );
    }

    logger.info(
      { schedules: SCHEDULES.map((s) => ({ name: s.name, pattern: s.pattern, tz: TZ })) },
      'scheduler: started'
    );
    return { started: true };
  } catch (err) {
    logger.error({ err }, 'scheduler: failed to start — continuing without jobs');
    return { started: false };
  }
}

async function stop() {
  try {
    if (worker) await worker.close();
    if (queueEvents) await queueEvents.close();
    if (queue) await queue.close();
    worker = null;
    queueEvents = null;
    queue = null;
    logger.info('scheduler: stopped');
  } catch (err) {
    logger.warn({ err }, 'scheduler: shutdown error');
  }
}

module.exports = { start, stop };
