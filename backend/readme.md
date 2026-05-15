# BetaHealth — Backend

Micro health cover for Nigeria's informal sector. Users pay weekly premiums into a Squad virtual account; when they get sick at a partner clinic the claim is audited and the hospital is paid instantly via Squad Transfer.

## Stack

Node.js 20, Express 4, MongoDB (Mongoose), Redis + BullMQ for crons, JWT auth, Joi validation, Pino logging, Twilio (optional) for SMS. Money is stored in **kobo** everywhere (₦1 = 100 kobo); Squad webhooks send naira and the boundary converts.

## Setup

```bash
git clone <repo>
cd backend
cp .env.example .env       # fill in MONGODB_URI, JWT_SECRET, SQUAD_SECRET_KEY at minimum
npm install
npm run dev                # or: npm start
```

Required: `MONGODB_URI`, `JWT_SECRET`, `SQUAD_SECRET_KEY`. Optional: `REDIS_URL` (enables cron jobs), `TWILIO_*` (enables SMS), `ADMIN_KEY` (defaults to `local_dev_admin_key_change_me`).

## Squad integration

Four endpoints, all from `https://sandbox-api-d.squadco.com` (override via `SQUAD_BASE_URL`):

- `POST /virtual-account` — provision a user's virtual account
- Inbound webhook to `/api/v1/webhooks/squad` — HMAC SHA-512 verified
- `POST /payout/account/lookup` — verify hospital/withdrawal destination
- `POST /payout/transfer` — settle claims and process withdrawals

## API docs

Swagger UI: **http://localhost:4000/api/v1/docs**
Raw OpenAPI JSON: `http://localhost:4000/api/v1/docs.json`

Click the **Authorize** button at the top of the docs to paste the three auth tokens (Bearer JWT, hospital API key, admin key) once — they persist across all "Try it out" calls.

## Demo seed

`npm run seed:demo` resets the database to a known state for a live demo:

- A verified hospital `BetaHealth Demo Clinic` and its `apiKey`
- Pool float of ₦500,000
- **User A** — mature: ₦10,000 wallet, past 72h cooldown, ready to claim
- **User B** — fresh: ₦500 wallet, inside 72h cooldown (proves rejection)
- **User C** — zero balance: inactive (proves pay-to-activate when funded live on stage)

The script prints every credential at the end. Password for all demo users is `demo1234`. Refuses to run with `NODE_ENV=production`.

## Demo runbook

Pre-flight: `npm run seed:demo`, then `npm run dev`. Open Swagger and click Authorize.

1. **Health** — `GET /health` shows mongo/redis/squad/twilio status.
2. **Show pay-to-activate** — login as User C (`demo-c@betahealth.test` / `demo1234`), call `GET /users/me/wallet` → `balance: 0, isActive: false`.
3. **Fund User C live** — `node scripts/simulateWebhook.js --va 9988800030 --amount 1000` (or POST to `/webhooks/squad` from Swagger with a signed body). User C flips to active; check `GET /notifications` → `funding_received` + `cover_activated` entries.
4. **Premium burn** — `POST /admin/jobs/run-premium-burn` (admin key) → User A burns ₦500, pool +₦450, platform +₦50. Notification fires.
5. **Mature claim (User A)** — `GET /hospital/users/lookup?phone=08099000010` (hospital key) to get a preAuthCode, then `POST /hospital/claims` with `amount: 150000`. Decision `paid`, pool debited, coverage decremented, `claim_approved` notification.
6. **Cooldown rejection (User B)** — same flow with phone `08099000020` → decision `rejected`, `cooldownOk: false`, `weekOneCapApplied: true`, `claim_rejected` notification.
7. **Withdrawal** — login as User A, `GET /users/me/withdrawable` then `POST /users/me/withdraw` with `amount: 800000`. If Squad transfer fails the wallet is auto-refunded (`reversal` ledger entry, `withdrawal_failed` notification).
8. **Fraud scan** — `POST /admin/jobs/run-hospital-anomaly-scan` returns the scan summary; hospitals younger than 3 days are skipped to avoid false positives.

Full lifecycle in ~3 minutes. Every step also shows up in `GET /notifications`.

## Architecture

- `src/models/` — Mongoose schemas (User, Wallet, PoolWallet, Hospital, Claim, Notification).
- `src/services/` — Squad client, claim auditor, fee split, SMS, notification orchestrator.
- `src/jobs/` — BullMQ jobs: weekly premium burn (Mon 09:00 Africa/Lagos), daily coverage reset (00:30), daily hospital anomaly scan (01:00). All have admin endpoints for manual trigger.
- `src/controllers/` + `src/routes/` — auth, user, hospital, webhook, admin, notifications.
- `src/middleware/` — JWT, hospital API key, admin key, request validation, error handler.
- `src/docs/openapi.js` — hand-authored OpenAPI 3.0 spec served by swagger-ui-express.

For business rules and decisions (90/10 split, 72h cooldown, week-1 ₦5k cap, pay-to-activate, anomaly thresholds) see the PRD.

## License

MIT — see [LICENSE](LICENSE).
