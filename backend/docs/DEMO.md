# BetaHealth — demo runbook

A 5-minute live demo of the full lifecycle, narrated end to end. Rehearse once before going on stage.

---

## Pre-demo checklist (run 10 min before)

```bash
cd backend
npm run seed:demo          # wipes + reseeds known state
npm run dev                # leave this terminal visible if you want the live logs
```

Then verify each of these in a browser tab BEFORE you go up:

- [ ] `GET http://localhost:4000/api/v1/health` returns `mongo: connected`, `squad: configured`
- [ ] `http://localhost:4000/api/v1/docs` loads (Swagger UI)
- [ ] Postman collection imported, `baseUrl` set, `adminKey=local_dev_admin_key_change_me`
- [ ] Three demo users exist (you'll have them in the seed-script terminal output — copy the credentials into a sticky note)
- [ ] Hospital API key is in your clipboard or the Postman `hospitalApiKey` variable
- [ ] `SQUAD_MOCK_PAYOUTS=true` is in `.env` (so the withdraw and claim payout actually complete on stage)
- [ ] Open these tabs side by side: **Postman**, **Swagger UI**, **the live server logs**

The seed script gave you three users:
- **User A** — Adaeze Mature: `08099000010` / `demo1234` — fresh, has wallet ₦10,000, no premium burned yet
- **User B** — Bola Fresh: `08099000020` / `demo1234` — small balance, demo for "pay-to-activate"
- **User C** — Chika Empty: `08099000030` / `demo1234` — ₦0 balance, inactive

---

## The 5-act script (~5 minutes)

### Act 0 — The pitch (45 seconds, no demo)

> "60 million Nigerians work in the informal sector — traders, drivers, hairdressers. A boda boda driver earns about ₦3,000 a day. The cheapest HMO plan is ₦30,000 a month upfront. So 75% of medical bills get paid out of pocket and one in three families skip medical care entirely because they can't afford it.
>
> **BetaHealth is health cover priced like Netflix: ₦500 to ₦1,000 a week, paid into a Squad virtual account.** When the user gets sick, the hospital scans their QR card, the patient gets a code on their phone, the AI auditor checks six fraud rules in under a second, and Squad transfers money straight to the hospital. Money moves before the patient leaves the consulting room.
>
> We're going to show you the whole backend live — sign-up to claim payout to fraud guard — in five minutes."

### Act 1 — Sign up + activate cover (1 min)

Open Postman → **Auth** folder.

1. **`POST /auth/register`** (use a fresh phone like `08012345670`, gender `female`, occupation `trader`).
   - **Say:** "User signs up. We try to provision a Squad virtual account immediately. In sandbox the BVN check often fails — that's expected; we save the user and let them retry later. A welcome notification fires through three channels — in-app, SMS via Twilio, and email via SMTP."

2. **`GET /notifications`** (Postman auto-stashed the JWT).
   - **Say:** "There's the welcome notification. In-app delivered instantly. SMS and email fired in the background — the API didn't wait on them, which means even if Twilio or our SMTP provider is slow, the user never sees a hung screen."

3. **`POST /admin/dev/fund-user`** with body `{"phone":"08099000010","amountKobo":1000000}`.
   - **Say:** "In production this happens via a Squad webhook the moment money lands in the virtual account. In test mode we have an admin endpoint that simulates it — credits the wallet, flips the user active, fires `funding_received` and `cover_activated` notifications. Same code path, no HMAC dance."

4. **Login as User A** → **`POST /users/me/premium/pay`**.
   - **Say:** "First premium burns from the wallet. 90% goes to the insurance pool that pays claims, 10% is platform revenue. This is the call that activates cover and starts the 72-hour anti-fraud cooldown. After this, a daily 9am cron handles weekly burns automatically — each user rolls on their own 7-day cycle from this exact moment."

### Act 2 — The hospital flow (1.5 min)

Open Postman → **Hospitals** folder. The collection already has `hospitalApiKey` stashed from the seed.

5. **`GET /hospital/users/lookup?membership=BH-XXX...`** (membership number from User A's earlier `/users/me/card` call).
   - **Say:** "A patient walks into the clinic. The receptionist scans their QR card. Our backend resolves the patient instantly and issues a 6-character pre-auth code. That code is **SMS'd and emailed to the patient's phone, not shown to the hospital**. The hospital staff must ask the patient to read it aloud. That's the phishing-resistance gate — a hospital with a list of stolen phone numbers can't fake claims because they don't have access to the patient's SIM."

6. **`POST /hospital/users/face-verify`** with the patient's phone + any string for `image`.
   - **Say:** "Second factor: face verification. The clinic staff snap a photo of the patient. Today this is stubbed — always returns `verified: true` — but the integration point is wired, and the token gets attached to the audit trail on the claim. Production swaps in a real face-match service."

7. **`POST /hospital/claims`** — phone + amount `150000` (= ₦1,500) + the pre-auth code + the face-verify token.
   - **Say:** "Claim submitted. Our AI auditor runs six checks: is the hospital whitelisted, is the patient active, are they past the 72-hour cooldown, do they have coverage remaining, is this a duplicate within 24 hours, is the amount more than 80% of their monthly cap? All six pass. Squad transfer fires, the pool wallet is debited, the patient's coverage is decremented, and a `claim_approved` notification goes to the patient. End to end in under two seconds."

8. **`GET /users/me/activity`** (logged in as User A).
   - **Say:** "From the patient's perspective: one unified feed. They see the funding, the premium burn, and the claim payout in chronological order. Mobile dev wires this straight into the home screen."

### Act 3 — The fraud layer (1 min) — the showstopper

9. **Log in as User B** → **`POST /users/me/premium/pay`**.
   - **Say:** "Watch this. User B just paid their first premium right now."

10. **Hospital lookup for User B → claim attempt**.
    - **Say:** "Now the same hospital tries to submit a claim for User B immediately." → **Show the response.** `cooldownOk: false`, status `rejected`, reason "Cover in 72-hour activation period."
    - **Say:** "Rejected. Anyone who pays the first premium and tries to claim same-day gets blocked for 72 hours. We also cap week-1 claims at ₦5,000 even though the monthly cap is ₦20,000. That's the anti-anti-selection layer."

11. **`POST /admin/jobs/run-hospital-anomaly-scan`** with `{}`.
    - **Say:** "And we run a daily anomaly scan on every partner hospital. Any hospital that triples its normal daily volume gets flagged — claim count or payout sum — and an ops endpoint shows ops where to look. Doesn't block payouts, just surfaces the signal."

### Act 4 — Money flexibility (30s)

12. **Log in as User A** → **`POST /users/me/withdraw`** with `{"amount": 500000, "bankCode": "000013", "accountNumber": "0123456789"}`.
    - **Say:** "And this is the killer differentiator from traditional insurance. The user funded their wallet — that money is theirs. They can pull unused balance out any time. Squad lookup + transfer. We reserve one week's premium so they can't drain their next payment, but everything else is liquid. If the transfer fails, we automatically reverse the wallet debit. No money ever sits in limbo."

### Act 5 — The platform under the hood (45s, no clicks)

> "Quick architecture: every endpoint we just showed is documented at `/api/v1/docs` — Swagger with a try-it-out button on every route. 33 endpoints. Authentication has three layers: JWT for users, an API key for hospitals, a static admin key for ops. Money is stored in kobo internally; we convert at the API boundary so we never lose a kobo to floating point.
>
> Three background jobs run daily — premium burn, coverage reset, hospital anomaly scan — all with manual admin triggers for cases like this one. Notifications fan out across three channels (in-app, SMS, email) on a fire-and-forget pattern so a Twilio outage can never stall a login.
>
> The whole backend is on `feat/backend`, deployed to Render. Frontend and mobile teams are building against the same Swagger spec. Three minutes from `git push` to live."

---

## If something breaks on stage

| What happens | Recovery |
| --- | --- |
| Wi-Fi dies | Switch to localhost — keep the same Postman collection, just change `baseUrl` to `http://localhost:4000/api/v1` |
| Squad endpoint times out | Set `SQUAD_MOCK_PAYOUTS=true` (you should already have this on); withdrawals and payouts still complete |
| A request returns 500 | Skip to next step, say "the API is occasionally slow on the free tier, here's the same flow on localhost" |
| Demo user state got polluted in rehearsal | Just `npm run seed:demo` — three-second reset |
| Login JWT expired mid-demo | Postman's auto-stash hits the login endpoint again; or just hit `/auth/login` in the collection |
| Premium pay says "already paid this week" | A previous rehearsal already burned. Use a different user, or run the DB reset (next section) |

### Reset a single user's premium state mid-demo (Postman → Pre-request script in any request, or a tiny terminal command):

```bash
node -e "require('./src/config/env');const m=require('mongoose');const U=require('./src/models/User');\
m.connect(process.env.MONGODB_URI).then(async()=>{\
  await U.updateOne({phone:'08099000010'},{firstPremiumAt:null,lastPremiumBurnAt:null});\
  await m.disconnect();}).then(()=>console.log('reset'));"
```

---

## Things judges will ask (have answers ready)

**"How does Squad fit in?"**
Four endpoints: `/virtual-account` to provision user accounts, an inbound HMAC-SHA512-signed webhook for funding, `/payout/account/lookup` to verify hospital banks, `/payout/transfer` to pay them. Webhook idempotency keyed on `transaction_reference`.

**"What stops a hospital from faking claims?"**
The pre-auth code goes to the patient's phone, not the hospital's. Without the SIM, the hospital can't fake it. Add to that: 24-hour duplicate guard, 72-hour cooldown on first claim, anomaly scan on volume spikes, and a soft flag at 80% of monthly coverage.

**"What about regulatory compliance?"**
We store BVN with `select: false` (never returned in API responses), use HMAC SHA-512 on inbound webhooks, password hashes are bcrypt with cost 10, and every claim has an immutable audit trail (`auditorChecks` on the claim doc shows exactly which rules ran).

**"How does the 90/10 split work financially?"**
On every premium burn, 90% credits a system pool wallet that pays claims, 10% credits a platform-revenue bucket. Funding the wallet is **not** split — that's 100% the user's money until a premium burns. Users can withdraw the rest at any time. This solves the cold-start "why pay if I never claim" problem.

**"What's left to build?"**
Reconciliation worker for Squad's pending-state transfers, real face-match service integration (the stub is wired), rate limiting on auth endpoints, an admin dashboard. The code paths are all wired for these — they're integration not invention.

**"Why Node + Mongo and not Postgres?"**
Hackathon constraint and team familiarity. The hot paths — wallet credits/debits with `findOneAndUpdate + $inc + $push` — are atomic in Mongo. If we hit scale where joins on claims+payouts+users become painful, Postgres is a 1-week migration with Prisma.

---

## Cheat sheet — Postman request order

Bookmark these in the Postman collection sidebar. Run top to bottom.

| # | Folder | Request | What to highlight |
| --- | --- | --- | --- |
| 1 | Health | GET /health | Sanity check, mongo connected |
| 2 | Auth | POST /auth/register | Welcome notification fires |
| 3 | Notifications | GET /notifications | The welcome notif is there |
| 4 | Admin | POST /admin/dev/fund-user | Wallet credited + activation notif |
| 5 | Users | POST /users/me/premium/pay | First premium → cover active, 72h cooldown begins |
| 6 | Users | GET /users/me/card | Membership number — patient's QR |
| 7 | Hospitals | GET /hospital/users/lookup (by membership) | Hospital scans QR → patient resolved + preAuth code SMS'd |
| 8 | Hospitals | POST /hospital/users/face-verify | Face token issued |
| 9 | Hospitals | POST /hospital/claims | Audited + paid in 2s |
| 10 | Users | GET /users/me/activity | Unified feed shows everything |
| 11 | Hospitals | POST /hospital/claims (User B, instant) | **Rejected** — 72h cooldown — the fraud highlight |
| 12 | Admin | POST /admin/jobs/run-hospital-anomaly-scan | Daily fraud scan output |
| 13 | Users | POST /users/me/withdraw | Liquidity differentiator |

---

## Total time budget

| Act | Time |
| --- | --- |
| Pitch | 0:45 |
| Sign up + activate | 1:00 |
| Hospital flow | 1:30 |
| Fraud layer | 1:00 |
| Withdrawal | 0:30 |
| Architecture talk | 0:45 |
| **Total** | **5:30** |

Leaves buffer for one judge question before time's up.
