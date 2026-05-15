'use strict';

const Joi = require('joi');

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().truthy('true').falsy('false').default(false),
});

module.exports = { listQuery };
