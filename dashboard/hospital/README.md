# BetaHealth Hospital Portal

Separate Next.js app for hospital staff (not the admin ops console).

## Setup

```bash
cd dashboard/hospital
npm install
cp .env.local.example .env.local   # optional
npm run dev
```

Runs on **http://localhost:3001** (admin uses 3000).

## Environment

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

## Login

Use the hospital **access code** from onboarding, or the demo **API key** from `npm run seed:demo` in the backend (`apiKey` line for BetaHealth Demo Clinic).

## Flow

1. **Login** — access code → JWT (or API key fallback)
2. **Verify patient** — QR scan (`BH-…` membership) or manual access ID → limited coverage preview
3. **Submit claim** — requires patient pre-auth code from lookup notification
4. **Claims** — history and detail for this hospital only

## Security

- No patient browsing; verify per visit only
- Session idle timeout: 10 minutes
- All API calls send `Authorization` + `x-hospital-id` when using JWT
