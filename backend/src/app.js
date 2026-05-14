'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const config = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: config.isProd ? true : true, // allow all in dev; tighten in prod via config later
    credentials: true,
  })
);

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      // Stash raw body for webhook signature verification.
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'mybodycover-api', version: '0.1.0', docs: '/api/v1/health' },
  });
});

app.use('/api/v1', routes);

app.use((req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
