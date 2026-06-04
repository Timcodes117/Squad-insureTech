'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Hospital = require('../models/Hospital');
const AppError = require('../utils/AppError');

function extractBearer(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

function verifyHospitalJwt(token) {
  try {
    const payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    if (payload.type !== 'hospital' || payload.role !== 'hospital_staff') return null;
    return payload;
  } catch {
    return null;
  }
}

async function hospitalAuth(req, _res, next) {
  try {
    const apiKey = req.headers['x-hospital-api-key'];
    const bearer = extractBearer(req);

    if (bearer) {
      const payload = verifyHospitalJwt(bearer);
      if (!payload) throw AppError.unauthorized('Invalid or expired hospital session');

      const hospital = await Hospital.findById(payload.sub);
      if (!hospital) throw AppError.unauthorized('Hospital no longer exists');
      if (!hospital.isActive) throw AppError.forbidden('Hospital account inactive');

      const headerHospitalId = req.headers['x-hospital-id'];
      if (headerHospitalId && String(headerHospitalId) !== hospital.id) {
        throw AppError.forbidden('hospital_id does not match authenticated session');
      }

      req.hospital = hospital;
      req.hospitalAuth = { hospitalId: hospital.id, role: payload.role, via: 'jwt' };
      return next();
    }

    if (apiKey) {
      const hospital = await Hospital.findOne({ apiKey: String(apiKey) });
      if (!hospital) throw AppError.unauthorized('Invalid hospital API key');
      if (!hospital.isActive) throw AppError.forbidden('Hospital account inactive');

      req.hospital = hospital;
      req.hospitalAuth = { hospitalId: hospital.id, role: 'hospital_staff', via: 'api_key' };
      return next();
    }

    throw AppError.unauthorized('Missing hospital authentication (Bearer token or x-hospital-api-key)');
  } catch (err) {
    return next(err);
  }
}

module.exports = { hospitalAuth };
