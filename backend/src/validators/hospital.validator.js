'use strict';

const Joi = require('joi');

const NIGERIAN_PHONE_REGEX = /^(\+234|0)[789][01]\d{8}$/;

const registerBody = Joi.object({
  name: Joi.string().min(2).max(120).trim().required(),
  contactPhone: Joi.string().pattern(NIGERIAN_PHONE_REGEX).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  address: Joi.string().max(255).trim().optional().allow(''),
  bankCode: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'bankCode must be a 6-digit Squad NIP code (e.g. 000013 for GTBank)',
  }),
  accountNumber: Joi.string().length(10).pattern(/^\d+$/).required(),
});

const userLookupQuery = Joi.object({
  phone: Joi.string().pattern(NIGERIAN_PHONE_REGEX).required(),
});

const submitClaimBody = Joi.object({
  phone: Joi.string().pattern(NIGERIAN_PHONE_REGEX).required(),
  amount: Joi.number().integer().min(1).required(),
  treatmentType: Joi.string().min(2).max(80).trim().required(),
  clinicalNote: Joi.string().max(2000).trim().optional().allow(''),
  preAuthCode: Joi.string().min(4).max(20).required(),
  // Optional — if provided, attached to the claim audit trail.
  faceVerificationToken: Joi.string().optional().allow(''),
});

const faceVerifyBody = Joi.object({
  phone: Joi.string().pattern(NIGERIAN_PHONE_REGEX).required(),
  // For the demo this is any non-empty string (base64 image, file path, etc.).
  // Production would replace with a real face-match service call.
  image: Joi.string().min(1).required(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  registerBody,
  userLookupQuery,
  submitClaimBody,
  faceVerifyBody,
  listQuery,
};
