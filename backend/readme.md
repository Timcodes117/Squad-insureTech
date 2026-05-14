# MyBodyCover — Backend

Micro-HMO insurance platform for Nigeria's informal sector. Powered by [Squad](https://squadco.com) for payments.

This package contains the Node.js/Express backend. **Prompt #1** scope: scaffold, auth, models, Squad service skeleton, health check.

## Stack

- Node.js 20 + Express 4
- MongoDB Atlas via Mongoose
- BullMQ + Upstash Redis (wired in later prompts)
- JWT (HS256) + bcrypt
- Joi validation
- Pino logging
- Axios for Squad HTTP

## Setup

```bash
cd backend
cp .env.example .env       # then fill in real values
npm install
npm run dev                # nodemon, or: npm start
```

The server boots on `http://localhost:4000` by default. It connects to MongoDB **before** Express starts listening.

## Environment variables

See [`.env.example`](.env.example). Required at boot: `MONGODB_URI`, `JWT_SECRET`, `SQUAD_SECRET_KEY`. The process exits immediately with a Joi error report if any required key is missing or malformed.

| Var | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | no | `development` / `test` / `production` |
| `PORT` | no | default `4000` |
| `MONGODB_URI` | **yes** | Atlas SRV string |
| `REDIS_URL` | no | enables queues when set (Prompt #3+) |
| `JWT_SECRET` | **yes** | min 16 chars |
| `JWT_EXPIRES_IN` | no | default `7d` |
| `SQUAD_BASE_URL` | no | default `https://sandbox-api-d.squadco.com` |
| `SQUAD_SECRET_KEY` | **yes** | `sandbox_sk_...` |
| `SQUAD_PUBLIC_KEY` | no | |
| `SQUAD_BENEFICIARY_ACCOUNT` | no | GTB account for live; blank in sandbox |
| `TWILIO_*` | no | wired up in Prompt #5 |

## Endpoints (Prompt #1)

Base: `/api/v1`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | — | service + DB readiness |
| POST | `/auth/register` | — | create user, return JWT |
| POST | `/auth/login` | — | login by email **or** phone |
| GET | `/auth/me` | Bearer | current user |

### Register payload

```json
{
  "email": "ada@example.com",
  "phone": "08012345678",
  "password": "Str0ngP@ss",
  "fullName": "Ada Lovelace",
  "dob": "1995-04-12",
  "bvn": "12345678901",
  "occupation": "bricklayer"
}
```

`riskTier` and `weeklyPremium` are derived server-side from `occupation` via [src/utils/riskMapping.js](src/utils/riskMapping.js):

- **high** (₦1000/wk): bricklayer, welder, driver, okada, conductor, porter, mechanic, construction, electrician, plumber, security
- **medium** (₦750/wk): trader, market, vendor, tailor, hairdresser, barber, cook, cleaner, farmer
- **low** (₦500/wk): everything else

### Login payload

```json
{ "identifier": "08012345678", "password": "Str0ngP@ss" }
```

`identifier` accepts either email or phone.

### Standard response shape

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "...", "details": [ ... ] }
```

## What's wired up (and what's NOT)

| Module | State |
| --- | --- |
| Auth (register/login/me) | working |
| User model + risk tiering | working |
| Health check | working |
| Mongo connect + graceful shutdown | working |
| Squad axios client | skeleton |
| `createVirtualAccount(...)` | callable; **not yet** invoked from register flow — Prompt #2 |
| `verifyWebhookSignature(rawBody, sig)` | HMAC SHA512, timing-safe |
| Webhook route | Prompt #2 |
| Wallet model | placeholder schema only — expanded in Prompt #2 |
| Redis / BullMQ | client skeleton — Prompt #3 |
| Twilio | Prompt #5 |

## Folder layout

```
src/
  config/      env, db, redis, logger
  models/      User, Wallet (placeholder)
  middleware/  auth, errorHandler, validateRequest
  services/
    squad/     client, virtualAccount, webhooks, index
  controllers/ auth.controller
  routes/      auth.routes, health.routes, index
  validators/  auth.validator
  utils/       asyncHandler, AppError, riskMapping
  app.js       Express setup (helmet, cors, json+rawBody, pino-http)
  server.js    entry point (Mongo -> listen, SIGTERM/SIGINT)
```

## Quick smoke test

```bash
curl http://localhost:4000/api/v1/health

curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.co","phone":"08012345678","password":"Str0ngP@ss","fullName":"Test User","dob":"1995-04-12","bvn":"12345678901","occupation":"bricklayer"}'
```
