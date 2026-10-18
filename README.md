# Shakti Se Shanti Tak

E-commerce website for the Vedic book *Shakti Se Shanti* (शक्ति से शांति) — storefront, customer accounts,
Razorpay/COD checkout, order tracking, affiliate programme and a full Control Panel for the owner.

**Stack:** React 19 + Vite + Tailwind · Express API (deployed as a Netlify Function) · Supabase (Postgres, Auth, RLS) · Razorpay · Cloudinary

## Project structure

```
├── src/                    Frontend (React)
│   ├── pages/              One file per route (Home, Checkout, Admin, …)
│   ├── components/         Reusable UI, grouped by area (navbar, cart, home, footer, …)
│   │   └── admin/          Control Panel pieces — layout/ (sidebar, page header, section list), managers
│   ├── context/            Global state (Cart, Books/site settings, Auth, Affiliate)
│   ├── services/ lib/ utils/   API clients, integrations, security helpers
│   └── types/ data/        Shared types and seed/fallback data
├── server/index.ts         Express API — orders, payments, webhooks, admin endpoints
├── netlify/functions/      Netlify entry points (api, daily-backup, sweep-stale-orders)
├── supabase/
│   ├── schema.sql          Base schema
│   └── migrations/         Numbered SQL migrations — run in order (001 → latest)
├── docs/
│   ├── guides/             Setup & deployment guides
│   ├── security/           Security audit and fix status
│   └── internal/           Developer hand-off notes
├── public/                 Static files (manifest, robots, service worker, images)
├── tests/                  Payment security tests + Control Panel layout test
├── netlify.toml            Build, redirects, headers, scheduled functions
└── .env.example            Required environment variables
```

## Local development

```bash
cp .env.example .env     # fill in Supabase / Razorpay / Cloudinary keys
npm install
npm run dev              # starts API + Vite on http://localhost:3000
npm run lint             # TypeScript check
npm run build            # production build into dist/
npm run test:payment     # payment reconcile/verify security checks (fake Supabase/Razorpay)
npm run test:admin-layout # Control Panel sidebar/header render check
npm run test:all         # every safety test in one go (run before each release)
```

## Control Panel & maintenance guide

Owner/admin ke liye poora step-by-step guide (Hinglish): `docs/guides/CONTROL_PANEL_AUR_MAINTENANCE_GUIDE.md`

## Deployment

Hosted on Netlify. See `docs/guides/zero-to-live-deployment.md` for the complete step-by-step
(Supabase setup, Razorpay keys, domain, environment variables) and
`docs/guides/production-deployment.md` for the release checklist.

After any release that touches the database, run the new files in `supabase/migrations/` in the
Supabase SQL editor, in numeric order.
