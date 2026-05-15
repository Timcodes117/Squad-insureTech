'use strict';

const Joi = require('joi');

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const withdrawBody = Joi.object({
  amount: Joi.number().integer().min(1).required(), // KOBO
  bankCode: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'bankCode must be a 6-digit Squad NIP code (e.g. 000013 for GTBank)',
  }),
  accountNumber: Joi.string().length(10).pattern(/^\d+$/).required(),
});

module.exports = { listQuery, withdrawBody };
