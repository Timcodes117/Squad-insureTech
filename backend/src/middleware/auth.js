'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const User = require('../models/User');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.query?.token && typeof req.query.token === 'string') return req.query.token;
  return null;
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    config.jwt.secret,
    { algorithm: 'HS256', expiresIn: config.jwt.expiresIn }
  );
}

async function authRequired(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized('Missing authentication token');

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    } catch (err) {
      throw AppError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw AppError.unauthorized('User no longer exists');
    // Inactive users can still access their own dashboard (wallet, transactions,
    // withdraw). Active-state gating belongs in the auditor / claim flow, not here.

    req.user = user;
    req.auth = { userId: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    return next();
  };
}

module.exports = { authRequired, requireRole, signToken };
