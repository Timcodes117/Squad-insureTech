'use strict';

const path = require('path');
const Joi = require('joi');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(4000),

  MONGODB_URI: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),

  REDIS_URL: Joi.string().uri().allow('').optional(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),

  SQUAD_BASE_URL: Joi.string().uri().default('https://sandbox-api-d.squadco.com'),
  SQUAD_SECRET_KEY: Joi.string().required(),
  SQUAD_PUBLIC_KEY: Joi.string().allow('').optional(),
  SQUAD_BENEFICIARY_ACCOUNT: Joi.string().allow('').optional(),
  SQUAD_MERCHANT_ID: Joi.string().allow('').optional(),
  // When true, lookupAccount + initiateTransfer return mocked success. Used for
  // local/demo runs when Squad sandbox has not enabled payout endpoints on the
  // merchant. Must be false in production.
  SQUAD_MOCK_PAYOUTS: Joi.boolean().truthy('true').falsy('false').default(false),

  ADMIN_KEY: Joi.string().min(8).default('local_dev_admin_key_change_me'),

  TWILIO_ACCOUNT_SID: Joi.string().allow('').optional(),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').optional(),
  TWILIO_PHONE_NUMBER: Joi.string().allow('').optional(),

  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).default(587),
  SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().allow('').optional(),

  API_BASE_URL: Joi.string().uri().default('http://localhost:4000'),
}).unknown(true);

const { value, error } = schema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const details = error.details.map((d) => `  - ${d.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[env] Invalid environment configuration:\n${details}\n`);
  throw new Error('Invalid environment configuration. See logs above.');
}

const config = Object.freeze({
  env: value.NODE_ENV,
  isProd: value.NODE_ENV === 'production',
  isDev: value.NODE_ENV === 'development',
  port: value.PORT,

  mongo: {
    uri: value.MONGODB_URI,
  },

  redis: {
    url: value.REDIS_URL || null,
  },

  jwt: {
    secret: value.JWT_SECRET,
    expiresIn: value.JWT_EXPIRES_IN,
  },

  squad: {
    baseUrl: value.SQUAD_BASE_URL,
    secretKey: value.SQUAD_SECRET_KEY,
    publicKey: value.SQUAD_PUBLIC_KEY || null,
    beneficiaryAccount: value.SQUAD_BENEFICIARY_ACCOUNT || null,
    merchantId: value.SQUAD_MERCHANT_ID || null,
    mockPayouts: value.SQUAD_MOCK_PAYOUTS,
  },

  admin: {
    key: value.ADMIN_KEY,
  },

  twilio: {
    accountSid: value.TWILIO_ACCOUNT_SID || null,
    authToken: value.TWILIO_AUTH_TOKEN || null,
    phoneNumber: value.TWILIO_PHONE_NUMBER || null,
  },

  smtp: {
    host: value.SMTP_HOST || null,
    port: value.SMTP_PORT,
    secure: value.SMTP_SECURE,
    user: value.SMTP_USER || null,
    pass: value.SMTP_PASS || null,
    from: value.SMTP_FROM || null,
  },

  api: {
    baseUrl: value.API_BASE_URL,
  },
});

module.exports = config;
