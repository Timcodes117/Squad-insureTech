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

// Swagger UI uses inline scripts/styles; helmet's default CSP would block them.
const docsHelmet = helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });
const docsUi = swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'BetaHealth API Docs',
  swaggerOptions: { persistAuthorization: true },
});
app.use('/api/v1/docs', docsHelmet, swaggerUi.serve, docsUi);
app.get('/api/v1/docs.json', (_req, res) => res.json(openapiSpec));
app.use('/api/docs', docsHelmet, swaggerUi.serve, docsUi);
app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));

app.use(
  express.json({
    limit: '1mb',
    // Capture rawBody so the Squad webhook controller can HMAC-verify it.
    verify: (req, _res, buf) => {
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
    data: { service: 'betahealth-api', version: '1.0.0', docs: '/api/v1/docs' },
  });
});

app.use('/api/v1', routes);

app.use((req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
