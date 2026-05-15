'use strict';

const Joi = require('joi');

const NIGERIAN_PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

const registerBody = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().pattern(NIGERIAN_PHONE_REGEX).required().messages({
    'string.pattern.base': 'phone must be a valid Nigerian number (e.g. 08012345678 or +2348012345678)',
  }),
  password: Joi.string().min(8).max(128).required(),
  fullName: Joi.string().min(2).max(120).trim().required(),
  dob: Joi.date().iso().less('now').required(),
  bvn: Joi.string().length(11).pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'bvn must be 11 digits',
  }),
  occupation: Joi.string().min(2).max(80).trim().required(),
  gender: Joi.string().valid('male', 'female').required(),
  address: Joi.string().max(255).trim().optional().allow(''),
});

const loginBody = Joi.object({
  identifier: Joi.string().trim().required(),
  password: Joi.string().required(),
});

const requestOtpBody = Joi.object({
  identifier: Joi.string().trim().required(),
  password: Joi.string().required(),
});

const verifyOtpBody = Joi.object({
  identifier: Joi.string().trim().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'OTP must be 6 digits',
  }),
});

module.exports = { registerBody, loginBody, requestOtpBody, verifyOtpBody };
