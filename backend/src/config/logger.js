'use strict';

const pino = require('pino');
const config = require('./env');

const logger = pino({
  level: process.env.LOG_LEVEL || (config.isProd ? 'info' : 'debug'),
  base: { service: 'betahealth-api', env: config.env },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.bvn',
      '*.token',
    ],
    censor: '[redacted]',
  },
  transport: config.isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', singleLine: false },
      },
});

module.exports = logger;
