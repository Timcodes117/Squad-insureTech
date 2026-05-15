'use strict';

const config = require('./config/env');
const logger = require('./config/logger');
const { connect, disconnect } = require('./config/db');
const { closeRedis } = require('./config/redis');
const scheduler = require('./jobs/scheduler');
const app = require('./app');

let server;
let shuttingDown = false;

async function start() {
  try {
    await connect();
    // Scheduler must NEVER block boot: if Redis is missing or unreachable, log a
    // warning and continue. The HTTP API + admin manual triggers still work.
    try {
      await scheduler.start();
    } catch (err) {
      logger.warn({ err }, 'startup: scheduler failed to start — API will continue without cron jobs');
    }
    server = app.listen(config.port, () => {
      logger.info(
        { port: config.port, env: config.env, baseUrl: config.api.baseUrl },
        'http: server listening'
      );
    });
  } catch (err) {
    logger.fatal({ err }, 'startup: failed to boot');
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutdown: received signal');

  const forceExitTimer = setTimeout(() => {
    logger.error('shutdown: forced exit after 15s');
    process.exit(1);
  }, 15_000).unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('http: server closed');
    }
    await scheduler.stop();
    await closeRedis();
    await disconnect();
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'shutdown: error during graceful stop');
    process.exit(1);
  }
}

['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => shutdown(sig));
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'process: unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'process: uncaught exception');
  shutdown('uncaughtException');
});

start();
