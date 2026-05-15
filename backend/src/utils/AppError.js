'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    if (options.code) this.code = options.code;
    if (options.details) this.details = options.details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message, options) {
    return new AppError(message, 400, options);
  }
  static unauthorized(message = 'Unauthorized', options) {
    return new AppError(message, 401, options);
  }
  static forbidden(message = 'Forbidden', options) {
    return new AppError(message, 403, options);
  }
  static notFound(message = 'Not Found', options) {
    return new AppError(message, 404, options);
  }
  static conflict(message, options) {
    return new AppError(message, 409, options);
  }
}

module.exports = AppError;
