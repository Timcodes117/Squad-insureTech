'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const openapiSpec = require('./docs/openapi');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Swagger UI needs inline scripts/styles; relax CSP just for /api/docs.
app.use(
  '/api/docs',
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'BetaHealth API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);
app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

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
    data: { service: 'betahealth-api', version: '0.1.0', docs: '/api/v1/health' },
  });
});

app.use('/api/v1', routes);

app.use((req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
