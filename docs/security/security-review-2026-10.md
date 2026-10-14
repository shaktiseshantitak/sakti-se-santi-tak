# Security review — October 2026

Scope: server (`server/index.ts`, Netlify functions), all Supabase tables/policies (`supabase/`),
frontend code, deploy headers, dependencies, committed secrets.

## Fixed in this release
| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | `proxy-addr` (IP spoofing) and `source-map-js` (DoS) advisories | Critical / High | Lockfile bumped to 2.0.8 / 1.2.2; `npm audit` = 0. Stale `bun.lock` removed so `package-lock.json` is the only source of truth |
| 2 | Any logged-in user could insert a review with `is_approved=true` / `is_verified=true` straight through the API, skipping moderation | Medium | Migration `025` — policy now requires unapproved/unverified for non-admins |
| 3 | Any logged-in user could insert an affiliate withdrawal with `status='APPROVED'` | Medium | Migration `025` — policy now requires `PENDING` for non-admins |
| 4 | New payment-status endpoint shared the strict per-IP payment limiter (shoppers behind one mobile IP could block each other) | Medium | Own per-customer limiter (40 / 10 min); gentler client polling |
| 6 | Payment verify reported "already cancelled" for orders that Razorpay's webhook had already marked Paid (webhook beat the browser) | High (UX / support load) | `/api/payment/verify` is now idempotent: accepts an order that is Paid, not Cancelled, and recorded against the same signature-verified payment id; a truly cancelled order or a different payment id is still rejected. Covered by 5 new test cases |
| 5 | Coupon could exceed 100% / exceed cart value | Medium (revenue) | Clamped on server and in cart |

| 7 | Book save/update/delete updated the screen first and ignored database refusals, so a book could look added but never go live; discount % was unguarded (bad MRP -> value the DB rejects) | Medium (data integrity) | Writes now wait for the database and roll back on failure with a visible error; discount clamped 0-100; form validates prices. Migration `026` adds the missing detail columns (additive, covered by existing RLS) |

## Verified OK (no change needed)
- Every one of the 35 tables has RLS enabled; no write policy is `USING (true)`; `orders`, `payments`,
  `payment_events`, MFA and rate-limit tables have no client write path at all.
- `profiles` has no role/privilege columns; roles live in `user_roles` with no self-insert policy.
- Prices, coupons, shipping and totals are recomputed on the server; client totals are never trusted.
- Razorpay signature and webhook checks use timing-safe comparison; payment amount/currency/order id are re-verified.
- Admin endpoints require a verified admin; uploads are admin-only, magic-byte checked, size-capped, with safe object keys.
- No stack traces / error internals returned to clients; no string-built query filters; no `dangerouslySetInnerHTML`/`eval`.
- No secrets in the repo (only `.env.example` placeholders); service-role and Razorpay secrets are server-only.
- Headers: HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy present.

## Needs the owner's action (cannot be done from code)
1. **Run migrations `025` and `026`** (and 021–024 if not yet run) in the Supabase SQL editor, in numeric order.
2. **Admin MFA enforcement is OFF by default** (`admin_mfa_config.enforced = false`). After confirming you can log in
   with the email OTP, run: `UPDATE public.admin_mfa_config SET enforced = true;`
3. **Content-Security-Policy is report-only**, so it does not block anything yet. After browsing checkout, admin and
   video pages with the browser console open and seeing no violations, change `Content-Security-Policy-Report-Only`
   to `Content-Security-Policy` in `netlify.toml`, `public/_headers` and `server/index.ts`.
4. Netlify env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
   set; never prefix a secret with `VITE_`.

## Known low-risk items (accepted)
- `coupons` rows that are active are publicly readable (the cart previews discounts in the browser), so codes can be listed.
  Order totals are still decided only by the server.
- `contact_messages` and `affiliate_clicks` accept public inserts (spam only); both sit behind the API rate limits.
- Affiliate accounts are created as `active` by the app by design (no approval step).
