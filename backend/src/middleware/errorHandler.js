'use strict';

const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const config = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.details) {
    details = err.details;
  }

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  const isOperational = err instanceof AppError || status < 500;

  const logPayload = {
    err,
    method: req.method,
    url: req.originalUrl,
    requestId: req.id,
    status,
  };
  if (isOperational) logger.warn(logPayload, 'request: handled error');
  else logger.error(logPayload, 'request: unhandled error');

  const body = {
    success: false,
    error: isOperational || config.isDev ? message : 'Internal server error',
  };
  if (details) body.details = details;
  if (err.code && typeof err.code === 'string') body.code = err.code;
  if (config.isDev && !isOperational) body.stack = err.stack;

  res.status(status).json(body);
}

module.exports = errorHandler;
