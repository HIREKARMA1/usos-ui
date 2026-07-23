# U.S.O.S Frontend (usos-ui)
================================

Next.js 14 + Tailwind + TypeScript UI for Unique Search of Smile.

## Features
- EN / HI / OR i18n via `content/{locale}/*.json` (no hardcoded UI copy)
- HireKarma theme tokens in `theme/theme.config.js`
- Member dashboard: genealogy, wallet, referrals, rewards, profile
- Admin panel: analytics, users, packages, rewards queue, genealogy search
- PayU hosted checkout after registration

## Setup

```bash
cd usos-ui
npm install
copy .env.example .env.local
npm run dev
```

App: http://localhost:3000

Point `NEXT_PUBLIC_API_URL` at `usos-server` (default `http://localhost:8000`).
