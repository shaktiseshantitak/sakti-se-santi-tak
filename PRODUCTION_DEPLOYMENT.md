# DHARMA BOOKS PRO - PRODUCTION DEPLOYMENT GUIDE

**Version:** 2.0.0 (Hardened Enterprise Release)  
**Target Architecture:** Cloud Run Container / Express Node.js Server + Vite React SPA + Supabase PostgreSQL + Razorpay Gateway  

---

## 1. Prerequisites & Environment Setup

Ensure the following environment variables are set in your production environment (e.g. Cloud Run, Secret Manager, or `.env`):

```bash
PORT=3000
NODE_ENV=production

# Supabase DB & Auth Secrets
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Razorpay Payment Secrets
RAZORPAY_KEY_ID=rzp_live_<your_key_id>
RAZORPAY_KEY_SECRET=<your_key_secret>
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>
```

---

## 2. Database Initialization (Supabase PostgreSQL)

1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the full schema script provided in `supabase_schema.sql`.
3. Verify that the following tables and RLS policies are active:
   - `public.profiles`
   - `public.user_roles`
   - `public.books`
   - `public.orders`
   - `public.payments`
   - `public.affiliate_wallets`
   - `public.audit_logs`
4. Assign the initial administrator role to your admin account in the `user_roles` table:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('<your-admin-user-id>', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

---

## 3. Building & Launching the Server

### Local Development / Test
```bash
npm run dev
```

### Production Build & Launch
```bash
# 1. Compile frontend Vite SPA & bundle Express server.ts into dist/server.cjs
npm run build

# 2. Launch production Node.js server on port 3000
npm start
```

---

## 4. Razorpay Payment Gateway Webhook Setup

1. Log into your **Razorpay Dashboard** -> **Settings** -> **Webhooks**.
2. Add Webhook URL: `https://your-domain.com/api/payment/webhook`
3. Select Active Event: `payment.captured`
4. Copy the Webhook Secret and assign it to `RAZORPAY_WEBHOOK_SECRET`.

---

## 5. Security & Verification Checks

Before launching to live traffic, verify the following endpoints using curl or Postman:

- **Health Check:** `GET /api/health` -> Expect `{ "status": "ok", "supabaseConnected": true }`
- **Order Creation Test:** `POST /api/orders/create` -> Verify server-side total calculation.
- **Rate Limit Test:** Make > 30 requests/min to verify rate limiter returns HTTP 429.
