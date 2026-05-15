# BetaHealth — Backend

Micro-HMO insurance platform for Nigeria's informal sector. Powered by [Squad](https://squadco.com) for payments.

Node.js / Express / MongoDB / Mongoose / BullMQ. Auth via JWT, validation via Joi, logging via Pino, Squad HTTP via axios.

> **Money is in KOBO** everywhere internally. `₦1 = 100 kobo`. Squad webhooks send naira and we convert at the boundary.

---

## TL;DR — get it running

```bash
cd backend
cp .env.example .env       # then fill in real values (see below)
npm install
npm run dev                # nodemon — autoreloads on changes
# or:  npm start
```

Server listens on `http://localhost:4000`. It connects to Mongo **before** Express starts listening.

- API root: `http://localhost:4000`
- Health: `http://localhost:4000/api/v1/health`
- **Interactive docs (Swagger UI):** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- Raw OpenAPI JSON: `http://localhost:4000/api/docs.json`

---

## Environment variables

See [`.env.example`](.env.example). The process exits at boot with a Joi report if a required key is missing or malformed.

| Var | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | no | `development` (default) / `test` / `production` |
| `PORT` | no | default `4000` |
| `MONGODB_URI` | **yes** | Atlas SRV string |
| `REDIS_URL` | no | enables BullMQ cron jobs when set. API still runs without it (admin manual triggers work). |
| `JWT_SECRET` | **yes** | min 16 chars |
| `JWT_EXPIRES_IN` | no | default `7d` |
| `SQUAD_BASE_URL` | no | default `https://sandbox-api-d.squadco.com` |
| `SQUAD_SECRET_KEY` | **yes** | `sandbox_sk_...` |
| `SQUAD_PUBLIC_KEY` | no | |
| `SQUAD_BENEFICIARY_ACCOUNT` | no | blank in sandbox |
| `SQUAD_MERCHANT_ID` | no | prefix for transfer references — `SB...` from Squad dashboard |
| `ADMIN_KEY` | no | static header `x-admin-key` for `/admin/*` (default `local_dev_admin_key_change_me`) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | no | SMS silently skipped if any are missing |
| `API_BASE_URL` | no | default `http://localhost:4000` |

---

## Folder layout

```
src/
  config/      env.js, db.js, redis.js, logger.js
  models/      User.js, Wallet.js, PoolWallet.js, Hospital.js, Claim.js
  middleware/  auth.js, hospitalAuth.js, adminAuth.js, errorHandler.js, validateRequest.js
  services/
    squad/     client.js, virtualAccount.js, transfer.js, webhooks.js, index.js
    feeSplit.js, sms.js, claimAuditor.js
  controllers/ auth, user, hospital, webhook, admin (.controller.js)
  routes/      auth, user, hospital, webhook, admin, health, index (.routes.js)
  validators/  auth, user, hospital (.validator.js)
  jobs/        premiumBurn.js, coverageReset.js, hospitalAnomalyScan.js, scheduler.js
  utils/       asyncHandler.js, AppError.js, riskMapping.js
  docs/        openapi.js   (hand-authored OpenAPI 3.0 spec)
  app.js       Express setup
  server.js    entry — connects Mongo, starts scheduler, listens

scripts/
  simulateWebhook.js   HMAC-signs and POSTs a fake Squad funding webhook
```

---

## Endpoints

Base path: `/api/v1`. Standard response shape:

```json
{ "success": true,  "data":  { ... }, "message": "..." }
{ "success": false, "error": "...",   "details": [ ... ] }
```

### Auth
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Create user + wallet, attempt Squad virtual-account creation |
| POST | `/auth/login` | — | Login by email **or** phone |
| GET  | `/auth/me` | Bearer | Current user |

### User (Bearer JWT)
| Method | Path | Purpose |
| --- | --- | --- |
| GET  | `/users/me/wallet` | Wallet + coverage snapshot |
| GET  | `/users/me/transactions` | Ledger entries (newest-first, paginated) |
| GET  | `/users/me/claims` | My claims (paginated) |
| POST | `/users/me/virtual-account/retry` | Re-attempt Squad VA creation |
| GET  | `/users/me/withdrawable` | Max amount currently withdrawable |
| POST | `/users/me/withdraw` | Withdraw to a bank account (atomic w/ reversal) |

### Hospital
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/hospital/register` | — | Open registration (demo) — verifies bank account via Squad |
| GET  | `/hospital/users/lookup?phone=...` | `x-hospital-api-key` | Look up patient + issue 4h preAuth code (also SMSed to patient) |
| POST | `/hospital/claims` | `x-hospital-api-key` | Submit claim → audit → pay or flag |
| GET  | `/hospital/claims` | `x-hospital-api-key` | List my claims |

### Webhooks
| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/webhooks/squad` | HMAC SHA-512 (`x-squad-encrypted-body`) | Squad virtual-account funding events |

### Admin (static key `x-admin-key`)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/claims/:id/approve` | Force-approve a flagged claim and run payout |
| POST | `/admin/jobs/run-premium-burn` | Run weekly burn now (optional body `{userId}`) |
| POST | `/admin/jobs/run-coverage-reset` | Reset coverage for users whose 30-day cycle has elapsed |
| POST | `/admin/jobs/run-hospital-anomaly-scan` | Run anomaly scan now (optional body `{hospitalId}`) |
| POST | `/admin/hospitals/:id/clear-flag` | Clear anomaly flag |

### Health
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Service + DB readiness |

---

## Manual test sequence (end-to-end lifecycle)

Use [Postman/Insomnia/Bruno/Hoppscotch] or run these `curl`s from a Bash shell. Or simply open **http://localhost:4000/api/docs** and click "Try it out" on each endpoint.

Set environment variables in your shell once:

```bash
export BASE=http://localhost:4000/api/v1
export ADMIN_KEY=local_dev_admin_key_change_me   # match your .env
```

### 1) Register a hospital (you'll get an apiKey)

```bash
curl -X POST $BASE/hospital/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Sunrise Clinic",
    "contactPhone":"08012345678",
    "email":"sunrise@test.co",
    "address":"12 Health St, Lagos",
    "bankCode":"000013",
    "accountNumber":"0123456789"
  }'
```

Save `data.apiKey` from the response:

```bash
export HOSPITAL_KEY=hosp_xxxxxxxxxxxxxxxxxxxx
```

> **Sandbox note:** if your Squad sandbox key isn't profiled for `/payout/account/lookup`, the response will show `bankVerification.ok: false` and the hospital will be saved with `isVerified: false`. Claims won't be approved against an unverified hospital. Force-verify for testing (one-time):
>
> ```bash
> node -e "require('./src/config/env');const m=require('mongoose');const H=require('./src/models/Hospital');\
> m.connect(process.env.MONGODB_URI).then(async()=>{\
>   await H.updateOne({email:'sunrise@test.co'},{isVerified:true,accountName:'SUNRISE CLINIC LTD'});\
>   await m.disconnect();}).then(()=>console.log('verified'));"
> ```

### 2) Register a user (inactive, no premium yet)

```bash
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"ada@test.co",
    "phone":"08098800350",
    "password":"Str0ngP@ss",
    "fullName":"Ada Lovelace",
    "dob":"1995-04-12",
    "bvn":"12345678901",
    "occupation":"trader",
    "gender":"female",
    "address":"5 Test St, Lagos"
  }'
```

Save the JWT:

```bash
export TOKEN=eyJhbGciOiJIUzI1NiIs...
```

> The response includes `data.virtualAccountWarning` if Squad rejected the BVN (very common in sandbox with dummy data). The user is still created — you can retry VA creation later via `POST /users/me/virtual-account/retry`. For local testing, inject a fake VA:
>
> ```bash
> node -e "require('./src/config/env');const m=require('mongoose');const U=require('./src/models/User');\
> m.connect(process.env.MONGODB_URI).then(async()=>{\
>   await U.updateOne({phone:'08098800350'},\
>     {virtualAccountNumber:'9988800001',virtualAccountBankCode:'000013',virtualAccountBankName:'GTBank'});\
>   await m.disconnect();}).then(()=>console.log('VA injected'));"
> ```

### 3) Login (sanity check)

```bash
curl -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "identifier":"08098800350", "password":"Str0ngP@ss" }'
```

### 4) Simulate a Squad funding webhook — ₦10,000

`scripts/simulateWebhook.js` HMAC-signs a fake payload with your `SQUAD_SECRET_KEY` and POSTs it. Pass amount in **naira** (the webhook converts to kobo internally).

```bash
node scripts/simulateWebhook.js --va 9988800001 --amount 10000
```

Expected response: `HTTP 200 { "success": true }`. The user is now `isActive: true`. Re-running the same command returns `{ "success": true, "duplicate": true }` (idempotency on `transaction_reference`).

### 5) Check the wallet — should show ₦10,000

```bash
curl $BASE/users/me/wallet -H "Authorization: Bearer $TOKEN"
```

`balance: 1000000` (kobo), `isActive: true`.

### 6) Check withdrawable

```bash
curl $BASE/users/me/withdrawable -H "Authorization: Bearer $TOKEN"
```

For a `trader` (medium tier, ₦750/wk):
`walletBalance: 1000000, reserved: 75000, withdrawableAmount: 925000`

The `reserved` amount = this week's premium (₦500 low / ₦750 medium / ₦1,000 high), only reserved if the user hasn't burned yet this week.

### 7) Trigger the weekly premium burn for this user

```bash
USER_ID=$(curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN" | grep -oE '"id":"[a-f0-9]+"' | head -1 | cut -d'"' -f4)

curl -X POST $BASE/admin/jobs/run-premium-burn \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d "{\"userId\":\"$USER_ID\"}"
```

Expected: `burned: 1, totalPool: 67500, totalPlatform: 7500, newBalance: 925000` (for medium tier).
The 90/10 split goes to the pool / platform; the user wallet drops by the premium.

Re-running it within the same week: `skipped: "burned within last 6 days"` (idempotent).

### 8) Inspect the transaction history

```bash
curl $BASE/users/me/transactions -H "Authorization: Bearer $TOKEN"
```

Items (newest-first), each with `balanceAfter`:
```
- type:"debit",  category:"premium_burn", amount:75000,   balanceAfter:925000
- type:"credit", category:"funding",      amount:1000000, balanceAfter:1000000
```

### 9) Submit a claim (immediately — expect cooldown rejection)

Hospital looks up the patient and gets a 4h preAuth code:

```bash
curl "$BASE/hospital/users/lookup?phone=08098800350" \
  -H "x-hospital-api-key: $HOSPITAL_KEY"
```

Save `data.preAuthCode`. Submit the claim (amount in kobo — ₦1,500 = 150000):

```bash
curl -X POST $BASE/hospital/claims \
  -H "Content-Type: application/json" \
  -H "x-hospital-api-key: $HOSPITAL_KEY" \
  -d '{
    "phone":"08098800350",
    "amount":150000,
    "treatmentType":"malaria",
    "clinicalNote":"Fever, positive RDT",
    "preAuthCode":"AB12CD"
  }'
```

Expected: `status: "rejected"`, `auditorChecks.cooldownOk: false`, `weekOneCapApplied: true`, `effectiveLimit: 500000`.
The auditor enforces a **72-hour cooldown** after the first premium burn, and a **₦5,000 cap** for the first 7 days.

### 10) Backdate `firstPremiumAt` to test a real claim

```bash
node -e "require('./src/config/env');const m=require('mongoose');const U=require('./src/models/User');\
m.connect(process.env.MONGODB_URI).then(async()=>{\
  await U.updateOne({phone:'08098800350'},\
    {firstPremiumAt:new Date(Date.now()-8*24*60*60*1000)});\
  await m.disconnect();}).then(()=>console.log('backdated'));"
```

Re-run step 9 — you should get `decision: "approved"`. (In Squad sandbox the actual transfer call usually returns "Merchant not profiled for this service" — the claim will sit at `status: approved, squadTransferStatus: failed`, with no pool debit / coverage decrement. A reconciliation worker will retry; see TODO in `hospital.controller.js`.)

### 11) Withdraw ₦9,000 (with built-in reversal safety)

```bash
curl -X POST $BASE/users/me/withdraw \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "amount":900000, "bankCode":"000013", "accountNumber":"0123456789" }'
```

The flow is: verify destination via Squad → debit wallet → initiate Squad transfer → on failure, **immediately credit back** with category `reversal`. The ledger will show the debit + matched reversal pair if the transfer fails.

### 12) Run the hospital anomaly scan

```bash
curl -X POST $BASE/admin/jobs/run-hospital-anomaly-scan \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" -d '{}'
```

Hospitals with <3 days of history are skipped (false-positive guard). When a hospital's last-24h activity exceeds 3× its 7-day daily average (either claim count OR payout sum), it's flagged. Flag is cleared via `POST /admin/hospitals/:id/clear-flag`.

---

## Background jobs (BullMQ, Africa/Lagos cron)

When `REDIS_URL` is set, three repeatable jobs run automatically:

| Job | Cron | What it does |
| --- | --- | --- |
| `premiumBurn` | `0 9 * * 1` (Monday 09:00) | Debits weeklyPremium from each active user; splits 90/10 into pool / platform; pauses users with insufficient balance. Idempotent — skips users burned within last 6 days. |
| `coverageReset` | `30 0 * * *` (daily 00:30) | Resets `coverageRemaining = coverageLimit` for users past their personal 30-day reset date. |
| `hospitalAnomalyScan` | `0 1 * * *` (daily 01:00) | Flags hospitals whose 24h activity > 3× 7-day daily average. Does not block payouts. |

If Redis is unavailable, the scheduler logs a warning at boot and the rest of the API keeps running. Use the admin manual-trigger endpoints to run jobs on demand.

---

## Fraud + safety guards

- **HMAC SHA-512** on every Squad webhook — rejected with 401 if missing/wrong.
- **Idempotency** on webhooks: any repeat with the same `transaction_reference` is a no-op.
- **Atomic wallet ops:** every credit/debit is a single `findOneAndUpdate` with `$inc` + `$push`. `balanceAfter` is recorded on each ledger entry.
- **Pay-to-activate:** users register inactive; the funding webhook flips them active once balance ≥ weeklyPremium.
- **Auditor:**
  - hospital must be `isVerified && isActive`
  - 24h duplicate window per (user, hospital)
  - 72h cooldown after first premium burn
  - ₦5,000 week-1 cap on covered amount
  - soft flag if a single claim > 80% of `coverageLimit`
- **Pre-auth code:** 6-char code, 4h expiry, single-use, generated at hospital lookup. Claim submission without a fresh code returns 401.
- **Withdrawal reversal:** if Squad transfer fails AFTER the wallet debit, an immediate `reversal` credit restores the balance.
- **Pool-float guard:** if PoolWallet balance is too low to cover a claim, the claim is flagged for ops (not auto-paid).
- **Hospital anomaly scan** raises a `flagged` boolean on hospitals with suspicious daily spikes — purely informational, doesn't block payouts.

---

## Known sandbox limitations

The Squad sandbox key returned by their dashboard may not be profiled for `/payout/account/lookup` or `/payout/transfer` (you'll see `"Merchant not eligible to use this endpoint"` / `"Merchant not profiled for this service"`).

- Hospital registration: `isVerified` will be `false`. Force-verify in the DB for testing — see Step 1 note.
- Approved claims: `status: approved`, `squadTransferStatus: failed`. The pool/coverage are NOT debited (designed reconciliation path — a worker will requery).
- Withdraw: same — the destination lookup will fail before the wallet is debited, so no money moves.

The reversal path in step 11 was verified end-to-end via a stubbed Squad client.

---

## Notes on monetary units

- Internal storage: **kobo** everywhere (`coverageLimit`, `wallet.balance`, `claim.amount`, etc.).
- Squad webhook payloads: **naira**. Converted to kobo in `webhook.controller.js`.
- Squad transfer `amount`: **kobo** (sent as a string).
- API responses: **kobo**. Frontend formats to naira for display.

So when you see `"balance": 1000000` and `"weeklyPremium": 75000` in API responses, that's **₦10,000** and **₦750**.
