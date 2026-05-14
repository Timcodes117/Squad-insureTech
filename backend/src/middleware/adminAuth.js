'use strict';

const config = require('../config/env');
const AppError = require('../utils/AppError');

// Demo-grade admin gate: static key in X-Admin-Key header.
// In production replace with proper admin user auth + 2FA.
function adminAuth(req, _res, next) {
  const provided = req.headers['x-admin-key'];
  if (!provided || provided !== config.admin.key) {
    return next(AppError.forbidden('Admin key invalid'));
  }
  return next();
}

module.exports = { adminAuth };
