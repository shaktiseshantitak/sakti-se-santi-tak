# SECURITY_FIX_STATUS.md — result of SHAKTI_SECURITY_FIX_PROMPTS.md

Every item (1–11) below was verified against the real code first, then fixed,
then covered by an automated behavioural test (103 checks, all passing) run
against the actual `server.ts` with a fake Supabase/R2 backend. `tsc --noEmit`
and `npm run build` both pass. `npm audit` (prod deps): **0 vulnerabilities**
(was 3 moderate, in the `qs`/`body-parser`/`express` chain — patched with
`npm audit fix`, no code changes needed).

Per the prompt file's own rules, items marked **LIVE VERIFICATION NEEDED**
are *not* claimed as fixed or proven — they require someone with access to
the real Supabase/Netlify/Razorpay/R2 accounts.

## P0

**1. Admin MFA enforced server-side** — Fixed.
The email-OTP step used to be a browser-only `sessionStorage` flag; the
server and RLS never checked it, so the password alone was enough. Now:
- `POST /api/admin/mfa/send` / `/verify` do the real OTP round-trip
  server-side, and only for a session that came from password sign-in (so a
  session minted from the OTP alone can't self-promote).
- A verified pass is recorded in `admin_mfa_sessions` (migration 024), keyed
  to the exact user **and** Supabase session — refreshing the OTP screen or
  editing browser storage does nothing.
- Every sensitive admin route (`update-order-status`, `backup-now`,
  `audit-log`, `media/upload`) now goes through `requireAdmin()`, which
  checks role + (once enforced) MFA.
- `public.is_admin()` (migration 024) applies the same rule, so direct
  browser→Supabase writes are covered too, not just the Express routes.
- **Rollout is staged and reversible**: `admin_mfa_config.enforced` starts
  `false`. Run migration 024 → deploy → log in once and complete the OTP →
  confirm it works → then `UPDATE admin_mfa_config SET enforced = true;`. If
  anyone is ever locked out, the same table has the emergency off-switch.
  Full steps are in the migration file's header comment.

**2. Rate limiting keyed on a trusted client identity** — Fixed.
`x-forwarded-for` was attacker-controlled — rotating it on every request gave
a fresh bucket and defeated every limiter. Now IP is read from
`x-nf-client-connection-ip` **only when running on Netlify** (that header is
set by Netlify's edge, not the client), or from `req.ip` only if
`TRUSTED_PROXY_HOPS` is explicitly configured, or from the raw socket
otherwise. Confirmed with a test that spoofed X-Forwarded-For no longer
bypasses the login/tracking limiters. **LIVE VERIFICATION NEEDED**: whether
Netlify really overwrites that header for this site's function setup is a
live-environment fact, not something provable from the repo — see the
verification checklist at the bottom.

## P1

**3. Guest order tracking reduced to a minimal response** — Fixed.
Guests (and any signed-in user who isn't the order's owner) now get only
`{ reference (masked), order_status, courier, tracking_number, ETA, status
timeline }` — no address, phone, email, price, payment method/status, or
admin notes. The owner (and a verified admin) still gets the full order.
Wrong tracking number, wrong contact, missing contact, and a nonexistent
order all return the exact same 404 body, so the endpoint can't be used to
learn which orders exist. Covered by tests, including that admin access
without MFA is refused the same as a stranger.

**4. Live RLS / migrations 018–023** — **LIVE VERIFICATION NEEDED** (by
design — this can't be done from a repo). What's addressed in code:
narrowed `audit_logs` (`INSERT`/`UPDATE`/`DELETE` revoked from
anon/authenticated; server writes via service role only; rows immutable and
kept 365 days minimum — migration 024) and `affiliate_accounts` (removed the
self-service `UPDATE` policy that let a user edit their own
status/referral_code — migration 022 already had this, confirmed still
correct). You (or Radha) still need to run migrations 018–024 against the
live project in order and run the negative RLS tests described in the
prompt (a plain customer token must fail to write audit_logs, affiliate
status, books, orders, payments). A ready-to-paste read-only verification
script isn't included here since it needs live credentials to run.

**5. Razorpay amount/currency/capture/ownership validated** — Fixed, in both
places money can be marked paid:
- `POST /api/payment/verify`: after the signature check, the payment is
  fetched **from Razorpay directly** (not trusted from the client) and
  compared against the local order — same gateway order id, `INR`, exact
  paise amount, `status: 'captured'`, `amount_refunded: 0`. Any mismatch is
  logged, audited, and refused (409) **without cancelling the order** —
  since real money may have moved, that needs a human, not an auto-cancel.
- The webhook handler was largely rebuilt: idempotency used to key on a
  field Razorpay doesn't send (`event.event_id`) or on
  `${event}_${Date.now()}` (unique every time, so duplicates were never
  actually caught) — now it uses Razorpay's `x-razorpay-event-id` header
  (or a hash of the raw body as fallback), claimed atomically via a unique
  constraint so concurrent deliveries can't double-process. The captured
  payment gets the same cross-check as `/verify` before `mark_order_paid_atomic`
  runs, which only transitions orders still in `Awaiting Payment` — a
  replayed/late webhook for an already-processed or cancelled order is a
  no-op (a late-payment-on-cancelled-order case is flagged for manual
  refund review instead of silently dropped). 20 payment scenarios covered
  by tests (happy path, tampered amount/currency/order-id/refund status,
  authorized-not-captured, gateway unreachable, bad/wrong-secret signature,
  cross-user verify, double-verify, cancelled-order resurrection, duplicate
  webhook with and without the event-id header, transient-failure retry).

**6. Uploaded file bytes validated, not declared MIME type** — Fixed. The
client's `fileType` and file name are now ignored entirely; the real type is
read from the file's magic bytes (JPEG/PNG/GIF/WebP/PDF/WAV/OGG/MP3/AAC/M4A)
and anything that doesn't match — SVG, HTML, a renamed .exe, a PNG with a
`<script>` tail, an HTML file with a `%PDF-` header pasted in the middle —
is rejected before it ever reaches storage. The stored object key, extension
and Content-Type all come from the server's detection, never the client.
Tested with 8 valid formats and 6 attack payloads.

**7. Global 50 MB JSON body removed** — Fixed. Every ordinary route now has
a 100 KB JSON limit; the larger limit needed for base64 file uploads applies
**only** to `/api/media/upload`, and only after `requireAdmin()` has already
authenticated and authorized the caller — so an anonymous request with a
huge body is rejected at the auth check before the large parser ever runs.
Upload concurrency is also capped (2 at a time server-wide) so even a
legitimate admin can't exhaust memory with parallel uploads. Verified an
anonymous 20 MB upload attempt gets a fast 401, not a parse attempt.

## P2

**8. Unsafe RLS SQL removed from the deployment guide** — Fixed. The old
example (`FOR ALL USING (auth.role() = 'authenticated')`, i.e. any logged-in
customer could write the catalog) is replaced with the real `is_admin()`
pattern and a pointer to the canonical policies in `supabase_schema.sql` /
`migrations/`, plus the negative-test steps from item 4.

**9. Netlify CSP made explicit and consistent** — Fixed, and deliberately
**report-only** for now. The same policy string is defined in three places
that must be kept in sync — `server.ts` (only applies when this server
serves HTML directly, e.g. local/standalone mode; on Netlify itself the CDN
serves the HTML, not this Express app), `netlify.toml`, and
`public/_headers` — covering the actual external origins this codebase uses
(Razorpay checkout, Supabase, Google Fonts, GA, Facebook pixel, R2 media,
YouTube/Drive embeds). It's `Content-Security-Policy-Report-Only` rather
than enforcing: promoting it to a blocking header should only happen after
checking the browser console on checkout, admin, and video/audio pages in
the real deployed site — an enforcing CSP that's even slightly wrong could
silently break the checkout flow. API JSON responses (`/api/*`) get a
strict, always-enforced `default-src 'none'` CSP since they never load
anything.

**10. `qs` dependency chain patched** — Fixed. `npm audit fix` bumped
`express`→4.22.3 / `body-parser`→1.20.8 / `qs`→6.16.0 (all within existing
semver ranges — `package.json` itself is unchanged). `npm audit` now
reports 0 vulnerabilities.

**11. Audit logs trustworthy, backup errors not verbose** — Fixed.
- Audit rows are now written **only** by the server, from the authenticated
  request (`writeServerAuditLog`), using the real signed-in admin's id/email
  and the server-resolved IP — the browser can no longer supply or forge
  `user_id`/`ip_address`/actor email, and can no longer bulk-delete the
  table (RLS revokes `INSERT`/`UPDATE`/`DELETE` from client roles; a trigger
  makes rows immutable and undeletable for 365 days). The admin panel's
  "Clear Audit Logs" button now only clears the on-screen list — real
  records persist and reappear on reload; it's relabeled "Clear Audit View"
  so it doesn't imply it wipes the database.
- `POST /api/admin/backup-now` no longer returns `err.message` to the
  browser (could contain Apps Script/network/config detail); the client now
  gets a generic message while the real error still goes to the server log.

---

## What could NOT be verified from this repository (needs a live check)

Per the prompt's own list — do not treat these as proven either way without
checking the actual accounts:
- Whether migrations 018–024 have actually been run against the live
  Supabase project, and whether live RLS/RPC grants match this repo's intent.
- Whether Netlify's edge really overwrites `x-nf-client-connection-ip` for
  this site's specific function configuration.
- Whether the deployed API is exactly this `server.ts` (vs. an older build).
- Supabase Auth settings: MFA/AAL policy, email confirmation, session
  lifetime, refresh-token rotation, recovery flow.
- Razorpay dashboard: webhook URL/secret/subscribed events actually match
  `RAZORPAY_WEBHOOK_SECRET` in the live environment.
- R2 bucket visibility/CORS/content-type/cache behavior in the real account.
- Whether the Google Apps Script backup endpoint is the current signed
  version and rejects unsigned/replayed requests.
- Whether any production secret has ever leaked into Git history, build
  logs, the browser bundle, public storage, or a third-party log.

None of the above can be answered by reading code — they need someone with
access to the live Supabase, Netlify, Razorpay and R2 dashboards to check
directly.
