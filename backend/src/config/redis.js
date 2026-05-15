'use strict';

const IORedis = require('ioredis');
const config = require('./env');
const logger = require('./logger');

let client = null;

function getRedis() {
  if (client) return client;
  if (!config.redis.url) {
    logger.warn('redis: REDIS_URL not configured — queues/cron disabled');
    return null;
  }
  client = new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
  });
  client.on('connect', () => logger.info('redis: connected'));
  client.on('error', (err) => logger.error({ err }, 'redis: error'));
  return client;
}

async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
    logger.info('redis: gracefully disconnected');
  }
}

module.exports = { getRedis, closeRedis };
