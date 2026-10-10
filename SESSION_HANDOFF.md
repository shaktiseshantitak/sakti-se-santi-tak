# SESSION_HANDOFF.md — Shakti Se Shanti Tak (shaktiseshanti.com)

Project: React+TS+Vite / Supabase / Razorpay / Netlify e-commerce site (was
"Dharma Books Pro", rebranded). Full context below — read this before
touching anything, do not re-derive from scratch.

## LATEST STATE
Latest working zip: `shakti-se-shanti-tak-FIXED.zip` (root-level files, no
wrapper folder on unzip). `tsc --noEmit` and `npm run build` both PASS as of
last change. **This session's 3-part SEO fix (routing + dynamic sitemap +
edge-function meta tags — see top of "WHAT WAS DONE") needs ONE manual step
after deploy**: in Netlify → Site settings → Environment variables, make
sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` have the "Edge
functions" scope enabled — env vars from `netlify.toml` are never visible to
edge functions, only ones set in the Netlify UI/CLI with that scope. Without
it the new `netlify/edge-functions/seo-prerender.ts` silently falls back to
generic site-wide tags for bots (no error, no crash — just not per-page).
**Migrations up to 023 now exist** — `018` through `023` are ALL NEW
and have **NOT been run against the live Supabase database yet** (no
auto-migration mechanism; Radha runs each migration file manually in the
Supabase SQL editor, same as 001-017). **Run in numeric order, 018
through 023, all before deploying this session's code.** ⚠️ **021, 022,
and 023 are not low-risk like 018-020**:
- **021** replaces how orders/payments/stock/coupons are written —
  deploying the code without running it first breaks checkout entirely
  (calls RPCs that won't exist).
- **022** replaces `get_affiliate_dashboard`/`get_affiliate_team`/
  `record_affiliate_click` and changes `affiliate_accounts`/`audit_logs`
  RLS — run before deploying, or the affiliate portal's dashboard/team
  views will error for every affiliate.
- **023** adds the `faqs`/`testimonials`/`videos`/`events` tables — run
  before deploying, or the FAQ/Testimonials/Videos pages will show
  nothing (BUG-019's fix means an empty/missing table now shows as
  genuinely empty, not the old hardcoded demo content).

Also new: `GOOGLE_APPS_SCRIPT_SHARED_SECRET` env var is now REQUIRED for
the daily Google Sheets backup to run at all. Set it in Netlify AND paste
the exact same value into the Apps Script's `SHARED_SECRET` constant (the
updated script is in `src/lib/googleSheetsBackup.ts`'s setup comment —
the OLD deployed Apps Script must be replaced with the new version, or
every backup will be rejected as unsigned). Without both sides updated
together, backups fail with "rejected: bad signature" — expected until
both are updated, not a bug.

Test a full order end-to-end AND the affiliate portal AND FAQ/
Testimonials/Videos pages (see checklist below) before considering this
deployed.

Also new: `GOOGLE_APPS_SCRIPT_SHARED_SECRET` env var is now REQUIRED for
the daily Google Sheets backup to run at all (see BUG-031 fix, entry 0
below) — set it in Netlify AND paste the exact same value into the Apps
Script's `SHARED_SECRET` constant (the updated script is in
`src/lib/googleSheetsBackup.ts`'s setup comment). Without both sides
updated together, backups will fail with a "rejected: bad signature"
error — that's expected until both are updated, not a bug.

Test a full order end-to-end AND the affiliate portal AND FAQ/
Testimonials/Videos pages (see checklist below) before considering this
deployed.
legalPages/aboutPage/faqItems/navLabels/pageBanners/shaktiAuthorsSection
still need no migration of their own (JSONB blob), but 018/019/020 are
real schema/data changes — deploying the code without running them first
will break the Gallery admin tab + public `/gallery` page (018), and the
`/reviews` page's Write Review form will still work but keep silently
dropping business_name/city/photo/video until 019 is run (019 is
additive/nullable columns, so it fails less catastrophically than 018,
but should still be run promptly).

## KEY ARCHITECTURE FACTS (don't relearn these)
- `src/context/BookContext.tsx`: single source of truth for books, orders,
  categories, coupons, etc. Loads via `Promise.allSettled` (NOT
  `Promise.all` — deliberately fixed; one failing query must never blank
  the whole admin panel again).
- `siteSettings` (one JSONB row in Supabase `site_settings` table, id=
  'default') holds ALL Control-Panel-editable config: theme, header,
  homepageSections, footerColumns, popups, customPages, mediaFiles,
  analytics, enableCod/enableUpi/enableOnlinePayment, `legalPages`,
  `aboutPage`, `faqItems`, `navLabels`, and `pageBanners`.
- **Recurring bug pattern to watch for**: any `useState(siteSettings.xyz ||
  [...])` in `AdminPage.tsx` only runs ONCE at mount — if it fires before
  the real async Supabase fetch resolves, it locks in stale/empty data
  FOREVER and the next Save silently wipes real saved data. Fix pattern:
  add `if (siteSettings.xyz) setXyz(siteSettings.xyz)` inside the resync
  `useEffect` keyed on `[siteSettings]` (~line 1771 area in AdminPage.tsx).
  This has bitten: footerColumns, homepageSections, header logo/favicon,
  mediaList, popupsList, customPagesList — all now fixed. Apply the SAME
  fix to any NEW siteSettings-backed field you add.
- Admin auth: secret URL only (`/admin/login-user/gaytri`), email+password
  then mandatory email OTP. `/admin` itself silently redirects home if not
  admin — reveals nothing. After OTP, URL stays on the secret path (never
  transitions to `/admin`) — this was a deliberate fix, don't re-add a
  `onNavigate('admin')` redirect after login.
- Idle timeout: 15 min inactivity auto-logout (AuthContext.tsx).
- Payment flow: online-payment orders start as `order_status:
  'Awaiting Payment'` (not `'Processing'`), only flip to Processing after
  real Razorpay signature verification. Abandoned/failed payments get
  auto-cancelled + stock restored (immediately on dismiss, and via a
  15-min scheduled sweep `netlify/functions/sweep-stale-orders.ts` for
  users who just close the tab). COD still goes straight to Processing
  (correct — COD payment is inherently deferred to delivery).

## PENDING — WAITING ON RADHA (not started, no code written)
- **SMS/WhatsApp OTP system** (customer signup/login AND checkout phone
  verification, both requested): explained there is no truly free SMS
  or WhatsApp OTP provider — every option (Twilio, MSG91, Fast2SMS,
  2Factor.in, Meta WhatsApp Cloud API) charges per message, WhatsApp
  additionally requires Meta Business verification. Recommended
  2Factor.in or MSG91 (cheap, ₹0.10-0.18/SMS, fast signup, no lengthy
  business-verification wait unlike WhatsApp). **Radha needs to sign up
  with one of these herself and provide the API key** (as a new Netlify
  env var, same pattern as the R2 credentials) before this can be built
  — nothing to build yet without that key.

## WHAT WAS DONE THIS SESSION (chronological, latest first)

0. **`FINAL_BUG_SECURITY_AUDIT.md` — completed ALL remaining bugs (STEP
   5-8: BUG-015 through BUG-034, SEC-001 through SEC-008), following the
   Step 1-4 batch below (fixed earlier this session). Every item was
   checked against the real code before fixing — see that earlier
   entry's verification approach; same discipline applied here.**

   **New migration `022_affiliate_security_hardening.sql`** (STEP 5 —
   affiliate security):
   - `get_affiliate_dashboard`/`get_affiliate_team` RPCs (SEC-001/002):
     used to trust a caller-supplied `p_user_id` with no check — any
     logged-in user could call either directly with someone else's UUID
     and read their full dashboard/team. Now ignore a mismatched
     non-admin-supplied ID and use `auth.uid()` instead.
   - `get_affiliate_team` (SEC-006): stopped returning `member_email` at
     all (never actually displayed in the UI, so no reason to expose it).
   - `record_affiliate_click` (SEC-005): added a 30-second dedup per
     referral code — closes the trivial "call the RPC in a loop to
     inflate click count" abuse.
   - `affiliate_accounts` (SEC-003): removed the "update own account"
     policy entirely — it let a user change their own `status`/
     `referral_code`/`referred_by_code` to anything. Verified nothing in
     the frontend actually used this policy before removing it.
   - `audit_logs` (SEC-004): insert policy tightened from "any logged-in
     user" to admin-only — BookContext.tsx's real audit-log feature
     (admin actions) still works, verified before changing.

   **`server.ts`** (STEP 8 — remaining hardening):
   - SEC-007: rate limiter now fails CLOSED (rejects) on an internal RPC
     error for auth, order-tracking, and a NEW dedicated payment-endpoint
     limiter — previously failed OPEN everywhere, silently removing
     abuse protection during any DB hiccup. Generic `/api/` traffic
     limiter deliberately left fail-open (that one failing closed on
     every hiccup would turn a minor outage into a full site outage).
   - SEC-008: `/api/orders/track` no longer `select('*')`s the entire
     orders row (was leaking `razorpay_order_id`, `payment_transaction_id`,
     coupon/referral codes to a public/guest-accessible endpoint) — now
     selects only the columns the tracking page actually uses. Also
     removed two dead `targetOrder.customer_email`/`customer_phone`
     fallback references that TypeScript caught once the row got a real
     type — those columns never existed; the real (working) check is
     `shipping_address.email`/`.phone`.

   **`src/pages/CheckoutPage.tsx`**:
   - BUG-015: the active referral code (captured from a `?ref=`/`?aff=`
     link, tracked in `localStorage` since before this session) was
     never actually included in the order-create request — added it, so
     referral commissions can now actually be attributed.
   - BUG-027: replaced the fabricated `TRACK-${orderNumber}` tracking
     value (never written to the DB, so pasting it into the tracking
     page found nothing) with the real order number, which the tracking
     endpoint already matches on.

   **`src/pages/OrderSuccessPage.tsx`**:
   - BUG-026: "Your order number" line was showing the raw internal
     UUID (`order.id`) instead of the customer-facing order number
     (`order.orderNumber`, e.g. `DH-2026-123456`).

   **`src/context/BookContext.tsx`** (STEP 6 — reviews/CMS/data
   correctness, largest single chunk of this batch):
   - BUG-017/018: public book rating/review count used to be computed
     from ALL reviews including ones still pending moderation, and
     approving/rejecting a review never recalculated the rating at all.
     Added one shared `recalculateBookRating()` helper (approved-only)
     called from add/approve-toggle/delete — the last of these
     (`deleteReview`) previously didn't touch the rating either.
   - BUG-019: the initial Supabase data load checked `data.length > 0`
     before applying fetched books/categories/authors/reviews/coupons/
     orders/blogs/gallery — so a genuinely EMPTY table (fresh production
     DB, or every review deleted) left the hardcoded `INITIAL_*` demo/
     seed arrays in place, shown to real visitors as if real. Changed to
     `data !== null` (the fetch helper already distinguishes "error" from
     "empty array" correctly) so a real empty result now correctly shows
     as empty, not demo data.
   - BUG-020/021/022/023: FAQs, testimonials, and videos were fully
     working in the Admin UI but only ever touched local React state —
     zero Supabase calls — so any change vanished on refresh and every
     real visitor always saw the hardcoded seed data; Events had no
     database table or CRUD functions at all (pure hardcoded, read-only
     import). New migration `023_faq_testimonial_video_event_tables.sql`
     adds all four tables (same public-read/admin-write pattern as
     `gallery`, migration 018), seeded with the exact current hardcoded
     content so nothing visually changes the moment the migration runs.
     Wired real fetch (added to the existing `Promise.allSettled` load)
     + real add/update/delete for all four, including brand-new
     `addEvent`/`updateEvent`/`deleteEvent` (exposed via context, but
     note: **there is still no Admin UI tab for managing Events** — that
     UI was never built for this feature; the data layer is now real and
     ready for one, but building that panel is a separate task).
   - BUG-034: `deleteOrder()` used to hard-`DELETE` any order regardless
     of state — for a paid/shipped/delivered order this destroys real
     accounting history and orphans/cascade-deletes its items, status
     history, and inventory movements, with no recovery. Now refuses to
     hard-delete an order that was ever `Paid` or progressed past
     `Awaiting Payment`/`Cancelled` — surfaces a message telling the
     admin to use the status dropdown (Cancelled/Returned) instead,
     which preserves history. Only a genuinely never-paid, never-
     progressed stray order can still be hard-deleted.
   - BUG-016 (partial, judgment call): `loadAffiliateData()` was calling
     `setCommissions(AffiliateService.getCommissions())` (local/demo
     source) unconditionally, even when Supabase IS configured and a
     DB-backed fetch was already in flight — causing a visible flash of
     demo commission data before the real data arrived a moment later.
     Fixed this specific instance (now only runs the local/demo line
     when there's no real backend at all). Did NOT attempt a full
     rewrite of the wallet/stats dual-mode (demo vs Supabase)
     architecture in this file — that's a much larger, higher-risk
     refactor than this session's remaining time/scope allowed for
     safely; flagging as still-architecturally-mixed if a future session
     has time for a proper pass.
   - BUG-033 (assessed, not changed): this is a systemic pattern across
     nearly every add/update/delete function in this file (optimistic
     local state update before the DB write resolves, no rollback on
     failure) — not a single fixable location. Found this is already
     partially mitigated: every one of these functions already calls
     `reportSyncError()` on failure, which sets `lastSyncError` and
     surfaces a visible "this did NOT save — please retry" toast (see
     AdminPage.tsx). That's real user-facing feedback, just not a full
     state rollback. A true fix (rolling back optimistic state on every
     one of ~25 CRUD functions) was judged too large/risky to attempt
     safely in the time remaining in this session — flagging for a
     dedicated future pass rather than rushing it.

   **`src/lib/googleSheetsBackup.ts`** (STEP 7 — backup, full rewrite):
   - BUG-029: only 7 of 29 real tables were ever exported (orders,
     order_items, books, coupons, contact_messages, affiliate ledger,
     affiliate withdrawals) — profiles, categories, authors, reviews,
     site settings, audit logs, blogs, gallery, FAQs, testimonials,
     videos, events, order status history, inventory movements,
     affiliate accounts/clicks, manual customer contacts, user roles,
     and wishlists were NOT recoverable from this backup at all. Now
     exports every real business/content/audit table (deliberately
     excluding only `api_rate_limits` — ephemeral counters, not business
     data — noted explicitly in the code so it's a deliberate omission,
     not a silent gap).
   - BUG-030: every table query used a flat `.limit(5000)` — any table
     that ever grows past 5,000 rows (orders/order_items are the likely
     first to hit this) would silently, permanently lose everything past
     row 5000 in every future backup. New `fetchAllRows()` pages through
     with `.range()` until a page comes back short, so size no longer
     matters.
   - BUG-031: the Apps Script Web App has to be deployed with "Anyone"
     access (needed for a server-to-server POST with no Google login),
     but until now accepted and wrote ANY payload with zero
     verification — anyone who obtained the URL could overwrite the
     backup sheet with arbitrary data. Added HMAC-SHA256 signing: the
     server signs the payload with a new `GOOGLE_APPS_SCRIPT_SHARED_
     SECRET` env var, and the updated Apps Script (full replacement
     script in the file's setup comment — **must be re-pasted into the
     Apps Script editor, the old deployed version will reject every
     request as unsigned**) verifies it using `Utilities.
     computeHmacSha256Signature` before writing anything.
   - BUG-032 (read-side, complementing the write-side fix already done
     in an earlier session): a table that failed to even be READ from
     Supabase used to just `continue` silently, so the backup could
     "succeed" while quietly missing that table's data. Read failures
     are now tracked the same way write failures already were, and
     either kind of failure throws an explicit incomplete-backup error
     instead of reporting success.

   **Verified real, NOT changed — explicitly flagged, not silently
   skipped**:
   - BUG-016 and BUG-033: see the judgment-call notes above (partial fix
     + assessment respectively) — both are real architectural patterns
     that would need a larger, dedicated refactor to fully close, not a
     quick fix, and rushing either felt riskier than leaving them
     documented for a focused future session.
   - Events management has no Admin UI panel yet (BUG-023's fix made the
     underlying data real; the UI to manage it from the Control Panel
     still needs to be built as its own task).

   **Required testing before trusting this in production** (can't be
   done from this session — no live Supabase/Razorpay/Google access):
   run migrations 018-023 in order, then: place a real order end-to-end;
   open the affiliate portal dashboard and team tabs; visit `/faq`,
   `/videos`, `/testimonials` (or wherever each renders) and add/edit an
   item from the Admin panel to confirm it persists after a refresh; try
   deleting a paid order (should be refused) and a stray unpaid one
   (should work); run the daily backup once after updating BOTH the
   Netlify env var and the Apps Script.

0. **`FINAL_BUG_SECURITY_AUDIT.md` (34 bugs + 8 security issues) — verified
   against the actual code first, then fixed STEP 1-4 (money/inventory
   core) as one coherent batch. STEP 5-8 (affiliate security, reviews/CMS,
   backup, remaining hardening) are NOT done yet — see below.**

   **Verification approach**: read the actual `server.ts`/table-schema
   code for a representative sample before changing anything (BUG-001
   through 013, 024, 025, 028 were each traced to the exact lines
   described). Every one checked came back accurate — the audit is
   trustworthy, not speculative. Did not exhaustively re-derive every
   single one of the 34 bugs line-by-line before fixing it; fixed each
   against its real code as I went instead.

   **Fixed (STEP 1-4 of the audit's own fix order — BUG-001, 002, 003,
   004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 024, and part of
   025):**
   - New `migrations/021_atomic_order_state_machine.sql` — three RPCs
     that make order creation, payment-state transitions, and
     cancellation/stock-restoration each ONE atomic Postgres transaction
     instead of several separate read-then-write calls:
     - `create_order_transactional(p_order, p_items, p_coupon_id)` —
       order + order_items + per-item stock decrement + coupon
       check-and-reserve + initial order_status_history row, all in one
       transaction. Any failure (insufficient stock, coupon limit hit)
       rolls back everything, including earlier loop iterations — closes
       BUG-001/002/028 and the coupon race in BUG-010.
     - `cancel_order_atomic(p_order_id, p_expected_statuses, reason,
       updated_by)` — atomic conditional `UPDATE ... WHERE order_status =
       ANY(expected) RETURNING id`; only the one caller whose UPDATE
       actually matches restores stock, so two concurrent cancellations
       (admin click racing the stale-order sweep, etc.) can't both
       restore the same order's stock — closes BUG-008/009. Also sets
       `payment_status = 'Refunded'` instead of `'Failed'` when
       cancelling an order that was already `'Paid'` (an improvement
       beyond the audit's literal wording — flag this to Radha; the old
       code always set `'Failed'` even for a paid-then-cancelled order).
       **Judgment call also made here**: an order can now only be
       cancelled from `Awaiting Payment/Processing/Shipped/Out for
       Delivery` — NOT from `Delivered` (a delivered order needs the
       existing `Returned` status instead, not `Cancelled`, since
       restoring stock for a book that already left the building would
       itself be wrong). Flag this to Radha in case her actual process
       needs something different.
     - `mark_order_paid_atomic(p_order_id, p_transaction_id,
       p_expected_statuses)` — atomic conditional transition to
       Paid+Processing together; used by BOTH `/api/payment/verify` and
       the webhook so they can't disagree, and a late webhook/replayed
       verify for an order a concurrent cancellation already resolved now
       matches zero rows (harmless no-op) instead of resurrecting it —
       closes BUG-005/006/007.
   - `server.ts` `/api/orders/create` — rewritten to call
     `create_order_transactional` instead of sequential inserts + a
     decrement loop; also fixed in the same pass: removed the hardcoded
     `RAMA108` fallback coupon (BUG-012); product-scoped coupon discount
     now calculated only from eligible line items instead of the whole
     cart (BUG-011); tax/shipping now read from `site_settings`
     (`taxPercentage`, `freeShippingMinAmount`) with the SAME fallback
     constants as `CartContext.tsx` (₹60 flat shipping, not the old
     hardcoded ₹50; 799 threshold, not 499) so the customer-visible total
     and the authoritative server total can no longer silently disagree
     (BUG-013/014).
   - `server.ts` `/api/payment/create-order` — now requires
     `order_status = 'Awaiting Payment'` (not just `payment_status !=
     'Paid'`) before creating a new Razorpay order, and binds
     `razorpay_order_id` with a conditional update instead of a blind one
     (BUG-003).
   - `server.ts` `/api/payment/verify` — razorpay_order_id mismatch check
     now REQUIRES the DB binding to exist (previously skipped entirely
     when NULL) (BUG-004); now calls `mark_order_paid_atomic` instead of
     an unconditional update, and returns a distinct 409 if the order was
     already resolved by something else in the meantime instead of
     silently reporting success on a payment it can't actually confirm
     (BUG-005).
   - `server.ts` `/api/payment/webhook` — now calls
     `mark_order_paid_atomic` too (BUG-006/007).
   - `server.ts` `cancelUnpaidOrderAndRestoreStock()` (shared by the
     cancel-unpaid-order endpoint and both payment/verify failure paths)
     — now delegates to `cancel_order_atomic` (closes its own instance of
     the BUG-008/009 race).
   - `server.ts` `/api/admin/update-order-status` — the `Cancelled`
     transition now goes through `cancel_order_atomic` (BUG-008); the
     plain status update and the history insert now check their DB
     results and return a real error instead of `{success:true}` on a
     failed write (partial BUG-025 — only this endpoint, not audited
     elsewhere yet).
   - `netlify/functions/sweep-stale-orders.ts` — now calls
     `cancel_order_atomic` per stale order instead of restore-then-cancel
     as separate steps (BUG-009).
   - `src/pages/AdminPage.tsx` — fixed the `"Out For Delivery"` /
     `"Out for Delivery"` casing mismatch between two different status
     dropdowns; the DB enum only has the lowercase-`f` form (BUG-024).
   - Verified `tsc --noEmit` and `npm run build` both clean after every
     change in this batch.

   **NOT done yet (STEP 5-8 of the audit — next batches, in the audit's
   own order)**:
   - STEP 5 — Affiliate security: BUG-015, BUG-016, SEC-001 (affiliate
     dashboard IDOR), SEC-002 (affiliate team IDOR), SEC-003 (affiliate
     self-update can touch protected fields), SEC-005 (fake click
     analytics), SEC-006 (team RPC over-exposes email).
   - STEP 6 — Reviews/CMS/data correctness: BUG-017 through BUG-023,
     BUG-026, BUG-027 (BUG-024 done, BUG-025 partially done above).
   - STEP 7 — Backup: BUG-029 through BUG-032 (Google Sheets backup
     completeness/pagination/auth), BUG-033, BUG-034.
   - STEP 8 — Remaining hardening: SEC-004 (client-insertable audit
     logs), SEC-007 (rate limiter fails open), SEC-008 (`/api/orders/
     track` selects whole row).

   **Required testing before trusting this in production** (can't be done
   from this session — no live Supabase/Razorpay access): run migration
   021, then walk the audit's own "Orders"/"Payments"/"Coupons" test-matrix
   sections (multi-item order with a later item out of stock; simultaneous
   cancellation; payment succeeding during a stale-sweep race; cancelled-
   order payment attempt; usage-limit-1 coupon with concurrent requests).

1. **"SEO really nahi ho raha, SEO dummy hai pura" — three connected bugs
   found and fixed, in dependency order.**
   - **Root cause (biggest one): individual book/blog pages had no real
     URL at all.** `App.tsx`'s URL router (`PATH_TO_PAGE`/`PAGE_TO_PATH`)
     was a fixed list of static paths that never included `book-details`
     or `blog-post` — so `handleNavigate`'s path lookup came back
     `undefined` for every single book/blog and `pushState` never ran.
     Every book/blog silently kept whatever URL was already in the
     address bar. That meant no book or blog page could ever be
     bookmarked, refreshed, shared, or crawled on its own URL — which is
     the actual reason the site's meta tags/canonical URLs/sitemap
     entries (all built around `/book/:slug`, `/blog/:slug`) never
     worked: those URLs never existed as real, navigable routes.
     **Fix**: added a `resolvePath()` helper (single source of truth,
     used on first load AND on back/forward) that recognizes `/book/:slug`
     and `/blog/:slug`, plus a resolver `useEffect` that looks up the
     matching book/blog by slug once the catalog has loaded from
     Supabase and sets `selectedBook`/`selectedBlog`. `handleNavigate`
     now builds the real `/book/:slug` or `/blog/:slug` path whenever
     `params.bookSlug`/`blogSlug` is passed. Updated every navigation
     call site that was passing `{ bookId }` instead of `{ bookSlug }`
     (`Navbar.tsx` search results + flagship-book link, `MobileMenu.tsx`
     flagship-book link, `HomePage.tsx` "पूरा विवरण" button,
     `handleSelectBook`/`handleSelectBlog` in `App.tsx`) — these had a
     second latent bug too: since `handleNavigate` never set
     `selectedBook`, clicking these always displayed `books[0]` instead
     of the actual book clicked. The new slug-based resolver effect
     fixes that for free, since it re-resolves from `pageParams` on any
     navigation, not just direct URL loads. **A book's `slug` is
     literally its `id`** (see `mapDbBookToBook` — no separate DB
     column), so `/book/<id>` is correct and matches what `SeoHead.tsx`'s
     canonical URL already assumed.
   - **`/sitemap.xml` was a static, hand-written file** (`public/sitemap.xml`)
     listing ~12 fixed URLs — no book/category/blog was ever in it, and
     it never changed as the catalog changed. A real generator already
     existed (`SitemapPage.tsx`, the human-facing `/sitemap` page) but
     crawlers request `/sitemap.xml`, not `/sitemap`, so it was never
     actually seen by Google. **Fix**: new `/api/seo/sitemap-xml` route
     in `server.ts` (same pattern as the existing `/api/seo/robots-txt`
     fix from 2026-08-29) that builds the sitemap live from
     `books`/`categories`/`blogs` tables, plus a `netlify.toml` redirect
     routing `/sitemap.xml` there — otherwise Netlify always serves the
     static file directly regardless of what the API returns (same root
     cause as the old robots.txt bug).
   - **All per-page meta tags (title, description, OG image, canonical,
     Schema.org JSON-LD) were only ever injected by client-side JS**
     (`SeoHead.tsx`'s `useEffect`, running after React mounts) — the
     static `index.html` Netlify actually serves has none of this. Google
     eventually renders JS but inconsistently/with delay, and the
     crawlers that matter most for link previews (WhatsApp, Facebook,
     Twitter/X, LinkedIn, Slack, Telegram) never execute JS at all, so a
     shared book/blog link always showed the generic homepage title with
     no description or image. **Fix**: new Netlify Edge Function
     (`netlify/edge-functions/seo-prerender.ts`) that runs only for
     requests whose User-Agent matches a bot/crawler pattern — regular
     visitors get the exact same SPA as before, untouched. For a matched
     request it fetches the real book/blog/site-settings data straight
     from Supabase's REST API (plain `fetch`, no SDK — avoids any
     Deno/npm-package compatibility risk) and rewrites `<title>` plus
     meta/OG/canonical tags in the HTML before returning it. Falls back
     to generic site-wide tags (never an error) if Supabase env vars are
     missing or any fetch fails. **Needs a manual Netlify dashboard step
     — see LATEST STATE above** — could not be tested against a live
     Netlify/Deno deploy from this session (no network access to
     Netlify/Supabase here), so treat this one as needing a real test
     after deploy, same caution as the "biggest, needs separate testing"
     framing this was given before starting.
   - Verified `tsc --noEmit` and `npm run build` both clean after all
     three changes (edge function file itself is intentionally excluded
     from the root `tsconfig.json` — it runs on Netlify's own Deno
     runtime, not Node, and Netlify compiles/bundles it independently at
     deploy time regardless of this project's tsconfig).

1. **"Domain (GoDaddy) aur payment gateway (Razorpay) le liya, ab website
   live karni hai" — while researching how to document Razorpay setup,
   found and fixed a CRITICAL, completely blocking bug: the Razorpay
   Checkout SDK script was never loaded anywhere in the app.**
   - **Root cause**: `CheckoutPage.tsx`'s entire Razorpay/UPI/Card
     payment flow is gated behind a `(window as any).Razorpay` check —
     but no `<script src="https://checkout.razorpay.com/v1/checkout.js">`
     tag existed anywhere in the codebase (not in `index.html`, not
     dynamically injected via JS). This meant `window.Razorpay` was
     ALWAYS `undefined`, so that `if` condition was always false, and
     selecting Razorpay/UPI/Card at checkout always silently fell
     through to the generic `"Selected payment method requires server
     gateway verification."` error — regardless of whether
     `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` were configured correctly
     on the server. **Only Cash on Delivery could ever actually
     complete an order** — this would have been the very first thing
     Radha discovered broken the moment she tried a real test payment
     after setting up her new Razorpay account, so finding it now,
     before that test, was important.
   - **Fix**: added the single missing `<script
     src="https://checkout.razorpay.com/v1/checkout.js"></script>` tag
     to `index.html`. Confirmed it survives the Vite production build
     (checked `dist/index.html` directly). The server-side integration
     itself (`/api/payment/create-order`, `/verify`, `/webhook` in
     `server.ts`, and the 3 `RAZORPAY_*` env vars) was already correct
     and complete — this was the one missing piece stopping all of it
     from ever being reachable.
   - Verified `tsc --noEmit` + `npm run build` clean.
   - **New deliverable**: a full Hindi-language "Website Live Karne Ki
     Guide" PDF (`shaktiseshanti-website-live-guide.pdf`) — cover page +
     6 content pages, built as HTML → PDF (wkhtmltopdf + Noto Sans
     Devanagari font, embedded, verified conjuncts render correctly)
     with the site's own maroon/gold color scheme, large/bold
     easy-to-read type per Radha's request. Covers, in order: (1)
     running the 3 pending Supabase migrations (018/019/020) — SQL
     Editor, step by step; (2) getting Razorpay API keys, setting the 3
     Netlify env vars, setting up the webhook — including an explicit
     warning to deploy the NEW zip (with the script-tag fix) not an
     older one; (3) connecting the GoDaddy domain to Netlify — the
     exact A record (`75.2.60.5`) and CNAME values, both the Netlify
     side and the GoDaddy DNS side; (4) a complete table of every
     Netlify environment variable this project uses, marked ✅ already
     set / 🆕 add now / ⏳ later (optional), pulled directly from
     `.env.example` for accuracy — also notes SMS/WhatsApp OTP is still
     pending Radha's provider signup; (5) a final pre-launch checklist.
   - **Not done**: did not verify the guide's Netlify/GoDaddy screenshots
     or exact current UI menu labels beyond a web search for current
     documented steps — interfaces can shift; if a menu name in the PDF
     doesn't match what Radha sees, the underlying settings (A record,
     env variables, webhooks) are still the right concepts to look for.

2. **"YouTube ka link dalne pe work nahi kar raha hai, videos play nahi ho
   rahi hai" — FIXED (screenshot showed a book's trailer video stuck at
   a black box with a broken-image icon on `BookDetailsPage.tsx`).**
   - **Root cause**: the YouTube URL → embed URL conversion was a single
     naive `.replace('watch?v=', 'embed/')` — it only worked for the
     exact `youtube.com/watch?v=ID` format. Any other way of copying a
     YouTube link — **`youtu.be/ID`** (what YouTube's own mobile
     "Share" button produces — almost certainly what was actually
     pasted, given how the bug was hit), `youtube.com/shorts/ID`, a
     link with `&list=`/`&t=` params, or a link already in `embed/`
     format — either did nothing (raw non-embeddable URL landed in the
     iframe, which YouTube blocks from framing directly → the broken
     black box in the screenshot) or produced a malformed URL.
   - **Fix**: new shared utility `src/utils/youtube.ts` —
     `extractYoutubeVideoId()` / `getYoutubeEmbedUrl()` — a single regex
     that recognizes the video ID across `watch?v=`, `youtu.be/`,
     `embed/`, and `shorts/` formats (with or without `www.`/`m.`
     subdomain, with or without extra query params), and falls back to
     returning the original URL unchanged if it's not a recognizable
     YouTube link at all (so non-YouTube embeds — HLS streams, Google
     Drive previews — are never broken by this).
   - **Applied in 2 places** (found and fixed proactively, not just the
     one reported): `BookDetailsPage.tsx`'s trailer-video iframe (the
     reported bug), and `LiveStreamPlayerModal.tsx`'s `customEmbedUrl`
     iframe — this second one has the exact same underlying flaw
     (admin's raw pasted URL used directly as the iframe `src`, no
     parsing at all) and would have hit visitors the moment an admin
     pasted anything other than an already-perfect `embed/` URL for a
     livestream. Also updated both admin form fields' placeholder/help
     text (book trailer URL field, livestream embed URL field) to make
     clear any YouTube link format now works, instead of implying only
     one exact format is accepted.
   - **Verified the regex itself** against 9 real-world URL shapes
     (watch, youtu.be, youtu.be with `?t=`, watch with `&list=`, embed,
     shorts, `m.youtube.com`, no-scheme, and a non-YouTube Drive URL) —
     all extracted/passed-through correctly.
   - **Found but NOT touched (separate, unrelated issue, flagged for
     awareness)**: `src/components/home/VideosSection.tsx` and its
     `VideoItem`/`addVideo` plumbing in `BookContext.tsx` appear to be a
     dead/unwired feature — not imported or rendered anywhere in
     `HomePage.tsx`, and has no Admin UI calling `addVideo` at all (same
     "built but never connected" pattern as Gallery was before this
     engagement's fix). Not part of what was reported, not investigated
     further or fixed this session.
   - Verified `tsc --noEmit` + `npm run build` clean.

3. **"Sab jagah se remove karna hai, jo photo/video/text control panel se
   aaye wahi aana chahiye" — the mismatched Quran-like stock photo
   (Unsplash `photo-1609599006353-e629aaabfeae`) removed from every
   single place it existed in the codebase — 36 occurrences across 17
   files, plus 2 already-touched migration files.**
   - **New shared file**: `src/lib/placeholderImage.ts` exports
     `NO_IMAGE_PLACEHOLDER` — a small (1.1 KB) inline SVG data URI
     (maroon/gold themed, book-icon, "छवि उपलब्ध नहीं" / "image not
     available" text). No network request, never shows unrelated
     content, always visually obvious as a genuine placeholder rather
     than masquerading as real content the way a random stock photo
     does.
   - **Every occurrence of the old URL replaced** with
     `NO_IMAGE_PLACEHOLDER` across: `LiveStreamPlayerModal.tsx`,
     `OptimizedImage.tsx`, `BookCard.tsx`, `VideosSection.tsx`,
     `LiveStreamSection.tsx`, `GayatriSecretsSection.tsx`,
     `VideoSection.tsx`, `initialData.ts` (13 occurrences — this is the
     dev/local-only seed data file, only used when Supabase isn't
     configured at all), `mediaProcessor.ts`, `reviewsApi.ts` (the fake
     `INITIAL_CUSTOMER_REVIEWS` thumbnail — also dev-only now per the
     earlier fix in this same session), `imageOptimizer.ts`,
     `BookDetailsPage.tsx`, `ReviewsPage.tsx`, `AdminPage.tsx`,
     `HomePage.tsx`, `LiveStreamContext.tsx`, `BookContext.tsx` — done
     with a script + manual verification, not by hand one-by-one (the
     script had 2 bugs of its own, both caught and fixed before
     shipping — see below).
   - **"Jo photo/video/text control panel se aaye wahi aana chahiye"**:
     confirmed for every one of these that the real value already DOES
     come from Control Panel / the database wherever one exists (book
     `coverImage`, live stream `coverImage`, review `photo_url`/
     `thumbnail_url`, etc.) — the stock photo was ONLY ever a fallback
     for the small window before real data loads, or when a field is
     genuinely empty/broken. None of these needed new wiring to Control
     Panel data; they already had it. The fallback itself was the whole
     bug, now fixed.
   - **Two already-seeded database rows needed separate fixes,
     migration-file edits alone can't reach live data**:
     - `migrations/018_gallery_table.sql` (created this engagement, NOT
       yet run by Radha, confirmed via the standing checklist) — safe
       to edit directly. Swapped its `gal-3` seed row's image to the
       same `NO_IMAGE_PLACEHOLDER` data URI.
     - `migrations/013_seed_real_categories.sql` (already applied to
       production, seeds the "Bhagavad Gita" category with this exact
       photo) — editing that file can't reach already-inserted rows, so
       added a new migration, `migrations/020_fix_category_image.sql`
       — an `UPDATE public.categories SET image_url = NULL WHERE id =
       'cat-1' AND image_url = '<old URL>'`. Spot-checked first: this
       field (`Category.image`) isn't currently rendered anywhere on
       the public site or in the Admin category list, so this was a
       real but not currently visible mismatch — worth correcting
       outright since it was found, not because a visitor could see it
       today.
   - **Process note — 2 script bugs caught and fixed before delivery**:
     a first-pass regex-based replacement across all 17 files produced
     2 real syntax breaks: (1) in 2 files (`GayatriSecretsSection.tsx`,
     `VideoSection.tsx`) a plain JSX string attribute (`src="..."`, no
     braces) became `src=NO_IMAGE_PLACEHOLDER` — invalid JSX without
     `{}` around the identifier; (2) in `ReviewsPage.tsx` the new import
     line landed in the middle of an existing multi-line `import {...}
     from '...'` block, splitting it in half. Both caught immediately by
     `tsc --noEmit` (not by inspection), fixed by hand, then the full
     17-file set was re-verified clean.
   - Verified `tsc --noEmit` + `npm run build` clean (twice — once after
     the script bugs were fixed, once more from a completely fresh zip
     extract).
   - **Not done**: did not search for/vet a replacement REAL photo for
     any of these spots (e.g. gal-3's gallery photo) — used the neutral
     placeholder everywhere rather than risk picking another
     unverified stock photo. Radha can add real photos via the Gallery
     admin tab (gal-3), book cover uploads, etc. whenever she has them.

4. **"Yeh dono [popup image + hero banner image] abhi bhi aa rahe hain —
   site load hote hi aate hain, 3-4 sec baad original book aa jaati
   hai" — user sent 2 screenshots showing the same Quran-like stock
   photo in both places. FIXED THE CODE PART; the popup's saved data
   still needs a manual admin step — explained clearly below.**
   - **Root cause found**: `ShaktiHeroBanner.tsx` had a hardcoded
     `FALLBACK_COVER` constant pointing to a specific Unsplash stock
     photo of a gold-embossed leather book — the exact same "looks like
     a Quran" photo from the popup-image conversation earlier this
     engagement. This one rendered automatically, on every single
     homepage load, for the ~3-4 seconds before `shaktiBook` arrives
     from Supabase's async data load (since `shaktiBook` is `undefined`
     until then, so `shaktiBook?.coverImage || FALLBACK_COVER` always
     resolved to the wrong stock photo) — exactly matching the "3-4 sec
     baad original book aa jaati hai" timing the user described. It was
     also the `onError` fallback for a genuinely broken cover URL.
   - **This exact same stock photo URL turned out to be reused as a
     generic placeholder in 17 different files across the codebase**
     (video thumbnails, review photos, admin previews, etc.) — this fix
     only touched `ShaktiHeroBanner.tsx` (the homepage hero, which is
     what was reported/screenshotted); the other 16 were NOT touched
     this session and may be worth a dedicated audit if any of them
     turn out to be similarly visible/mismatched — flagged, not fixed.
   - **Fix**: replaced the "wrong photo while loading" pattern entirely
     with a neutral loading/placeholder box (a book icon + "लोड हो रहा
     है..." / "आवरण जल्द उपलब्ध होगा" text on the site's own maroon
     gradient — no photo at all) for both the main cover display and
     the fullscreen preview modal. No unrelated image is ever shown
     again in this component — only ever "still loading" or "no image
     available", using the site's own visual language instead of a
     random stock photo.
   - **The popup image is different — it's DATA, not code, and I
     cannot fix it myself.** The Popup Manager fix earlier this
     engagement gave the admin the ability to view/edit/clear a
     popup's image — but the ALREADY-SAVED bad image URL sitting in the
     live Supabase database was never itself changed (I have no access
     to Radha's production database to edit that row directly). **This
     needs a manual step in Admin → Control Panel → Popups**: open the
     popup showing the Quran-like photo, either paste a correct image
     URL or click "हटाएं (Clear)", then Save. Told the user this
     directly and clearly in the reply — did not imply this was
     code-fixable.
   - Verified `tsc --noEmit` + `npm run build` clean.

5. **"Review bhi hardcode hai real nahi. Control panel mein de rakha hai
   par woh bhi hardcode hai." — FIXED. This was the deepest bug found
   this whole engagement: 3 separate, serious problems stacked in one
   feature, including customer-facing fake testimonials.**
   - **Important scoping note**: this site has TWO separate review
     systems. (a) simple per-book reviews shown on `BookDetailsPage.tsx`,
     managed via `BookContext`'s `reviews`/`addReview`/
     `toggleReviewApproval`/`deleteReview` and Admin's "Reviews" tab —
     this one was already properly Supabase-synced, not part of this
     bug. (b) the big standalone `/reviews` page ("सत्यापित पाठकों एवं
     साधकों की समीक्षाएं", with photo/video uploads, business name,
     city) — a richer `CustomerReview` system with its own
     `src/lib/reviewsApi.ts`. **This second system is what was broken.**
   - **Bug 1 — fabricated testimonials shown as real** (the core of the
     complaint): `fetchCustomerReviewsApi` fell back to a hardcoded
     `INITIAL_CUSTOMER_REVIEWS` array — 5 detailed fake reviews with
     invented named individuals, professions, cities, and stock photos
     — **every single time the real `reviews` table had zero matching
     rows**, which is exactly the normal state for a store with no
     reviews submitted yet. Real visitors saw these as indistinguishable
     from genuine customer reviews, with no way to tell. Admin's
     verify/delete buttons on these fake rows were no-ops against the
     real database (those IDs like `cr-101` never existed in Supabase)
     — only ever touching that one admin's own browser localStorage.
     Fixed: when Supabase is properly configured, the fake fallback is
     never used — zero real reviews now genuinely shows zero, with a
     new inviting "अभी तक कोई समीक्षा नहीं है — पहली समीक्षा लिखने वाले
     बनें!" empty state (button opens the Write Review modal directly).
     The fake array is now used ONLY as a local-dev fallback when
     Supabase isn't configured at all.
   - **Bug 2 — real data loss on every genuine submission**: the "Write
     a Review" form already collected business name, city, and an
     optional compressed photo/video (all real, working browser-side
     processing) and correctly passed all of it to
     `submitCustomerReviewApi` — which then only ever saved
     `user_name`/`rating`/`comment` to Supabase because `public.reviews`
     never had columns for the rest. Every real customer's business
     name, city, and uploaded photo/video was silently discarded the
     moment they submitted. Fixed with a new migration
     (`019_customer_review_columns.sql` — adds `business_name`, `city`,
     `photo_url`, `video_url`, `thumbnail_url`, `is_verified` to
     `public.reviews`) plus fixing `submitCustomerReviewApi` and
     `fetchCustomerReviewsApi` to actually write/read all of it.
   - **Bug 3 — the admin "verify" button could silently unpublish a real
     review**: found while fixing Bug 1. The button is labeled and
     styled as "Toggle Verified Badge" (a cosmetic checkmark), but
     `adminToggleVerifyCustomerReviewApi` actually read/wrote the
     `is_approved` column — the column that controls whether a review
     is publicly visible at all. Clicking what looked like a harmless
     cosmetic toggle on an already-live review would flip
     `is_approved` to false and make it vanish from the public page.
     Fixed to correctly target `is_verified` instead, matching its
     label. This also meant approving a pending review had no real
     dedicated control — added a proper `adminApproveCustomerReviewApi`,
     a "Pending Approval" badge, and Approve/Unpublish buttons in the
     admin view (`fetchCustomerReviewsApi` now takes an
     `includeUnapproved` flag, set to `isAdmin` on `/reviews` so admin
     can actually see and moderate pending submissions — there was
     previously no way to do this at all).
   - No new `SiteSettings`/JSONB changes — this is entirely the
     `public.reviews` table (migration 019) and application code.
   - Verified `tsc --noEmit` + `npm run build` clean.
   - **Not investigated further**: the simple per-book review system
     (BookDetailsPage/Admin Reviews tab) was spot-checked as already
     correctly Supabase-synced and left untouched. Whether any OTHER
     content area has this same "richer form than the DB schema
     supports" data-loss pattern was not audited beyond reviews/gallery/
     blogs (all three now fixed this engagement).

6. **"Printing Press & Temple Seva Photo Gallery [/gallery] yeh bhi pura
   hardcode hai, iska bhi koi edit/upload ka nahi hai" — FIXED. This one
   was worse than the Authors case: not just missing UI, the database
   table for it never existed at all.**
   - **Root cause**: `src/context/BookContext.tsx`'s `gallery` state
     initialized from `getLocalData('gallery', INITIAL_GALLERY)` (a
     hardcoded 4-item seed array in `src/data/initialData.ts`) and was
     **never included in the app's Supabase data load at all** — not in
     the 9-query `Promise.allSettled` batch that loads
     books/categories/authors/etc. So in production, every visitor,
     every page load, saw ONLY the hardcoded seed data, permanently.
     `addGalleryItem`/`deleteGalleryItem` existed in `BookContext` but
     only ever called `setGallery(...)` (local React state) — no
     `supabase.from('gallery')` call at all, unlike every other
     add/delete function in this codebase. And on top of that, **there
     was no Admin UI anywhere calling those two functions** — no tab, no
     list, no "Add Photo" button existed. Fully broken end-to-end, not
     partially working — same category of bug migration 007 fixed for
     `blogs` (see that migration's own notes for the identical pattern).
   - **Fix (matches the blogs-table precedent exactly)**:
     - **New migration**: `migrations/018_gallery_table.sql` — creates
       `public.gallery` (id, title, category, image_url, caption,
       created_at), public-read/admin-write RLS (same `is_admin()`
       pattern as every other table), and seeds it with the exact same
       4 items that were hardcoded in `INITIAL_GALLERY` so the live page
       looks identical the moment this migration runs — **this is the
       first new migration since 017; it must actually be run against
       the Supabase database before this deploy, it does not apply
       itself**.
     - `BookContext.tsx`: added `gallery` as a 10th query in the
       parallel Supabase load, added `mapDbGalleryToGalleryItem`, and
       rewired `addGalleryItem`/`deleteGalleryItem` to actually write to
       Supabase (insert/delete), matching the blogs pattern precisely.
     - `AdminPage.tsx`: built a real Gallery tab from scratch (there was
       none before) — a new "🖼️ Gallery" tab button, a grid list showing
       each photo with its title/category/caption and a delete button,
       and a full "Add Photo" modal with Title/Category/Caption fields
       plus a real Supabase Storage file-upload button (mirroring the
       Author-photo-upload pattern) — not just a raw URL paste box.
   - **Two more of the same "wrong field name" bugs found and fixed
     while in this exact code** (same bug class found 3 times now this
     session, in Authors and here in Blogs): (1) the Admin Articles list
     was displaying `{b.author}` — `BlogPost`'s real field is
     `authorName`, so every article's byline showed blank in the admin
     list. (2) The actual root cause of that: `handleCreateBlog`'s
     `addBlogPost({...})` call was saving `author: blogAuthor` (wrong
     key — silently accepted by TypeScript in this file despite genuinely
     violating the declared type; confirmed as a real bug via an
     isolated reproduction outside the project, so this was worth fixing
     even though `tsc` wasn't flagging it here) and never included
     `category` at all despite it being a required, NOT NULL database
     column — meaning every article ever published via this admin form
     silently saved `author_name: NULL` and `category: NULL` to the
     database. Fixed the field name, added a real Category input field
     to the Add Article modal (was missing entirely), and set a sensible
     default.
   - Verified `tsc --noEmit` + `npm run build` clean.
   - **Not investigated further**: whether this same "no Supabase table
     at all" bug pattern exists for any OTHER content type in the app
     beyond blogs (already fixed, migration 007) and gallery (fixed this
     session) — worth a dedicated audit pass if Radha wants full
     confidence nothing else is silently local-only.

7. **"Revered Authors & Acharyas yeh pura hardcode hai, control panel se
   bhi edit nahi ho raha" — FIXED. Found 3 separate real problems, not
   just one.**
   - **The actual hardcoded content** (the main complaint): the featured
     "Revered Authors & Acharyas" hero block at the top of `/authors`
     — the Kunjesh Sharma & Poonam Sharma profile cards, Mission/Vision
     text, and bottom CTA box — lives in
     `src/components/home/ShaktiAuthorsSection.tsx` and had a fully
     hardcoded local `authors` array plus hardcoded mission/vision/CTA
     text, with **zero** Control Panel field for any of it. This is
     separate from the generic `authors` DB table (the full Acharyas
     directory grid below it on that same page) — it always specifically
     features the book's own 2 named co-authors with rich bios. Fixed
     the same way as every other batch this project: added
     `SiteSettings.shaktiAuthorsSection` (badge/heading/subtitle + both
     authors' name/title/bio/image/role + mission/vision + CTA text —
     20 fields), `ShaktiAuthorsSection.tsx` now reads
     `siteSettings.shaktiAuthorsSection?.x || DEFAULTS.x` (defaults are
     the exact original hardcoded text/image URLs, verified
     byte-identical), and a new Admin → Control Panel → General →
     "Revered Authors & Acharyas (Featured Section)" block with all 20
     fields (grouped: badge/heading/subtitle, 2 author sub-cards each
     with name/title/role/image/bio, then mission/vision/CTA).
   - **A genuine second bug, on the LIVE public site**: on `/authors`,
     below that hero section, the full Acharyas directory grid was
     rendering `{author.role}` — but the real `Author` TypeScript type
     (`src/types/index.ts`) has no `role` field, only `title`. Every
     single author card on that page was silently showing blank/
     `undefined` for that line. Fixed: `author.role` → `author.title`.
   - **A third, separate gap in the Admin panel itself**: the "Revered
     Authors & Acharyas" list in Admin → Users tab (the generic authors
     CRUD backing that same directory grid) only had Add and Delete —
     `updateAuthor` was imported from `BookContext` but never actually
     called anywhere, so an existing author's name/bio/photo could never
     be corrected once added, only deleted and recreated from scratch
     (losing its `id`/`booksPublished` linkage to that author's books).
     The Add form also silently hardcoded every new author's `title` to
     `'Acharya'` and `location` to `'Varanasi'` — not real inputs at all.
     The list also showed the same `a.role` (should be `a.title`) typo
     as above, in the admin list view itself. Fixed: added a Pencil/Edit
     button per author (opens the same modal pre-filled, matching the
     existing `editingBook`-style edit pattern already used elsewhere in
     this file), added real Title, Location, and Website form fields
     (Website wasn't captured at all before), and the submit handler now
     branches on `editingAuthor` to call `updateAuthor(id, ...)` instead
     of always calling `addAuthor(...)`.
   - No new migration (new field lives in the existing `site_settings`
     JSONB blob same as every other batch; the Author-edit fix uses the
     `authors` table's already-existing columns/RLS via the pre-existing
     `updateAuthor` context function — nothing new in the database at
     all).
   - Verified `tsc --noEmit` + `npm run build` clean.

8. **Pinned-scroll "energetic" motion system — reusable component system
   built, PILOT-DEPLOYED on 2 pages only, remaining ~10 pages
   deliberately NOT done yet, pending confirmation.** A detailed written
   spec was provided (Scene3D pin-on-scroll wrapper + Layer3D staggered
   entrance-animation children + optional ScrollProgressDots side
   indicator, using the project's Framer-Motion-family library, applied
   across ~12 content/marketing pages, explicitly excluding
   Cart/Checkout/Auth/Admin/Dashboard pages).
   - **Built** (all new files, zero risk to existing code):
     `src/components/motion/Scene3D.tsx`, `Layer3D.tsx`,
     `ScrollProgressDots.tsx`. Sticky-based pin (Apple-product-page
     style), ease-out-back overshoot entrance, blur-clears-by-midpoint,
     fast ~30%-of-scroll reveal window with an optional `delay` prop for
     staggering multiple Layer3D children in one Scene3D. Fully respects
     `prefers-reduced-motion` (renders children in normal static flow,
     no pin, no transform) via a context that always supplies a real
     MotionValue (pinned at 1 in static mode) so Layer3D never has to
     special-case a missing/null value. `ScrollProgressDots` was
     restyled to this site's own maroon/gold palette (`#8B1E3F`/
     `#D4AF37`) rather than the generic dark-theme look implied by "the
     approved demo" — not wired into any page yet since it needs a page
     to track its own Scene3D refs, which felt like more surface area
     than this pilot batch needed.
   - **Two corrections to the spec's technical assumptions**: (1) the
     installed package is `motion` (v12, the current name for what used
     to ship as `framer-motion` — same API), not literally
     `framer-motion` — imported as `from 'motion/react'`. (2) The
     `ease: 'backOut'` string the spec's easeOutBack requirement implies
     doesn't type-check against this version's `useTransform` — needed
     the actual `backOut` easing FUNCTION from `motion-utils` (added as
     an explicit new dependency in `package.json`; it was already a
     transitive dependency of `motion`, just not declared directly).
   - **Wired into exactly 2 pilot pages**: `AboutPage.tsx` and
     `FaqPage.tsx` — chosen deliberately instead of starting with
     `HomePage.tsx` (which the spec listed first), because HomePage.tsx
     specifically has a documented production-breaking history around
     section-level changes (see "Homepage sections dynamic ordering" in
     the paused/deferred list below) — piloting on two simpler, recently-
     touched, low-traffic content pages first is the safer test of the
     new system itself before touching that page. Each page's
     Breadcrumbs nav stays outside the pin (never scroll-jacked); the
     rest of each page's content is split into 2 staggered Layer3D
     children (header/intro block, then main content block) inside one
     Scene3D (170vh). No content, copy, props, or handlers were changed
     — purely wrapped.
   - **Real bundle-size cost found and NOT hidden**: the shared chunk
     containing `motion` (pulled in wherever Scene3D/Layer3D is used) is
     **132.57 KB raw / 43.77 KB gzip** — versus AboutPage's own chunk at
     just 4.17 KB and FaqPage's at 3.69 KB. That's a real, measurable
     performance cost landing specifically on these two pages, arriving
     right after the previous session's work to bring mobile LCP down.
     Only pages that actually use Scene3D/Layer3D pull in this chunk
     (confirmed via route-based code-splitting) — pages not touched this
     batch (Home, Cart, Checkout, Admin, etc.) are completely unaffected.
   - **Verified**: `tsc --noEmit` and `npm run build` both clean, checked
     twice — once in-place, once from a completely fresh copy of the
     project directory (not just a fresh zip extract) to rule out any
     leftover build-cache artifacts.
   - **NOT done / explicitly deferred pending Radha's confirmation**:
     the other ~10 pages from the spec's list (`HomePage.tsx`,
     `BooksPage.tsx`, `BookDetailsPage.tsx`, `BlogPage.tsx`,
     `BlogPostPage.tsx`, `GalleryPage.tsx`, `AuthorsPage.tsx`,
     `PoliciesPage.tsx`, `CuriosityPage.tsx`, `GayatriSecretsPage.tsx`,
     `SitemapPage.tsx`) were NOT wired up this session — the reusable
     system is ready for them, but rolling out to 10 more pages
     (including the higher-risk HomePage.tsx) in the same batch as an
     unproven-on-this-project new dependency felt like exactly the kind
     of broad, untested change this project's own established practice
     says to avoid. Also not done: no live-browser scroll-behavior
     testing (pin release, reduced-motion OS setting, actual 60fps
     check on a mid-range phone) — only `tsc`/`build` were verified in
     this sandboched environment, which cannot open a real browser.
   - **A separate, unrelated prompt arrived just before this one** (a
     "Principal WebGL/Three.js architect" request to redesign the site
     as a dark neon agency-portfolio experience with Three.js/GSAP) —
     Radha said that one was sent by mistake and to cancel it; nothing
     from it was implemented, and it is unrelated to this pinned-scroll
     system (which deliberately uses no Three.js/GSAP at all).

9. **"API slow work kar rahi hai bahut" — investigated with real PageSpeed
   Insights data (user ran it on https://shantiseshakti.netlify.app/,
   shared screenshots) — 2 concrete fixes applied, more flagged but not
   fixed.** PSI showed: Mobile Performance 73-75/100, **LCP (Largest
   Contentful Paint) 4.2s on mobile** (target is <2.5s) — the real
   bottleneck, not backend/API data volume (confirmed with Radha: orders
   + reviews are both under 50 rows, and the 9 Supabase queries on
   `BookContext`'s load already run in parallel via `Promise.allSettled`,
   not sequentially, so data volume was ruled out as the cause).
   Root causes found by reading the code alongside the PSI diagnostics:
   - **`ShaktiHeroBanner.tsx`** (the main book-cover image, above the
     fold on the homepage — almost certainly the LCP element) had
     `loading="lazy"` on it. Lazy-loading the LCP candidate is a known
     anti-pattern — it delays the very image the metric measures. Fixed:
     changed to `loading="eager"` + added `fetchPriority="high"`.
   - **The offer popup's image** (`EnterpriseCmsInjector.tsx` — this is
     the same popup fixed earlier in the "wrong Quran-looking image"
     conversation) rendered `activePopup.imageUrl` as a raw `<img
     src={...}>` with no sizing/optimization at all, even though the
     project already has a `getOptimizedImageUrl()` utility (in
     `src/utils/imageOptimizer.ts`, used elsewhere via
     `OptimizedImage.tsx`) that appends Unsplash/Cloudinary resize+quality
     params. The popup image displays at ~176px tall but was loading
     whatever full-resolution URL the admin pasted — directly matches
     PSI's "Improve image delivery" (~100 KiB) and "Use efficient cache
     lifetimes" (~104 KiB) flags, and is a strong second LCP-timing
     contender since the popup appears early and is large on screen.
     Fixed: now runs the image through `getOptimizedImageUrl(url, {
     width: 500, quality: 75 })`, added explicit `width`/`height`
     (500×176) and `loading="eager"` + `decoding="async"`.
   - **Not fixed / flagged for later** (lower confidence of a safe
     one-line fix, or needs Radha's input):
     - PSI's "Legacy JavaScript" (~46 KiB) flag — `vite.config.ts`
       already targets `esnext` and there's no `@vitejs/plugin-legacy` or
       browserslist config, so this is coming from a *dependency* that
       ships pre-transpiled code, not our own build output. Fixing this
       means auditing/replacing a specific npm package — not attempted
       this session.
     - "Render-blocking requests" (150-260ms) and "Reduce unused
       JavaScript" (~79 KiB) — likely font/CSS loading order and
       code-splitting boundaries; not investigated in depth this
       session.
     - Other `<img>` tags across the site missing explicit width/height
       (PSI flagged this generally) — only the two images above were
       audited and fixed; a full sitewide image audit was not done.
     - The PSI report's separate "Agentic Browsing" section flagged
       `llms.txt` as missing a required H1 header and containing no
       links — unrelated to page-load speed (it's for AI-crawler
       friendliness, not Core Web Vitals) — noted here only so it isn't
       mistaken for a performance issue if seen again; not addressed.
   - Verified `tsc --noEmit` + `npm run build` clean. **Not
     independently re-verified with a fresh PageSpeed Insights run this
     session** — ask Radha to re-run PSI on the two fixed pages
     (homepage + wherever the popup shows) after deploying, to confirm
     the LCP number actually drops.

10. **"Codebase mein AI tag hai, remove karke human-team-jaisa code chahiye"
   — DONE.** Two distinct things were found and fixed:
   - **Literal AI-tool branding (the actual "AI tag")**: `metadata.json`
     had `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`
     — a leftover artifact from the original Google AI Studio scaffold,
     not referenced anywhere in the app/build/Netlify config. Removed.
     `vite.config.ts` had a comment literally saying "HMR is disabled in
     AI Studio" — reworded to a generic "preview/CI environments" comment
     (the functional `DISABLE_HMR` env var check is untouched).
   - **Session-log-style code comments**: dozens of comments across the
     codebase followed a distinctive `FIXED (2026-08-29 — "quoted
     Hinglish user message"): explanation` / `FEATURE (control-panel-
     editable static content, batch N: X).` pattern — an obvious AI/
     session-continuity tell (dates, quoted casual user messages, "batch
     N" language). Cleaned up with a scripted regex pass (82 occurrences
     across 23 files) that stripped the `FIXED (...)`/`FEATURE (...)`
     marker prefix while preserving the actual technical explanation
     that followed it, then a manual pass fixing ~20 resulting
     lowercase-sentence-starts for readability. **Important process note
     for future sessions**: the first script attempt had a bug (its
     trailing `\s*` ate the newline after the marker, merging the
     comment line into the very next line of *code* — this actually
     broke 3 `useState` declarations in `AdminPage.tsx`, caught
     immediately by `tsc --noEmit` failing). Fixed by restoring `src/`
     from a pre-cleanup backup and rerunning with a corrected regex
     (`[ \t]*` instead of `\s*` at the end, so it only eats trailing
     spaces on the same line, never the newline). Verified with a
     line-by-line diff afterward that every changed line across all 23
     files was a comment-only change — zero functional/logic lines
     touched. `tsc --noEmit` + `npm run build` both clean.
   - Left alone (already read as normal human-developer style, no
     changes needed): plain `// FIXED: ...` / `// NOTE: ...` comments
     with no date or quoted message — these are a completely ordinary
     comment style, not an AI tell.
   - **Not done / did not check**: this pass covered `src/**/*.ts(x)`
     only. Did not audit `package.json`, `README.md` (if any), git commit
     messages/history, or any other repo metadata for AI mentions — flag
     if Radha wants those checked too.

11. **Admin panel refresh → flash logout then auto-login, felt like "URL
   auto change" — FIXED.** Root cause: `AdminPage.tsx` already had a
   correct `isAuthLoading` gate (from an earlier 2026-08-30 fix) for the
   public `/admin` path — it shows a spinner and only decides
   redirect-vs-render once the real Supabase session re-check finishes.
   But `App.tsx`'s `admin-login` route (the one actually used, via the
   secret `/admin/login-user/gaytri` URL) never got the same gate: on
   every refresh `isAdmin` starts `false` (session re-verification is
   async) and only flips `true` a moment later, so this branch rendered
   `AdminLoginPage` first (looked like a logout) then swapped to
   `AdminPage` the instant the real session resolved (looked like an
   automatic re-login) — every single refresh, for an already-logged-in
   admin. Fixed in `src/App.tsx`: added `isAuthLoading` to the
   `useAuth()` destructure and gated the `admin-login` branch on it,
   showing the same spinner AdminPage already uses while loading, instead
   of ever flashing the wrong screen. No actual logout/URL push was ever
   happening in code — it was a real render-order bug that looked exactly
   like one. Verified `tsc --noEmit` + `npm run build` clean.

12. **Popup Manager — Image/Title/Button-URL not editable — FIXED (user
   reported: production popup showing a wrong/unrelated book-cover image,
   said it "looked hardcoded and couldn't be removed").** Root cause:
   the popup's TEXT was already 100% real Supabase data (not hardcoded —
   `EnterpriseCmsInjector.tsx` renders `activePopup.headline/bodyText/
   imageUrl` straight from `siteSettings.popups`), but the Admin →
   Control Panel → Popups Manager edit form only exposed 3 of the 6
   fields (headline, buttonText, bodyText) — **`title`, `imageUrl`, and
   `buttonUrl` had NO input field at all**, even though they're part of
   the data model and used at render time. So once a popup had a wrong
   image saved (e.g. an old/leftover stock photo predating the 2026-08-31
   "don't default to random stock image" fix), there was no way for the
   admin to see, change, or clear it — exactly the "hardcoded, can't
   remove" symptom reported. Fixed in `src/pages/AdminPage.tsx` (Popups
   Manager, `settingsSubTab === 'popups'`): added a Title input, a Button
   URL input, and an Image URL input with a live thumbnail preview and a
   "हटाएं (Clear)" button to blank it out. No new `SiteSettings` field
   needed — `imageUrl`/`title`/`buttonUrl` already existed on the popup
   object type, just weren't surfaced in the form. Verified
   `tsc --noEmit` + `npm run build` clean.
   **Action needed from user**: open Admin → Control Panel → Popups →
   find the popup showing the wrong image → either paste a correct image
   URL or hit "हटाएं" to clear it → Save.

13. **FAQ / Navbar Labels / Page Banners — batches 3, 4, 5 — DONE (user
   said "All" — delivered all three remaining planned batches together in
   this session; still followed the same safe pattern, one field-group at
   a time, single tsc+build verification at the end).**
   - **Batch 3 (FAQ):** `SiteSettings.faqItems?: {q,a}[]`. `FaqPage.tsx`:
     `DEFAULT_FAQS` holds the exact original 6 Q&As (byte-identical);
     shown whenever `siteSettings.faqItems` is empty/unset. Admin gets a
     full add/edit/delete list editor (same UX pattern as Extra Footer
     Columns) — adding even one FAQ there fully replaces the default list
     on the live page (by design, same as homepageSections/footerColumns
     list semantics).
   - **Batch 4 (Navbar link labels):** `SiteSettings.navLabels?: {books,
     curiosity, gayatriSecrets, authors, gallery, reviews}` (all
     strings). Only the 6 desktop sub-bar links named in the plan were
     touched, only in `Navbar.tsx` (NOT `MobileMenu.tsx` — mobile menu
     labels are a separate, not-yet-done surface, deliberately left
     alone to keep this batch's blast radius small). Emoji prefixes stay
     hardcoded; only the bilingual text after each emoji is overridable,
     e.g. `{siteSettings.navLabels?.books || t('शक्ति से शांति (Books)',
     'Shakti Se Shanti (Books)')}`.
   - **Batch 5 (page banners):** `SiteSettings.pageBanners?:
     {galleryTitle, gallerySubtitle, curiosityTitle, curiositySubtitle,
     gayatriTitle, gayatriSubtitle}`. Scope is ONLY each page's own
     title/subtitle banner text in `GalleryPage.tsx`, `CuriosityPage.tsx`,
     `GayatriSecretsPage.tsx` — NOT the deeper shared body components
     (`CuriosityQuestionsSection.tsx`, `GayatriSecretsSection.tsx`),
     which were deliberately left out of scope (they're shared/larger and
     a future batch of their own if wanted).
   - `src/pages/AdminPage.tsx`: added 4 new state vars (`faqItems`,
     `navLabels`, `pageBanners` — `aboutPage` was already added in the
     previous session), 4 resync-effect lines, 4 save-payload lines, and
     3 new UI blocks in the General sub-tab (Navbar Labels → Page Banners
     → FAQ Manager), each right after the previous batch's block, in that
     order.
   - No new migration (all 3 live in the same `site_settings.settings`
     JSONB blob).
   - Verified `tsc --noEmit` + `npm run build` clean AFTER all 3 batches.

14. **About Page — batch 2 of "make everything Control-Panel-editable" —
   DONE.** Followed the EXACT same safe pattern as Legal Pages (batch 1).
   - `src/types/index.ts`: added `SiteSettings.aboutPage?: { eyebrow?,
     heading?, subtitle?, visionTitle?, visionParagraph1?,
     visionParagraph2?, feature1Title?, feature1Text?, feature2Title?,
     feature2Text?, feature3Title?, feature3Text? }`. No migration needed
     (same JSONB blob as legalPages).
   - `src/pages/AboutPage.tsx`: rewritten. `DEFAULT_ABOUT` holds the EXACT
     original hardcoded text (verified byte-identical) as fallback for
     every field via a small `t(key)` helper. Reads
     `siteSettings.aboutPage?.[key] || DEFAULT_ABOUT[key]` — zero visual
     change until admin edits. The "Website Developed & Deployed by Mr.
     Sitaram Ghintala" attribution line was deliberately left hardcoded
     (not made editable).
   - `src/pages/AdminPage.tsx`: added `aboutPage` state (~line 489, right
     after `legalPages`), added to the resync `useEffect` (right after the
     `legalPages` resync line), added a 12-field textarea block in the
     General sub-tab immediately below the Legal Pages block, and added
     `aboutPage,` to the `handleSaveSettings` payload (right after
     `legalPages,`). Also added `SiteSettings` to the existing `../types`
     import (was missing, needed for the state's type annotation).
   - Verified `tsc --noEmit` + `npm run build` clean.

15. **Custom Pages URL routing bug — FIXED.**
   Custom pages (slug like
   `page-diwali-offer-abc123`, created via Control Panel → Homepage →
   Custom Pages) never got a real URL — `PAGE_TO_PATH` only covers the
   static `PATH_TO_PAGE` map, so `pushState` silently no-op'd for them.
   Content changed but the address bar never did (no working
   refresh/share/back-button). Fixed in `src/App.tsx`:
   `handleNavigate` now pushes `/pages/{slug}` for any page starting with
   `page-`; initial-load and `popstate` handlers now recognize
   `/pages/...` paths and strip the prefix back to the slug. No Netlify
   redirect changes needed (the existing catch-all `/* → /index.html`
   already covers it).

16. **Legal Pages — batch 1 of "make everything Control-Panel-editable".**
   User wants ALL hardcoded content eventually editable from Control
   Panel, explicitly requested SMALL SAFE BATCHES (after an earlier
   session where a bigger dynamic-homepage change broke production — see
   "Past Incident" below). This batch: Privacy/Terms/Shipping/Return
   policy text.
   - `src/types/index.ts`: added `SiteSettings.legalPages?: { privacy?,
     terms?, shipping?, return? }` (light-markdown strings).
   - `src/pages/PoliciesPage.tsx`: rewritten. `DEFAULT_LEGAL_TEXT` holds
     the EXACT original hardcoded text (verified byte-identical) as
     fallback. New tiny `LegalContent` renderer: blank line = paragraph,
     `## ` prefix = heading. Reads `siteSettings.legalPages?.[type] ||
     DEFAULT_LEGAL_TEXT[type]` — zero visual change until admin edits.
   - `src/pages/AdminPage.tsx`: added `legalPages` state (~line 486),
     added to the resync `useEffect` (~line ~1830s), added 4 textareas
     in the General sub-tab (bottom of that block, before its closing
     `)}`), and — **just fixed right before this handoff** — added
     `legalPages,` to the `handleSaveSettings` payload (was missing,
     would have made the whole textarea UI a no-op silently). Verified
     `tsc --noEmit` + `npm run build` clean AFTER this fix.

## PAST INCIDENT (why user wants small batches now)
Earlier in this project's history, HomePage.tsx was made dynamically
section-orderable via `siteSettings.homepageSections`. This broke the live
production homepage (sections went missing/wrong order). It was fully
reverted to a fixed, hardcoded section order (no siteSettings dependency)
to restore reliability. The admin-panel UI for editing homepageSections
still exists and still saves data, but **HomePage.tsx currently ignores
it entirely** — this is intentional, not a bug, until it can be rebuilt
and tested properly. Do not silently reconnect it without discussing with
the user first.

## OTHER FIXES ALREADY DONE THIS PROJECT (don't redo)
- Real (non-fake) QR code on book share modal (`qrcode` npm package now a
  dependency; was previously a static decorative SVG with no encoded data).
- Book gallery: `additional_images` column added (migration 016, extended)
  + `additionalImages` properly read/written (was hardcoded to `[]` on
  read regardless of DB content). Trailer video moved INTO the main image
  slider as its own slide (was previously only in the Description tab,
  duplicated nowhere now).
- Admin panel Media Library / Custom Pages CMS / Popups: "Add" buttons
  used to set a modal-open flag with no modal ever built (did nothing on
  click). Real add/edit/delete modals now built for all three.
- Customer Directory: real add/edit/delete for manually-added contacts
  (new table `manual_customer_contacts`, migration 017); real
  (order-derived) customers get Suspend/Reactivate instead of delete
  (preserves order history).
- Google Sheets backup: Apps Script script was aborting entirely partway
  through if ANY ONE tab's data hit Google Sheets' ~50k char/cell limit —
  fixed with per-tab try/catch in the Apps Script (documented in both
  guide PDFs) + server-side cell truncation safeguard.
- `Promise.all` → `Promise.allSettled` for the main data-load in
  BookContext.tsx (was the root cause of "admin panel shows 0% data"
  reports — one failing query used to blank ALL of books/orders/etc).
- Full rebrand pass: "Dharma Books Pro" → "Shakti Se Shanti Tak" across
  server.ts, manifest.json, README.md, SECURITY_AUDIT_FINAL.md,
  SECURITY_AND_DEPLOYMENT_GUIDE.md, AffiliateContext.tsx CSV filename.
  Deliberately did NOT touch legitimate spiritual/thematic uses of the
  word "Dharma" in book tags/content/quotes (user explicitly required
  this distinction — no blind find-replace).
- Security hardening (earlier in project): RLS policies, admin 2FA email
  OTP, duplicate-registration prevention, persistent (Supabase-backed,
  not in-memory) rate limiting, robots.txt served dynamically via
  `/api/seo/robots-txt` + Netlify redirect (Netlify would otherwise always
  serve the static file, ignoring admin's saved robots.txt setting).

## FILES MOST LIKELY TO NEED FUTURE EDITS
- `src/pages/AdminPage.tsx` — huge, all Control Panel UI lives here.
- `src/context/BookContext.tsx` — all data fetch/save logic.
- `src/types/index.ts` — `SiteSettings` interface for any new
  Control-Panel-editable field.
- `migrations/` — next number is **018** if a new DB column/table is ever
  needed (legalPages did NOT need one — it's inside the JSONB blob).

## UNFINISHED / NEXT STEPS
User wants "sab kuch" (everything) hardcoded made Control-Panel-editable.
**Batches 1–5 are ALL done and verified**: Legal Pages, About Page, FAQ,
Navbar Link Labels (6 desktop sub-bar links only), and Gallery/Curiosity/
Gayatri Secrets page title+subtitle banners.

Deliberately left OUT of scope (not done, flag if user wants these next):
  - `MobileMenu.tsx` nav labels (separate hardcoded copy from Navbar.tsx's
    desktop sub-bar — batch 4 only touched the desktop version)
  - The deeper body content inside `CuriosityQuestionsSection.tsx` and
    `GayatriSecretsSection.tsx` (batch 5 only did each page's top
    title/subtitle banner, not these shared inner components)
  - Any other static page content not yet identified/audited

Each new batch should follow the EXACT same safe pattern used so far: add
an optional field to `SiteSettings`, default = current hardcoded text
(verify byte-identical), read with `siteSettings.x || DEFAULT`, add admin
textarea(s)/inputs + resync-effect line + save-payload line, verify
`tsc --noEmit` + `npm run build` before delivering.

## DEPLOY CHECKLIST FOR THIS SESSION'S CHANGES

### Today's bug/security audit fix (migrations 021, 022, 023)
1. Run migrations 018 → 019 → 020 → 021 → 022 → 023, in that exact order,
   in the Supabase SQL editor, BEFORE deploying this session's code.
2. If the Google Sheets backup is in use: update
   `GOOGLE_APPS_SCRIPT_SHARED_SECRET` in Netlify, and re-paste the full
   updated Apps Script (in `src/lib/googleSheetsBackup.ts`'s bottom
   comment) into the Sheet's Apps Script editor, using the SAME secret
   value in both places. Skip this step only if the backup feature isn't
   being used yet.
3. Place one real test order end-to-end (any payment method) — confirm
   it completes, the success page shows a real order number (not a raw
   UUID), and the tracking page finds it by that same order number.
4. Try to delete a PAID order from the Admin panel — should be refused
   with a message pointing to the status dropdown instead. Then try
   deleting a genuinely unpaid/abandoned test order — should still work.
5. Open the affiliate portal (as a real affiliate account) — dashboard
   and team tabs should load without error.
6. In Admin, add one FAQ, one testimonial, and one video — refresh the
   page (or reopen in a different browser) and confirm each one is still
   there (this is the actual test that migration 023 + the persistence
   fix worked, not just that the form submitted).
7. Submit a review on any book as a logged-in customer — confirm the
   book's public star rating does NOT change until an admin approves
   that review in the Admin panel, then confirm it DOES change the
   moment it's approved.
8. If time allows: run the daily backup once manually and confirm it
   reports success with all tabs, not just some.

### Earlier session's SEO fix (routing + sitemap + edge-function meta tags)
1. ⚠️ Before/after deploying: in Netlify → Site settings → Environment
   variables, confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` have
   the **"Edge functions"** scope checked (not just "Functions"/"Builds").
   This can't be checked from code — has to be done in the Netlify
   dashboard.
2. Deploy the zip as usual.
3. Test real book URLs: from the homepage, click into any book → address
   bar should change to `/book/<something>` (not stay on `/`) → refresh
   the page → same book should still show, not bounce to a different one
   or to home. Click browser Back → should return to the previous page.
4. Same test for a blog post from `/blog`.
5. Test the flagship-book shortcuts specifically (these had the second,
   "always shows books[0]" bug): Navbar's book link, MobileMenu's book
   link, and the homepage's "पूरा विवरण एवं विषय-सूची पढ़ें" button — each
   should land on the correct flagship book, not a random/wrong one.
6. Visit `https://shaktiseshanti.com/sitemap.xml` directly in a browser
   (not `/sitemap`) → should show a full XML list including real book,
   category and blog URLs — not the old ~12-URL static list.
7. Bot/social-preview test (needs the live deploy, can't be done locally):
   paste a `/book/...` URL into a service like
   https://www.opengraph.xyz/ or Facebook's Sharing Debugger
   (developers.facebook.com/tools/debug/) → should show that book's real
   title, description and cover image — not the generic homepage
   title/no-image. If it still shows generic tags, check step 1 first
   (missing env var scope is the most likely cause).

### Earlier sessions
0000000000000. ⚠️ **MOST IMPORTANT ITEM IN THIS WHOLE FILE**: this
     deploy contains the fix for the Razorpay checkout.js script tag
     that was missing from `index.html` — without this specific deploy,
     Razorpay/UPI/Card payments cannot work AT ALL, no matter how
     correctly the API keys are configured. See the new PDF guide
     (`shaktiseshanti-website-live-guide.pdf`) for the full Razorpay +
     domain + migrations go-live walkthrough in Hindi.
000000000000. Test: open a book detail page with a YouTube trailer set
     (or Admin → add/edit a book → paste a `youtu.be/...` link as the
     trailer, which previously always failed) → the video should
     actually play in the gallery now, no black box. Also test Admin →
     Livestream → paste a plain YouTube link (not a pre-made embed URL)
     as the stream URL → should work when viewed live.
00000000000. Test: browse the site broadly after deploying — homepage,
     a book detail page, `/reviews`, livestream section if live, admin
     "Add Author"/"Add Blog"/"Add Photo" forms with no image chosen —
     anywhere an image would previously have been missing/loading,
     confirm you see the new neutral "छवि उपलब्ध नहीं" placeholder box,
     never the old Quran-like stock photo, and never a broken image
     icon either.
0000000000. Run `migrations/020_fix_category_image.sql` in Supabase SQL
     Editor — safe, low-risk single-row UPDATE, no code depends on
     running this before anything else. Then Admin → Categories →
     Bhagavad Gita should have no image set (this field isn't shown
     publicly, so there's nothing else to visually check there).
000000000. Test: hard-refresh the homepage a few times (clear cache /
     incognito is best) and watch the hero book-cover box closely during
     the first 3-4 seconds — should show the "लोड हो रहा है..."
     placeholder box (icon + text, maroon gradient), NEVER the old
     Quran-like stock photo, then swap to the real cover once it loads.
     **Separately, and not fixed by this deploy**: go to Admin →
     Control Panel → Popups → find the popup still showing that same
     stock photo → paste a correct image URL or click "हटाएं" → Save —
     this is a manual data fix only Radha can do, not something in this
     code change.
00000000. ⚠️ **RUN migration 019 TOO, SAME AS 018, BEFORE DEPLOYING.**
     Open Supabase → SQL Editor → paste and run the full contents of
     `migrations/019_customer_review_columns.sql` (adds business_name/
     city/photo_url/video_url/thumbnail_url/is_verified to
     `public.reviews`). Additive/nullable columns, so it's lower-risk
     than 018, but the Write Review form on `/reviews` will keep
     silently losing customer photos/videos/business-name/city until
     this runs.
0000000. ⚠️ **RUN THE NEW MIGRATION FIRST, BEFORE DEPLOYING THIS CODE.**
     Open Supabase → SQL Editor → paste and run the full contents of
     `migrations/018_gallery_table.sql` → confirm it succeeds (creates
     the `gallery` table, seeds 4 photos). Only THEN deploy this zip.
     Deploying the code first (or skipping this step) will make the
     Admin Gallery tab and the public `/gallery` page silently fail
     their query against a table that doesn't exist yet.
0000. Test: open `/reviews` on a fresh browser (or after clearing your
      own admin session) — if there are genuinely zero real reviews in
      the database, you should see the new inviting empty state
      ("अभी तक कोई समीक्षा नहीं है..."), NOT the 5 fake testimonials
      (पं. रामेश्वर प्रसाद शर्मा, डॉ. मीनाक्षी सुब्रमण्यम, etc.) that
      used to always show — those are gone for good now. Submit a real
      test review with a photo attached → as admin, reload `/reviews`
      → you should see it with a "Pending Approval" badge → click the
      green checkmark to Approve → badge should disappear and the
      review (with its photo) should now show for a logged-out/regular
      visitor too. Also click the "Toggle Verified Badge" button on an
      already-approved review and confirm it does NOT disappear from
      the public page (this was the accidental-unpublish bug).
0000. Test: open `/gallery` — should look identical to before (same 4
      photos, since the migration seeds the exact same data). Then
      Admin → Gallery tab → "+ Add Photo" → fill in Title + upload a
      photo → Save → reload `/gallery` on the live site (not just the
      admin) → the new photo should actually appear for a real visitor,
      not just in the admin's own browser. Also test deleting a photo
      from the admin list and confirm it's gone from `/gallery` too.
0000. Test: Admin → Articles tab → Publish a new article with a Category
      filled in → confirm the article shows the correct author name in
      the admin list (was blank before this fix).
000. Test: Admin panel → Control Panel → General → "Revered Authors &
     Acharyas (Featured Section)" → edit one field (e.g. Author 1's
     bio) → Save → reload `/authors` → should show the new text. Also
     test: Admin → Users tab → click the pencil icon on an existing
     author → edit their Title → Save → confirm it actually updates
     (previously this silently did nothing useful since there was no
     edit button at all).
000. New pinned-scroll motion system — test on both `/about` and `/faq`:
     scroll down slowly through each page and confirm (a) the header
     block then the content block reveal one after another with a
     little bounce, no blank gaps; (b) once revealed, content stays
     fully visible and readable while you keep scrolling through that
     section (it should NOT fade back out); (c) the FAQ search box and
     accordion still work exactly as before; (d) turn on your OS's
     "reduce motion" setting (Android: Settings → Accessibility →
     Remove animations; iOS: Settings → Accessibility → Motion → Reduce
     Motion) and reload both pages — everything should show normally
     with zero scroll-pinning or animation. This is new, so it's worth
     a real look before deciding whether to roll it out to more pages.
00. After deploying, re-run https://pagespeed.web.dev/ on
    https://shantiseshakti.netlify.app/ (Mobile tab) and compare the LCP
    number to the 4.2s baseline from this session — should drop
    noticeably. Also spot-check that the homepage hero book-cover image
    and the offer popup's image both still display correctly (not
    broken/blank) — that's the main regression risk from this batch.
0. AI-tag cleanup (comments + metadata.json) is comment/metadata-only —
   no behavior change, nothing new to click-test for it. Just deploy and
   confirm the site loads/behaves exactly as before.
1. No new migration needed (legalPages, aboutPage, faqItems, navLabels,
   pageBanners all live in the existing JSONB column).
2. Deploy latest zip to Netlify as usual.
3. Test: login to Admin via `/admin/login-user/gaytri`, then hard-refresh
   the browser (F5) while on the admin panel — should show a brief
   spinner only, no flash of the login form, and stay on the admin panel
   (this session's main fix).
4. Test: visit a custom page, refresh the browser — should stay on that
   page (was: bounced to home/lost content on refresh).
5. Test: Admin → Control Panel → General tab (bottom) → Legal Pages →
   edit one, Save, reload the actual policy page → should show new text.
6. Test: Admin → Control Panel → General tab (bottom) → About Page →
   edit a field (e.g. heading), Save, reload `/about` → should show new
   text. Leave all fields blank on a fresh site → `/about` should look
   pixel-identical to before this change.
7. Test: Admin → Control Panel → General tab (bottom) → Navbar Link
   Labels → edit one (e.g. Gallery), Save, reload any page → the desktop
   sub-bar link text should change; the emoji and the mobile menu should
   be unaffected.
8. Test: Admin → Control Panel → General tab (bottom) → Page Banners →
   edit Curiosity title/subtitle, Save, reload `/curiosity` → banner
   should show new text; body content below unaffected.
9. Test: Admin → Control Panel → General tab (bottom) → FAQ Manager →
   Add FAQ, Save, reload `/faq` → new question should appear (replacing
   the default list, same as other list-type settings).
10. Test: Admin → Control Panel → Popups → open the existing popup with
    the wrong/unrelated image → paste a correct Image URL (or hit
    "हटाएं" to clear it) → preview thumbnail should update → Save →
    reload the storefront → popup should show the corrected/no image.
