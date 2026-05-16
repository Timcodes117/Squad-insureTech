# BetaHealth — Admin Dashboard

Operations console for the BetaHealth backend. Next.js 16 (App Router) + Tailwind v4 + TypeScript.

Points at the live API by default: `https://betahealth-api.onrender.com/api/v1`. Override locally by setting `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.

## Pages

| Route | Purpose |
| --- | --- |
| `/login` | Admin enters the `ADMIN_KEY` from the backend `.env`. Stored in `localStorage` and attached as `x-admin-key` on every request. |
| `/dashboard` | Overview — pool balance, platform revenue, user counts, hospital counts, claim breakdown. |
| `/hospitals` | List + filter (all / flagged / unverified). Inline **Verify** and **Clear flag** actions. |
| `/claims` | List + status filter (paid / approved / flagged / rejected). Inline **Approve & pay** on flagged claims. |
| `/jobs` | Manual triggers for the three workers: premium burn, coverage reset, hospital anomaly scan. JSON output panel + history. |

## Setup

```bash
cd dashboard
npm install
npm run dev          # http://localhost:3000
```

Optional `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

## Auth model

There's no admin user record yet — the dashboard authenticates by holding the static `ADMIN_KEY` and attaching it to every request. The login screen validates the key by hitting `GET /admin/stats` before persisting it.

For production: rotate `ADMIN_KEY` to something strong, set it in your Render env vars, and only share it with people who need ops access. Logging out clears `localStorage` and that's the only place the key lives.

## Deploy

The dashboard is a standard Next.js app. Easiest target is Vercel:
1. Import the repo in Vercel
2. Set root directory to `dashboard`
3. Add env var `NEXT_PUBLIC_API_BASE_URL=https://betahealth-api.onrender.com/api/v1`
4. Deploy

It will also run on Render (`Static Site` for static export, or a Node web service for SSR). For SSR on Render, set build to `npm install && npm run build`, start to `npm start`, and the same env var.

## Backend endpoints used

All under `/api/v1/admin/*`, all gated by `x-admin-key`:

- `GET /admin/stats` — overview tiles
- `GET /admin/pool` — pool + ledger
- `GET /admin/hospitals?flagged=&verified=&page=&limit=`
- `GET /admin/claims?status=&page=&limit=`
- `GET /admin/users?search=&page=&limit=`
- `POST /admin/hospitals/:id/verify`
- `POST /admin/hospitals/:id/clear-flag`
- `POST /admin/claims/:id/approve`
- `POST /admin/jobs/run-premium-burn`
- `POST /admin/jobs/run-coverage-reset`
- `POST /admin/jobs/run-hospital-anomaly-scan`
