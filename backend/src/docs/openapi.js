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
  { name: 'Users', description: 'Wallet, transactions, claims, withdrawals (Bearer JWT)' },
  { name: 'Notifications', description: 'In-app + SMS notifications feed (Bearer JWT)' },
  { name: 'Hospitals', description: 'Hospital registration + claim submission (x-hospital-api-key)' },
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
      faceVerificationToken: {
        type: 'string',
        description: 'Optional. Token issued by /hospital/users/face-verify (10-min single-use).',
        example: 'fv_abc123...',
      },
    },
  },
  MembershipCard: {
    type: 'object',
    properties: {
      membershipNumber: { type: 'string', example: 'BH-AB23JKL5M' },
      fullName: { type: 'string', example: 'Adaeze Mature' },
      qrPayload: {
        type: 'string',
        description: 'String to encode into the QR (currently the membership number itself). Clients render the QR locally.',
        example: 'BH-AB23JKL5M',
      },
      qrCodeDataUrl: {
        type: 'string',
        nullable: true,
        description: 'Base64 PNG. Only present when ?withImage=true.',
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEU...',
      },
    },
  },
  FaceVerifyRequest: {
    type: 'object',
    required: ['phone', 'image'],
    properties: {
      phone: { type: 'string', example: '08099000010' },
      image: {
        type: 'string',
        description: 'Base64 image bytes (or any string in the hackathon stub). Verification always returns true; the real implementation would call a face-match service.',
        example: 'data:image/jpeg;base64,/9j/4AAQ...',
      },
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

  Notification: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      type: {
        type: 'string',
        enum: [
          'funding_received',
          'premium_burned',
          'cover_activated',
          'cover_paused',
          'claim_approved',
          'claim_rejected',
          'claim_flagged',
          'withdrawal_complete',
          'withdrawal_failed',
          'low_balance',
          'coverage_reset',
          'preauth_code',
          'login_otp',
          'face_verified',
          'password_reset',
          'system',
        ],
      },
      title: { type: 'string' },
      body: { type: 'string' },
      data: { type: 'object', additionalProperties: true },
      isRead: { type: 'boolean' },
      readAt: { type: 'string', format: 'date-time', nullable: true },
      channels: {
        type: 'object',
        properties: {
          sms: {
            type: 'object',
            properties: {
              sent: { type: 'boolean' },
              sentAt: { type: 'string', format: 'date-time', nullable: true },
              sid: { type: 'string', nullable: true },
              error: { type: 'string', nullable: true },
            },
          },
          email: {
            type: 'object',
            properties: {
              sent: { type: 'boolean' },
              sentAt: { type: 'string', format: 'date-time', nullable: true },
              messageId: { type: 'string', nullable: true },
              address: { type: 'string', nullable: true },
              error: { type: 'string', nullable: true },
            },
          },
          inApp: {
            type: 'object',
            properties: {
              delivered: { type: 'boolean' },
              deliveredAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' },
            example: {
              email: 'ada@test.co',
              phone: '08012345678',
              password: 'Str0ngP@ss',
              fullName: 'Ada Lovelace',
              dob: '1995-04-12',
              bvn: '12345678901',
              occupation: 'trader',
              gender: 'female',
              address: '5 Test St, Lagos',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'Registration successful',
                data: {
                  user: { id: '6a0656dfc70fe8e8f4606ca6', email: 'ada@test.co', isActive: false, riskTier: 'medium', weeklyPremium: 75000 },
                  token: 'eyJhbGciOiJIUzI1NiIs...',
                  wallet: { balance: 0 },
                  virtualAccountWarning: 'Validation Failure, invalid BVN',
                },
              },
            },
          },
        },
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            example: { identifier: '08012345678', password: 'Str0ngP@ss' },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'Login successful',
                data: {
                  user: { id: '6a0656dfc70fe8e8f4606ca6', email: 'ada@test.co', isActive: true },
                  token: 'eyJhbGciOiJIUzI1NiIs...',
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Error401' },
      },
    },
  },
  '/auth/login/request-otp': {
    post: {
      tags: ['Auth'],
      summary: 'Two-step login — step 1: verify password + send 6-digit OTP',
      description:
        'Verifies the password and sends a 6-digit OTP to the user via in-app notification + SMS (10-minute expiry). Does NOT issue a JWT — call `/auth/login/verify-otp` next with the code to get one.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' },
            example: { identifier: '08099000010', password: 'demo1234' },
          },
        },
      },
      responses: {
        200: {
          description: 'OTP issued',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'OTP sent. Check your phone or in-app notifications.',
                data: { identifier: '08099000010', expiresAt: '2026-05-15T11:50:00.000Z' },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Error401' },
      },
    },
  },
  '/auth/login/verify-otp': {
    post: {
      tags: ['Auth'],
      summary: 'Two-step login — step 2: exchange OTP for a JWT',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier', 'code'],
              properties: {
                identifier: { type: 'string', example: '08099000010' },
                code: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
              },
            },
            example: { identifier: '08099000010', code: '123456' },
          },
        },
      },
      responses: {
        200: {
          description: 'JWT issued',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'Login successful',
                data: { user: { id: '6a07...', email: 'demo-a@betahealth.test' }, token: 'eyJhbGciOi...' },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Error401' },
      },
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Send a password reset code',
      description:
        'Issues a 6-digit reset code (15-minute expiry) and sends it via in-app notification + SMS + email. Response is always success — never confirms or denies whether the account exists, to prevent enumeration.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier'],
              properties: { identifier: { type: 'string', example: '08099000010' } },
            },
            example: { identifier: '08099000010' },
          },
        },
      },
      responses: {
        200: {
          description: 'Generic acknowledgement',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'If an account exists for that identifier, a reset code has been sent.',
              },
            },
          },
        },
      },
    },
  },
  '/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Reset password using the code from /forgot-password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['identifier', 'code', 'newPassword'],
              properties: {
                identifier: { type: 'string', example: '08099000010' },
                code: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
                newPassword: { type: 'string', minLength: 8, example: 'NewStr0ngP@ss' },
              },
            },
            example: { identifier: '08099000010', code: '123456', newPassword: 'NewStr0ngP@ss' },
          },
        },
      },
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
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
      tags: ['Users'],
      summary: 'Wallet + coverage snapshot',
      security: [{ bearerAuth: [] }],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/users/me/card': {
    get: {
      tags: ['Users'],
      summary: 'Membership card (number + QR payload)',
      description:
        'Returns the user\'s BH-XXXXXXXXX membership number and the string to encode into a QR. By default the client renders the QR (React Native and every modern web framework has a component for this). Pass `?withImage=true` to also receive a base64 PNG data URL — useful for emailing a card or printing without a client-side renderer. Membership number is generated lazily on first read for legacy rows.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'withImage',
          in: 'query',
          required: false,
          schema: { type: 'boolean', default: false },
          description: 'When true, response includes `qrCodeDataUrl` (base64 PNG).',
        },
      ],
      responses: {
        200: {
          description: 'Card payload',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              examples: {
                'default (lean)': {
                  value: {
                    success: true,
                    data: {
                      membershipNumber: 'BH-AB23JKL5M',
                      fullName: 'Adaeze Mature',
                      qrPayload: 'BH-AB23JKL5M',
                    },
                  },
                },
                'with image': {
                  value: {
                    success: true,
                    data: {
                      membershipNumber: 'BH-AB23JKL5M',
                      fullName: 'Adaeze Mature',
                      qrPayload: 'BH-AB23JKL5M',
                      qrCodeDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEU...',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/users/me/transactions': {
    get: {
      tags: ['Users'],
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
      tags: ['Users'],
      summary: 'My claims (newest-first)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: {
        200: {
          description: 'List of claims',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                data: {
                  items: [
                    {
                      id: '6a05794d...',
                      hospitalId: { id: '6a0574e3...', name: 'BetaHealth Demo Clinic' },
                      status: 'paid',
                      amount: 150000,
                      amountCovered: 150000,
                      amountGap: 0,
                      treatmentType: 'malaria',
                      paidAt: '2026-05-14T07:30:00.000Z',
                    },
                  ],
                  pagination: { page: 1, limit: 20, total: 1, pages: 1 },
                },
              },
            },
          },
        },
      },
    },
  },

  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List notifications (newest-first)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        { name: 'unreadOnly', in: 'query', schema: { type: 'boolean', default: false } },
      ],
      responses: {
        200: {
          description: 'Notification feed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                data: {
                  items: [
                    {
                      id: '6a06...',
                      type: 'funding_received',
                      title: 'Wallet funded',
                      body: 'BetaHealth: ₦10,000 received. Wallet balance: ₦10,000. Cover active.',
                      data: { amount: 1000000, balance: 1000000 },
                      isRead: false,
                      channels: { sms: { sent: true, sentAt: '2026-05-14T07:00:00.000Z' }, inApp: { delivered: true } },
                      createdAt: '2026-05-14T07:00:00.000Z',
                    },
                  ],
                  total: 1,
                  unreadCount: 1,
                  pagination: { page: 1, limit: 20, total: 1, pages: 1 },
                },
              },
            },
          },
        },
      },
    },
  },
  '/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Unread count',
      security: [{ bearerAuth: [] }],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/notifications/{id}/read': {
    post: {
      tags: ['Notifications'],
      summary: 'Mark one as read',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
  '/notifications/read-all': {
    post: {
      tags: ['Notifications'],
      summary: 'Mark all as read',
      security: [{ bearerAuth: [] }],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/notifications/{id}': {
    delete: {
      tags: ['Notifications'],
      summary: 'Delete a notification',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
  '/users/me/virtual-account/retry': {
    post: {
      tags: ['Users'],
      summary: 'Retry Squad virtual-account creation',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
      },
    },
  },
  '/users/me/premium/pay': {
    post: {
      tags: ['Users'],
      summary: 'Pay this week\'s premium manually (kicks off the cycle)',
      description:
        'Burns one week of the user\'s premium from their wallet. The first call activates cover, sets firstPremiumAt, and starts the 72-hour claims cooldown. After the first burn the daily 09:00 Africa/Lagos cron handles subsequent weekly burns automatically (per-user rolling 7-day cycle). Returns 400 if the user already paid this week, or if balance < weeklyPremium.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Burn complete',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'First premium paid — cover is now active',
                data: {
                  premium: 50000,
                  balance: 950000,
                  poolShare: 45000,
                  platformShare: 5000,
                  reference: 'BURN_6a07...',
                  isFirstPayment: true,
                  firstPremiumAt: '2026-05-16T01:00:00.000Z',
                  lastPremiumBurnAt: '2026-05-16T01:00:00.000Z',
                  claimsUnlockAt: '2026-05-19T01:00:00.000Z',
                  nextPaymentAt: '2026-05-23T01:00:00.000Z',
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/Error400' },
      },
    },
  },
  '/users/me/activity': {
    get: {
      tags: ['Users'],
      summary: 'Unified recent-activity feed (transactions + claims, newest-first)',
      description:
        'Merges wallet ledger entries and claims into one chronologically sorted feed. Use this for the "recent activity" panel in the app. /users/me/transactions and /users/me/claims still exist if you want one or the other.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      ],
      responses: {
        200: {
          description: 'Activity feed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                data: {
                  walletBalance: 950000,
                  items: [
                    {
                      kind: 'claim',
                      id: '6a07...',
                      type: 'claim_paid',
                      title: 'Claim at BetaHealth Demo Clinic',
                      description: 'Paid ₦1,500',
                      amount: 150000,
                      status: 'paid',
                      treatmentType: 'malaria',
                      createdAt: '2026-05-16T01:30:00.000Z',
                    },
                    {
                      kind: 'transaction',
                      id: '6a06...',
                      type: 'premium_burn',
                      direction: 'debit',
                      title: 'Weekly premium paid',
                      description: 'Weekly premium - BetaHealth',
                      amount: 50000,
                      balanceAfter: 950000,
                      reference: 'BURN_...',
                      createdAt: '2026-05-16T01:00:00.000Z',
                    },
                  ],
                  counts: { transactions: 2, claims: 1, returned: 3 },
                },
              },
            },
          },
        },
      },
    },
  },
  '/users/me/withdrawable': {
    get: {
      tags: ['Users'],
      summary: 'Max withdrawable amount (after reserving this week\'s premium)',
      security: [{ bearerAuth: [] }],
      responses: { 200: { $ref: '#/components/responses/Success200' } },
    },
  },
  '/users/me/withdraw': {
    post: {
      tags: ['Users'],
      summary: 'Withdraw to a bank account',
      description:
        'Atomic: verifies destination via Squad lookup, debits wallet, initiates Squad transfer. If transfer fails after debit, immediately credits back with category `reversal`.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/WithdrawRequest' },
            example: { amount: 900000, bankCode: '000013', accountNumber: '0123456789' },
          },
        },
      },
      responses: {
        200: {
          description: 'Transfer initiated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'Withdrawal initiated',
                data: {
                  amount: 900000,
                  accountName: 'ADA LOVELACE',
                  bankCode: '000013',
                  accountNumber: '0123456789',
                  reference: 'SB5G8G58E8_X9K2L1MNPQRS',
                  status: 'processing',
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/Error400' },
        502: { description: 'Squad transfer failed — wallet has been refunded' },
      },
    },
  },

  // ---------------- Hospital ----------------
  '/hospital/register': {
    post: {
      tags: ['Hospitals'],
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
      tags: ['Hospitals'],
      summary: 'Look up patient by phone OR membership number + issue 4h preAuth code',
      description:
        'Provide either `phone` (typed in by the patient) OR `membership` (scanned from the patient\'s QR card). Both resolve the same record. Lookup also issues a 4-hour single-use preAuth code, sent to the patient via SMS + in-app notification.',
      security: [{ hospitalApiKey: [] }],
      parameters: [
        {
          name: 'phone',
          in: 'query',
          required: false,
          schema: { type: 'string', pattern: '^(\\+234|0)[789][01]\\d{8}$' },
          example: '08099000010',
        },
        {
          name: 'membership',
          in: 'query',
          required: false,
          schema: { type: 'string', pattern: '^BH-[0-9A-Z]{9}$' },
          example: 'BH-AB23JKL5M',
        },
      ],
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
  '/hospital/users/face-verify': {
    post: {
      tags: ['Hospitals'],
      summary: 'Face verification (dummy — always returns verified=true)',
      description:
        'Hackathon stub: confirms the patient is physically present by face check. The actual ML model is not wired — verification always succeeds. Issues a single-use, 10-minute `faceVerificationToken` the hospital can attach to the subsequent claim submission to record that face verification took place.',
      security: [{ hospitalApiKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/FaceVerifyRequest' },
            example: { phone: '08099000010', image: 'data:image/jpeg;base64,/9j/4AAQ...' },
          },
        },
      },
      responses: {
        200: {
          description: 'Verification result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                data: {
                  verified: true,
                  confidence: 0.97,
                  faceVerificationToken: 'fv_kx29l1...',
                  expiresAt: '2026-05-15T11:42:00.000Z',
                  imageBytesReceived: 4321,
                },
              },
            },
          },
        },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
  '/hospital/claims': {
    post: {
      tags: ['Hospitals'],
      summary: 'Submit claim (audited + paid or flagged)',
      security: [{ hospitalApiKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SubmitClaimRequest' },
            example: {
              phone: '08012345678',
              amount: 150000,
              treatmentType: 'malaria',
              clinicalNote: 'Fever, positive RDT',
              preAuthCode: 'AB12CD',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Audited (paid, flagged, or rejected — see decision)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              example: {
                success: true,
                message: 'Claim approved and paid',
                data: {
                  claim: { id: '6a05794d...', status: 'paid', amountCovered: 150000, amountGap: 0 },
                  decision: 'paid',
                  transfer: { reference: 'SB5G_AB12CD34EFG', status: 'success' },
                  coverageRemaining: 1850000,
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Error401' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
    get: {
      tags: ['Hospitals'],
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
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SquadWebhook' },
            example: {
              event: 'virtual_account.credit',
              data: {
                transaction_reference: 'SQUAD_TEST_1778800671821_6F2EE811',
                virtual_account_number: '9988800001',
                principal_amount: '10000',
                settled_amount: '10000',
                currency_id: 'NGN',
                transaction_date: '2026-05-15T07:19:50.000Z',
                sender_name: 'JOHN PAYER',
                remarks: 'BetaHealth funding',
                channel: 'transfer',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Accepted (success, ignored, or duplicate)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiSuccess' },
              examples: {
                success: { value: { success: true } },
                duplicate: { value: { success: true, duplicate: true } },
                ignored: { value: { success: true, ignored: true, reason: 'no amount' } },
              },
            },
          },
        },
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
  '/admin/dev/fund-user': {
    post: {
      tags: ['Admin'],
      summary: 'Dev-only: credit a user wallet without going through a Squad webhook',
      description:
        'Simulates a Squad funding webhook from the API. Same end-state as the real webhook: idempotent credit, isActive flip when balance crosses weeklyPremium, funding_received + cover_activated notifications. Use this from the frontend in test mode instead of running scripts/simulateWebhook.js from a terminal. Production must keep ADMIN_KEY rotated and ideally remove this route.',
      security: [{ adminKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountKobo'],
              properties: {
                userId: { type: 'string', description: 'Mongo _id of the user. One of userId/phone/membership is required.' },
                phone: { type: 'string', example: '08099000030' },
                membership: { type: 'string', example: 'BH-AB23JKL5M' },
                amountKobo: { type: 'integer', minimum: 1, example: 100000, description: '₦1,000 = 100000' },
                reference: {
                  type: 'string',
                  description: 'Optional. Pass the same reference twice to verify the idempotency guard.',
                },
              },
            },
            example: { phone: '08099000030', amountKobo: 100000 },
          },
        },
      },
      responses: {
        200: { $ref: '#/components/responses/Success200' },
        400: { $ref: '#/components/responses/Error400' },
        404: { $ref: '#/components/responses/Error404' },
      },
    },
  },
};

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'BetaHealth API',
    version: '1.0.0',
    description:
      "Micro health cover for Nigeria's informal sector. Powered by Squad. All money amounts are in Kobo (1 Naira = 100 Kobo). All protected routes require `Authorization: Bearer <jwt>`.",
  },
  servers,
  tags,
  components: { securitySchemes, schemas, responses },
  paths,
};

module.exports = openapi;
