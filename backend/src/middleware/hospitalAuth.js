'use strict';

const Hospital = require('../models/Hospital');
const AppError = require('../utils/AppError');

async function hospitalAuth(req, _res, next) {
  try {
    const apiKey = req.headers['x-hospital-api-key'];
    if (!apiKey) throw AppError.unauthorized('Missing x-hospital-api-key header');

    const hospital = await Hospital.findOne({ apiKey: String(apiKey) });
    if (!hospital) throw AppError.unauthorized('Invalid hospital API key');
    if (!hospital.isActive) throw AppError.forbidden('Hospital account inactive');

    req.hospital = hospital;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { hospitalAuth };
