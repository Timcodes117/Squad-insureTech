'use strict';

// Hand-authored OpenAPI 3.0 spec.
// Source of truth for the docs UI at /api/docs.

const config = require('../config/env');

const servers = [
  { url: 'http://localhost:4000/api/v1', description: 'Local dev' },
  { url: `${config.api.baseUrl}/api/v1`, description: 'Configured API_BASE_URL' },
];

const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT issued by /auth/login or /auth/register',
  },
  hospitalApiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'x-hospital-api-key',
    description: 'Returned when a hospital registers — used for all hospital routes',
  },
  adminKey: {
    type: 'apiKey',
    in: 'header',
    name: 'x-admin-key',
    description: 'Static admin key from env (ADMIN_KEY). For demo use only.',
  },
  squadSignature: {
    type: 'apiKey',
    in: 'header',
    name: 'x-squad-encrypted-body',
    description: 'HMAC SHA-512 of the raw request body, hex digest (uppercase). Squad-only.',
  },
};

const tags = [
  { name: 'Health', description: 'Service readiness' },
  { name: 'Auth', description: 'Register, login, current user' },
  { name: 'User', description: 'Wallet, transactions, claims, withdrawals (Bearer JWT)' },
  { name: 'Hospital', description: 'Hospital registration + claim submission (x-hospital-api-key)' },
  { name: 'Webhooks', description: 'Inbound Squad webhooks (HMAC signed)' },
  { name: 'Admin', description: 'Demo + ops triggers (x-admin-key)' },
];

const schemas = {
  ApiSuccess: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: { type: 'object' },
    },
    required: ['success'],
  },
  ApiError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: { type: 'string', example: 'Validation failed' },
      details: { type: 'array', items: { type: 'object' } },
      code: { type: 'string' },
    },
    required: ['success', 'error'],
  },

  RegisterRequest: {
    type: 'object',
    required: ['email', 'phone', 'password', 'fullName', 'dob', 'bvn', 'occupation', 'gender'],
    properties: {
      email: { type: 'string', format: 'email', example: 'ada@test.co' },
      phone: { type: 'string', pattern: '^(\\+234|0)[789][01]\\d{8}$', example: '08012345678' },
      password: { type: 'string', minLength: 8, example: 'Str0ngP@ss' },
      fullName: { type: 'string', example: 'Ada Lovelace' },
      dob: { type: 'string', format: 'date', example: '1995-04-12' },
      bvn: { type: 'string', pattern: '^\\d{11}$', example: '12345678901' },
      occupation: { type: 'string', example: 'trader' },
      gender: { type: 'string', enum: ['male', 'female'], example: 'female' },
      address: { type: 'string', example: '5 Test St, Lagos' },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['identifier', 'password'],
    properties: {
      identifier: { type: 'string', description: 'email OR phone', example: '08012345678' },
      password: { type: 'string', example: 'Str0ngP@ss' },
    },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      fullName: { type: 'string' },
      dob: { type: 'string', format: 'date-time' },
      occupation: { type: 'string' },
      gender: { type: 'string', enum: ['male', 'female'] },
      address: { type: 'string' },
      riskTier: { type: 'string', enum: ['low', 'medium', 'high'] },
      weeklyPremium: { type: 'integer', description: 'Kobo' },
      role: { type: 'string', enum: ['user', 'hospital', 'admin'] },
      isActive: { type: 'boolean' },
      firstPremiumAt: { type: 'string', format: 'date-time', nullable: true },
      lastPremiumBurnAt: { type: 'string', format: 'date-time', nullable: true },
      squadCustomerIdentifier: { type: 'string' },
      virtualAccountNumber: { type: 'string', nullable: true },
      virtualAccountBankCode: { type: 'string', nullable: true },
      virtualAccountBankName: { type: 'string', nullable: true },
      coverageLimit: { type: 'integer', description: 'Kobo' },
      coverageRemaining: { type: 'integer', description: 'Kobo' },
      coverageResetAt: { type: 'string', format: 'date-time' },
    },
  },
  Wallet: {
    type: 'object',
    properties: {
      balance: { type: 'integer', description: 'Kobo' },
      virtualAccountNumber: { type: 'string', nullable: true },
      virtualAccountBankCode: { type: 'string', nullable: true },
      virtualAccountBankName: { type: 'string', nullable: true },
      coverageLimit: { type: 'integer', description: 'Kobo' },
      coverageRemaining: { type: 'integer', description: 'Kobo' },
      coverageResetAt: { type: 'string', format: 'date-time' },
      isActive: { type: 'boolean' },
      riskTier: { type: 'string', enum: ['low', 'medium', 'high'] },
      weeklyPremium: { type: 'integer', description: 'Kobo' },
    },
  },
  LedgerEntry: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['credit', 'debit'] },
      amount: { type: 'integer', description: 'Kobo' },
      category: {
        type: 'string',
        enum: ['funding', 'premium_burn', 'claim_settlement', 'withdrawal', 'reversal'],
      },
      description: { type: 'string' },
      balanceAfter: { type: 'integer', description: 'Kobo' },
      reference: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer' },
      limit: { type: 'integer' },
      total: { type: 'integer' },
      pages: { type: 'integer' },
    },
  },

  WithdrawableResponse: {
    type: 'object',
    properties: {
      walletBalance: { type: 'integer', description: 'Kobo' },
      reserved: { type: 'integer', description: 'Kobo — weeklyPremium if not yet burned this week' },
      withdrawableAmount: { type: 'integer', description: 'Kobo' },
      reason: { type: 'string', nullable: true },
    },
  },
  WithdrawRequest: {
    type: 'object',
    required: ['amount', 'bankCode', 'accountNumber'],
    properties: {
      amount: { type: 'integer', description: 'Kobo', example: 900000 },
      bankCode: { type: 'string', description: '6-digit Squad NIP code', example: '000013' },
      accountNumber: { type: 'string', minLength: 10, maxLength: 10, example: '0123456789' },
    },
  },

  Hospital: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      contactPhone: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      address: { type: 'string', nullable: true },
      bankCode: { type: 'string' },
      accountNumber: { type: 'string' },
      accountName: { type: 'string' },
      isVerified: { type: 'boolean' },
      isActive: { type: 'boolean' },
      flagged: { type: 'boolean' },
      flaggedAt: { type: 'string', format: 'date-time', nullable: true },
      flagReason: { type: 'string', nullable: true },
      apiKey: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  HospitalRegisterRequest: {
    type: 'object',
    required: ['name', 'bankCode', 'accountNumber'],
    properties: {
      name: { type: 'string', example: 'Sunrise Clinic' },
      contactPhone: { type: 'string', example: '08012345678' },
      email: { type: 'string', format: 'email', example: 'sunrise@test.co' },
      address: { type: 'string', example: '12 Health St, Lagos' },
      bankCode: { type: 'string', description: '6-digit NIP code', example: '000013' },
      accountNumber: { type: 'string', example: '0123456789' },
    },
  },
  HospitalUserLookupResponse: {
    type: 'object',
    properties: {
      fullName: { type: 'string' },
      phone: { type: 'string' },
      isActive: { type: 'boolean' },
      coverageRemaining: { type: 'integer', description: 'Kobo' },
      coverageLimit: { type: 'integer', description: 'Kobo' },
      coverageResetAt: { type: 'string', format: 'date-time' },
      riskTier: { type: 'string', enum: ['low', 'medium', 'high'] },
      preAuthCode: { type: 'string', description: '6-char code, valid 4h, single-use' },
      preAuthExpiresAt: { type: 'string', format: 'date-time' },
    },
  },

  SubmitClaimRequest: {
    type: 'object',
    required: ['phone', 'amount', 'treatmentType', 'preAuthCode'],
    properties: {
      phone: { type: 'string', example: '08012345678' },
      amount: { type: 'integer', description: 'Kobo', example: 150000 },
      treatmentType: { type: 'string', example: 'malaria' },
      clinicalNote: { type: 'string', example: 'Fever, positive RDT' },
      preAuthCode: { type: 'string', example: 'AB12CD' },
    },
  },
  Claim: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      hospitalId: { type: 'string' },
      amount: { type: 'integer', description: 'Kobo (bill amount)' },
      treatmentType: { type: 'string' },
      clinicalNote: { type: 'string' },
      preAuthCode: { type: 'string' },
      status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'paid', 'flagged'] },
      auditorChecks: {
        type: 'object',
        properties: {
          coverageOk: { type: 'boolean' },
          duplicateOk: { type: 'boolean' },
          whitelistOk: { type: 'boolean' },
          riskMatchOk: { type: 'boolean' },
          cooldownOk: { type: 'boolean' },
          weekOneCapApplied: { type: 'boolean' },
          effectiveLimit: { type: 'integer' },
          notes: { type: 'string' },
        },
      },
      amountCovered: { type: 'integer', description: 'Kobo paid by BetaHealth' },
      amountGap: { type: 'integer', description: 'Kobo owed by patient' },
      squadTransferReference: { type: 'string', nullable: true },
      squadTransferStatus: { type: 'string', nullable: true },
      paidAt: { type: 'string', format: 'date-time', nullable: true },
      rejectionReason: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },

  SquadWebhook: {
    type: 'object',
    description: 'Funding webhook from Squad. Amount fields are in NAIRA (we convert to kobo).',
    properties: {
      event: { type: 'string', example: 'virtual_account.credit' },
      data: {
        type: 'object',
        properties: {
          transaction_reference: { type: 'string' },
          virtual_account_number: { type: 'string' },
          principal_amount: { type: 'string' },
          settled_amount: { type: 'string' },
          fee_charged: { type: 'string' },
          currency_id: { type: 'string', example: 'NGN' },
          transaction_date: { type: 'string', format: 'date-time' },
          customer_identifier: { type: 'string', nullable: true },
          sender_name: { type: 'string' },
          remarks: { type: 'string' },
          channel: { type: 'string' },
        },
      },
    },
  },

  JobSummaryPremiumBurn: {
    type: 'object',
    properties: {
      scanned: { type: 'integer' },
      burned: { type: 'integer' },
      paused: { type: 'integer' },
      skipped: { type: 'integer' },
      totalPool: { type: 'integer' },
      totalPlatform: { type: 'integer' },
      perUser: { type: 'array', items: { type: 'object' } },
    },
  },
  JobSummaryCoverageReset: {
    type: 'object',
    properties: {
      scanned: { type: 'integer' },
      reset: { type: 'integer' },
      skipped: { type: 'integer' },
    },
  },
  JobSummaryAnomalyScan: {
    type: 'object',
    properties: {
      scanned: { type: 'integer' },
      flagged: { type: 'integer' },
      skipped: { type: 'integer' },
      perHospital: { type: 'array', items: { type: 'object' } },
    },
  },
};

// Shared response definitions.
const responses = {
  Success200: {
    description: 'Success',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } },
  },
  Created201: {
    description: 'Created',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } },
  },
  Error400: {
    description: 'Bad request / validation error',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  Error401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  Error403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  Error404: {
    description: 'Not found',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  Error409: {
    description: 'Conflict',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
};

// Paths.
const paths = {
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Service health',
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },

  // ---------------- Auth ----------------
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description:
        'Creates user (inactive) + empty wallet, generates squadCustomerIdentifier, and asks Squad to create a virtual account. If Squad rejects the BVN, `data.virtualAccountWarning` is set and the user can retry via `/users/me/virtual-account/retry`.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
      },
      responses: {
        201: { $ref: '#/components/responses/Created201' },
        400: { $ref: '#/components/responses/Error400' },
        409: { $ref: '#/components/responses/Error409' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login by email OR phone',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
      },
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        401: { $ref: '#/components/responses/Error401' },
      },
    },
  },
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: 'Current authenticated user',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        401: { $ref: '#/components/responses/Error401' },
      },
    },
  },

  // ---------------- User ----------------
  '/users/me/wallet': {
    get: {
      tags: ['User'],
      summary: 'Wallet + coverage snapshot',
      security: [{ bearerAuth: [] }],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/users/me/transactions': {
    get: {
      tags: ['User'],
      summary: 'Ledger entries (newest-first)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/users/me/claims': {
    get: {
      tags: ['User'],
      summary: 'My claims (newest-first)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/users/me/virtual-account/retry': {
    post: {
      tags: ['User'],
      summary: 'Retry Squad virtual-account creation',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
      },
    },
  },
  '/users/me/withdrawable': {
    get: {
      tags: ['User'],
      summary: 'Max withdrawable amount (after reserving this week\'s premium)',
      security: [{ bearerAuth: [] }],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/users/me/withdraw': {
    post: {
      tags: ['User'],
      summary: 'Withdraw to a bank account',
      description:
        'Atomic: verifies destination via Squad lookup, debits wallet, initiates Squad transfer. If transfer fails after debit, immediately credits back with category `reversal`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/WithdrawRequest' } } },
      },
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
        502: { description: 'Squad transfer failed — wallet has been refunded' },
      },
    },
  },

  // ---------------- Hospital ----------------
  '/hospital/register': {
    post: {
      tags: ['Hospital'],
      summary: 'Open hospital registration (demo)',
      description: 'In production, gate behind admin approval + KYB. Calls Squad lookup to verify the bank account; if Squad permits, `isVerified` is true.',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/HospitalRegisterRequest' } } },
      },
      responses: {
        201: { $ref: '#/components/responses/Created201' },
        400: { $ref: '#/components/responses/Error400' },
        409: { $ref: '#/components/responses/Error409' },
      },
    },
  },
  '/hospital/users/lookup': {
    get: {
      tags: ['Hospital'],
      summary: 'Look up patient by phone + issue 4h preAuth code',
      security: [{ hospitalApiKey: [] }],
      parameters: [
        {
          name: 'phone',
          in: 'query',
          required: true,
          schema: { type: 'string', pattern: '^(\\+234|0)[789][01]\\d{8}$' },
        },
      ],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
  '/hospital/claims': {
    post: {
      tags: ['Hospital'],
      summary: 'Submit claim (audited + paid or flagged)',
      security: [{ hospitalApiKey: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitClaimRequest' } } },
      },
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        401: { $ref: '#/components/responses/Error401' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
    get: {
      tags: ['Hospital'],
      summary: 'List my hospital claims',
      security: [{ hospitalApiKey: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },

  // ---------------- Webhooks ----------------
  '/webhooks/squad': {
    post: {
      tags: ['Webhooks'],
      summary: 'Squad webhook receiver',
      description:
        'No bearer auth; verifies HMAC SHA-512 against the raw body using SQUAD_SECRET_KEY. Idempotent on `transaction_reference`. Use `scripts/simulateWebhook.js` to test locally.',
      security: [{ squadSignature: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/SquadWebhook' } } },
      },
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        401: { description: 'Invalid HMAC signature' },
      },
    },
  },

  // ---------------- Admin ----------------
  '/admin/claims/{id}/approve': {
    post: {
      tags: ['Admin'],
      summary: 'Force-approve a flagged claim and run payout',
      security: [{ adminKey: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
  '/admin/jobs/run-premium-burn': {
    post: {
      tags: ['Admin'],
      summary: 'Run weekly premium burn immediately',
      description: 'Optional body `{ "userId": "..." }` to scope to one user.',
      security: [{ adminKey: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { userId: { type: 'string' } } },
          },
        },
      },
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/admin/jobs/run-coverage-reset': {
    post: {
      tags: ['Admin'],
      summary: 'Reset coverage for users whose 30-day cycle has elapsed',
      security: [{ adminKey: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { userId: { type: 'string' } } },
          },
        },
      },
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/admin/jobs/run-hospital-anomaly-scan': {
    post: {
      tags: ['Admin'],
      summary: 'Run hospital anomaly scan',
      security: [{ adminKey: [] }],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', properties: { hospitalId: { type: 'string' } } },
          },
        },
      },
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/admin/hospitals/{id}/clear-flag': {
    post: {
      tags: ['Admin'],
      summary: 'Clear an anomaly flag on a hospital',
      security: [{ adminKey: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
};

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'BetaHealth API',
    version: '0.3.0',
    description:
      'Micro-HMO insurance for Nigeria\'s informal sector. Powered by Squad.\n\n**All money fields are in KOBO** (₦1 = 100 kobo). Squad webhooks send naira; the boundary converts.',
  },
  servers,
  tags,
  components: { securitySchemes, schemas, responses },
  paths,
};

module.exports = openapi;
