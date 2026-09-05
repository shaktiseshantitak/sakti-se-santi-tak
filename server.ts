import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { runDailyBackup } from './src/lib/googleSheetsBackup';

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Helper to instantiate Cloudflare R2 S3 Client
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// Raw body parser for Webhook signature verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Standard JSON body parser for all other routes (supports up to 50MB for media uploads)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/payment/webhook') {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

// Production Security Headers with Real Content-Security-Policy (CSP)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;"
  );
  next();
});

// FIXED (security audit — in-memory rate limiting is unsafe under
// Netlify's serverless architecture): the counters below now live in
// Postgres via check_and_increment_rate_limit (migration 012), which is
// shared by every function instance, instead of a local Map that a
// concurrent request could land on a fresh copy of. The in-memory Maps
// are kept ONLY as a same-behavior fallback for local/dev use when
// Supabase isn't configured at all (e.g. previewing the UI with no
// backend wired up yet) — never a silent substitute in production, since
// supabaseServer is set from real deployment env vars whenever they're
// present.
async function enforceRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  fallbackMap: Map<string, { count: number; resetTime: number }>
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer.rpc('check_and_increment_rate_limit', {
        p_key: key,
        p_max_requests: maxRequests,
        p_window_seconds: windowSeconds,
      });
      if (!error && data && data[0]) {
        return { allowed: Boolean(data[0].allowed), retryAfterSeconds: Number(data[0].retry_after_seconds || 0) };
      }
      console.error('[Rate Limit] RPC error, failing open for this request:', error);
      // Fails OPEN (allows the request) rather than blocking real traffic
      // if Postgres itself is briefly unreachable — an outage in the rate
      // limiter shouldn't take down checkout/login entirely.
      return { allowed: true, retryAfterSeconds: 0 };
    } catch (err) {
      console.error('[Rate Limit] RPC exception, failing open for this request:', err);
      return { allowed: true, retryAfterSeconds: 0 };
    }
  }

  // Local in-memory fallback (dev/preview only — see note above).
  const now = Date.now();
  const record = fallbackMap.get(key);
  if (!record || now > record.resetTime) {
    fallbackMap.set(key, { count: 1, resetTime: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (record.count >= maxRequests) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000) };
  }
  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

// Rate limiting for API endpoints
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 60;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { allowed } = await enforceRateLimit(`api:${ip}`, maxRequestsPerWindow, rateLimitWindowMs / 1000, ipRequestCounts);

  if (!allowed) {
    return res.status(429).json({
      error: 'Too many requests. Please try again in 1 minute.',
    });
  }

  next();
};

app.use('/api/', rateLimiter);

// Dedicated Strict Rate Limiter for Auth/MFA (5 attempts / 15 minutes per IP+email)
const authRateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const maxAuthRequestsPerWindow = 5;
const authAttemptCounts = new Map<string, { count: number; resetTime: number }>();

const authRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const rawIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const email = (req.body?.email || req.body?.username || 'anonymous').toLowerCase().trim();
  const compositeKey = `auth:${rawIp}:${email}`;

  const { allowed, retryAfterSeconds } = await enforceRateLimit(
    compositeKey, maxAuthRequestsPerWindow, authRateLimitWindowMs / 1000, authAttemptCounts
  );

  if (!allowed) {
    const minutesLeft = Math.ceil(retryAfterSeconds / 60);
    return res.status(429).json({
      error: `Too many login/MFA verification attempts. Account security lockout active. Please try again in ${minutesLeft} minute(s).`,
      lockout: true,
      retryAfterMinutes: minutesLeft,
    });
  }

  next();
};

app.use('/api/auth/', authRateLimiter);

app.post('/api/auth/login', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Auth rate limit check passed' });
});

app.post('/api/auth/verify-mfa', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MFA rate limit check passed' });
});

// Supabase client initialization (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseServer = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper function to authenticate bearer token with Supabase
const authenticateUser = async (req: Request) => {
  if (!supabaseServer) return null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const { data, error } = await supabaseServer.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
  } catch (err) {
    return null;
  }
};

// FIXED (2026-08-29 — "orders placed even when payment fails"): shared by
// the new /api/payment/cancel-unpaid-order endpoint AND every failure path
// inside /api/payment/verify. Cancels an order that's still 'Awaiting
// Payment' and restores the stock that was optimistically decremented at
// order-creation time — see migration 015's increment_inventory. Guarded
// so it only ever touches an order that's genuinely still unpaid (never a
// real 'Processing'/'Paid' order), and is safe to call more than once.
async function cancelUnpaidOrderAndRestoreStock(orderId: string, userId: string): Promise<boolean> {
  if (!supabaseServer) return false;

  const { data: order } = await supabaseServer
    .from('orders')
    .select('id, user_id, order_status')
    .eq('id', orderId)
    .single();

  if (!order || order.user_id !== userId || order.order_status !== 'Awaiting Payment') {
    return false; // already resolved (paid/cancelled) or not this user's order — no-op
  }

  const { data: items } = await supabaseServer
    .from('order_items')
    .select('book_id, quantity')
    .eq('order_id', orderId);

  for (const item of items || []) {
    const { error } = await supabaseServer.rpc('increment_inventory', {
      p_book_id: item.book_id,
      p_quantity: item.quantity,
    });
    if (error) console.error(`[Cancel Unpaid Order] stock restore failed for ${item.book_id}:`, error);
    else {
      await supabaseServer.from('inventory_movements').insert([{
        book_id: item.book_id,
        change_quantity: item.quantity,
        movement_type: 'ORDER_PAYMENT_FAILED',
        reference_id: orderId,
        notes: `Stock restored — order ${orderId} payment never completed.`,
      }]);
    }
  }

  await supabaseServer
    .from('orders')
    .update({ order_status: 'Cancelled', payment_status: 'Failed', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  return true;
}

// Timing-safe comparison helper
const timingSafeEqualString = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

// ==========================================
// 1. HEALTH CHECK ENDPOINT
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Dharma Books Pro Production API',
    supabaseConnected: Boolean(supabaseServer),
    timestamp: new Date().toISOString(),
  });
});

// FIXED (2026-08-29 — "Control Panel is dummy"): serves the admin's saved
// robots.txt rules for real — see the netlify.toml redirect that routes
// /robots.txt here, since Netlify would otherwise always serve the static
// public/robots.txt file regardless of what's saved in site_settings.
app.get('/api/seo/robots-txt', async (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  const fallback = 'User-agent: *\nAllow: /\n\nSitemap: https://shaktiseshanti.com/sitemap.xml\n';
  if (!supabaseServer) return res.send(fallback);
  const { data } = await supabaseServer.from('site_settings').select('settings').eq('id', 'default').maybeSingle();
  const rules = data?.settings?.seo?.robotsTxtRules;
  res.send(rules && rules.trim() ? rules : fallback);
});

// ==========================================
// 1C. ADMIN: UPDATE ORDER STATUS (real history + stock restore on cancel)
// ==========================================
// FIXED (2026-08-29 — "Implement manual tracking update... Customers
// should see all these details in their order history/tracking page" +
// "automatically update inventory... increase stock on cancellation"):
// the old client-side updateOrderStatus only ever touched orders.order_
// status — it never wrote to order_status_history (so the customer-facing
// timeline had nothing real to show and fell back to decorative fixed
// text) and never restored stock when an order was cancelled after
// already being paid/confirmed (stock is reserved at order-confirmation
// time — see /api/orders/create — so a cancellation needs to give it
// back, or it's gone from inventory forever for a sale that didn't
// happen).
app.post('/api/admin/update-order-status', async (req: Request, res: Response) => {
  try {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    if (!supabaseServer) return res.status(500).json({ error: 'Database not configured.' });

    const { data: roleRow } = await supabaseServer.from('user_roles').select('role').eq('user_id', user.id).single();
    if (roleRow?.role !== 'admin') return res.status(403).json({ error: 'Admin privileges required.' });

    const { orderId, newStatus, note } = req.body;
    if (!orderId || !newStatus) return res.status(400).json({ error: 'orderId and newStatus are required.' });

    const { data: order } = await supabaseServer.from('orders').select('id, order_status').eq('id', orderId).single();
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const wasAlreadyCancelled = order.order_status === 'Cancelled';

    await supabaseServer.from('orders').update({
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);

    // Real, timestamped history entry — this is what the customer's
    // tracking page timeline now actually reads from.
    await supabaseServer.from('order_status_history').insert([{
      order_id: orderId,
      status: newStatus,
      notes: note || null,
      updated_by: user.id,
    }]);

    // Stock was reserved (decremented) the moment this order was
    // confirmed/paid. Cancelling it after that point means that stock
    // needs to come back — but only once, guarded against an order
    // already sitting at 'Cancelled' being "re-cancelled".
    if (newStatus === 'Cancelled' && !wasAlreadyCancelled) {
      const { data: items } = await supabaseServer.from('order_items').select('book_id, quantity').eq('order_id', orderId);
      for (const item of items || []) {
        const { error: incErr } = await supabaseServer.rpc('increment_inventory', {
          p_book_id: item.book_id, p_quantity: item.quantity,
        });
        if (!incErr) {
          await supabaseServer.from('inventory_movements').insert([{
            book_id: item.book_id,
            change_quantity: item.quantity,
            movement_type: 'ORDER_CANCELLED',
            reference_id: orderId,
            notes: `Stock restored — order ${orderId} cancelled by admin.`,
          }]);
        }
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Update Order Status] Failed:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
});


// ==========================================
// Runs once a day automatically (see netlify/functions/daily-backup.ts,
// scheduled via netlify.toml), and can also be triggered on demand from
// the admin panel's "Backup Now" button. Requires admin auth for the
// manual trigger — the scheduled function calls runDailyBackup() directly
// and doesn't go through this HTTP route at all.
app.post('/api/admin/backup-now', async (req: Request, res: Response) => {
  try {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    if (!supabaseServer) return res.status(500).json({ error: 'Database not configured.' });

    const { data: roleRow } = await supabaseServer
      .from('user_roles').select('role').eq('user_id', user.id).single();
    if (roleRow?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required.' });
    }

    const results = await runDailyBackup(supabaseServer);
    return res.json({ success: true, results });
  } catch (err: any) {
    console.error('[Backup Now] Failed:', err);
    return res.status(500).json({ error: err.message || 'Backup failed. Check server logs.' });
  }
});

// ==========================================
// 2. SERVER-SIDE SECURE ORDER CREATION
// ==========================================
app.post('/api/orders/create', async (req: Request, res: Response) => {
  try {
    if (!supabaseServer) {
      return res.status(503).json({
        error: 'Ordering service is temporarily unavailable. Database/Backend connection required.',
      });
    }

    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to place an order.' });
    }

    const { items, shippingAddress, couponCode, paymentMethod, referralCode } = req.body;

    // FIXED: server-side enforcement of admin payment-method toggles —
    // never trust that a disabled method is only hidden client-side.
    const { data: settingsRow } = await supabaseServer.from('site_settings').select('settings').eq('id', 'default').maybeSingle();
    const s = settingsRow?.settings || {};
    const methodAllowed =
      paymentMethod === 'COD' ? (s.enableCod ?? true) :
      paymentMethod === 'UPI' ? (s.enableUpi ?? true) :
      (s.enableOnlinePayment ?? true);
    if (!methodAllowed) {
      return res.status(400).json({ error: `${paymentMethod} is currently unavailable. Please choose another payment method.` });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one valid item.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.pincode) {
      return res.status(400).json({ error: 'Complete and valid shipping address is required.' });
    }

    // Call stored procedure or validate and execute atomic order transaction
    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const quantity = Math.floor(Number(item.quantity));
      if (isNaN(quantity) || quantity <= 0 || quantity > 50) {
        return res.status(400).json({ error: 'Invalid item quantity specified.' });
      }

      const { data: book, error } = await supabaseServer
        .from('books')
        .select('id, title, price, offer_price, discount_percent, stock, cover_image')
        .eq('id', item.bookId)
        .single();

      if (error || !book) {
        return res.status(400).json({ error: `Product with ID ${item.bookId} was not found.` });
      }

      if (book.stock < quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${book.title}". Available: ${book.stock}` });
      }

      const actualUnitPrice = Number(book.offer_price || book.price);
      const itemTotal = Math.round(actualUnitPrice * quantity * 100) / 100;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        bookId: book.id,
        bookTitle: book.title,
        coverImage: book.cover_image,
        unitPrice: actualUnitPrice,
        quantity,
        totalPrice: itemTotal,
        format: item.format || 'Hardcover',
        language: item.language || 'Hindi',
      });
    }

    // Coupon discount calculation server-side
    // FIXED: this previously only checked is_active — an expired coupon
    // (expires_at in the past), one below its min_order_amount, or one past
    // its usage_limit would all still apply successfully, since none of
    // those were ever checked here. This runs on the service-role client,
    // which bypasses the RLS policy that enforces expiry for normal clients
    // — so the DB wasn't silently protecting this path either.
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    if (couponCode) {
      const cleanCode = String(couponCode).toUpperCase().trim();
      const { data: coupon } = await supabaseServer
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .single();

      const isExpired = coupon?.expires_at && new Date(coupon.expires_at) < new Date();
      const belowMinOrder = coupon && calculatedSubtotal < Number(coupon.min_order_amount || 0);
      const usageExhausted = coupon?.usage_limit != null && Number(coupon.times_used || 0) >= Number(coupon.usage_limit);
      // Migration 014: product-scoped coupons. Re-checked here server-side —
      // never trust the client's claim that the restricted book was in cart.
      const wrongProduct = coupon?.applicable_book_id &&
        !items.some((it: any) => it.bookId === coupon.applicable_book_id);

      if (coupon && !isExpired && !belowMinOrder && !usageExhausted && !wrongProduct) {
        appliedCouponId = coupon.id;
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.round(calculatedSubtotal * (coupon.discount_value / 100) * 100) / 100;
        } else {
          discountAmount = Math.min(calculatedSubtotal, coupon.discount_value);
        }
      } else if (!coupon && cleanCode === 'RAMA108') {
        discountAmount = Math.round(calculatedSubtotal * 0.1 * 100) / 100; // 10% discount fallback coupon
      }
    }

    const afterDiscount = Math.max(0, calculatedSubtotal - discountAmount);
    const taxAmount = Math.round(afterDiscount * 0.05 * 100) / 100; // 5% GST
    const shippingCharge = afterDiscount >= 499 ? 0 : 50;
    const finalTotalAmount = Math.round((afterDiscount + taxAmount + shippingCharge) * 100) / 100;

    const orderNumber = `DH-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Validate the referral code, if any, against real affiliate accounts —
    // previously this was read from the request and then silently discarded
    // (never stored, never used for anything), so referral commission could
    // never actually be calculated or credited for any order.
    let validatedReferralCode: string | null = null;
    if (referralCode) {
      const { data: refAccount } = await supabaseServer
        .from('affiliate_accounts')
        .select('referral_code')
        .eq('referral_code', String(referralCode).toUpperCase().trim())
        .eq('status', 'active')
        .maybeSingle();
      if (refAccount) {
        validatedReferralCode = refAccount.referral_code;
      }
    }

    // Database Atomic Order Creation
    const { data: dbOrder, error: orderErr } = await supabaseServer
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id: user.id,
        shipping_address: shippingAddress,
        subtotal: calculatedSubtotal,
        discount_amount: discountAmount,
        shipping_charge: shippingCharge,
        tax_amount: taxAmount,
        total_amount: finalTotalAmount,
        payment_method: paymentMethod || 'UPI',
        payment_status: paymentMethod === 'COD' ? 'Pending' : 'Pending Verification',
        // FIXED (2026-08-29 — "orders placed even when payment fails"):
        // online-payment orders no longer start as 'Processing' (a status
        // customers and admins see as a real, confirmed order). They start
        // as 'Awaiting Payment' and only become 'Processing' once
        // /api/payment/verify confirms a real successful payment — see
        // migration 015. If the customer abandons/fails payment, this
        // order gets explicitly cancelled and its stock restored instead
        // of silently lingering as a phantom "Processing" order forever.
        // COD is unaffected: COD payment is inherently deferred to
        // delivery, so an immediate 'Processing' order is correct there.
        order_status: paymentMethod === 'COD' ? 'Processing' : 'Awaiting Payment',
        coupon_code_used: couponCode || null,
        referral_code_used: validatedReferralCode,
        created_at: new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (orderErr || !dbOrder) {
      console.error('[API Order Create DB Error]:', orderErr);
      return res.status(500).json({ error: 'Failed to record order in database.' });
    }

    const orderId = dbOrder.id;

    // Insert relational order items
    const orderItemsRows = validatedItems.map(item => ({
      order_id: orderId,
      book_id: item.bookId,
      book_title: item.bookTitle,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      total_price: item.totalPrice,
      format: item.format,
      language: item.language,
    }));

    const { error: itemsErr } = await supabaseServer.from('order_items').insert(orderItemsRows);
    if (itemsErr) {
      console.error('[API Order Create] order_items insert failed:', itemsErr);
      await supabaseServer.from('orders').update({ order_status: 'Cancelled', payment_status: 'Failed' }).eq('id', orderId);
      return res.status(500).json({ error: 'Failed to record order items. Order has been cancelled — please try again.' });
    }

    // Atomic Stock Decrement & Inventory Movement.
    // decrement_inventory() only succeeds if stock >= quantity at the time it runs (row-locked
    // UPDATE), so a concurrent order for the same book can legitimately cause this to fail here
    // even though the earlier pre-check passed. Previously this RPC call's result was never
    // checked, so a failed decrement (e.g. someone else bought the last copies first) still
    // resulted in a "successful" order — an oversold order with no matching stock deduction.
    const stockFailures: string[] = [];
    for (const item of validatedItems) {
      const { error: decErr } = await supabaseServer.rpc('decrement_inventory', {
        p_book_id: item.bookId,
        p_quantity: item.quantity,
      });

      if (decErr) {
        console.error(`[API Order Create] decrement_inventory failed for ${item.bookId}:`, decErr);
        stockFailures.push(item.bookTitle);
        continue;
      }

      await supabaseServer.from('inventory_movements').insert([{
        book_id: item.bookId,
        change_quantity: -item.quantity,
        movement_type: 'ORDER_PLACED',
        reference_id: orderId,
        notes: `Order ${orderNumber} placed by user ${user.id}`,
      }]);
    }

    if (stockFailures.length > 0) {
      // Roll the order back rather than confirming an order we can't actually fulfill.
      await supabaseServer.from('orders').update({ order_status: 'Cancelled', payment_status: 'Failed' }).eq('id', orderId);
      return res.status(409).json({
        error: `Stock ran out while placing your order for: ${stockFailures.join(', ')}. Your order was not confirmed — please review your cart and try again.`,
      });
    }

    // Record coupon usage now that the order is confirmed (atomic RPC — see
    // migration 009 — so concurrent checkouts using the same coupon don't
    // lose increments to a read-then-write race). Best-effort: a failure here
    // shouldn't fail an otherwise-successful order.
    if (appliedCouponId) {
      const { error: usageErr } = await supabaseServer.rpc('increment_coupon_usage', { p_coupon_id: appliedCouponId });
      if (usageErr) console.error('[API Order Create] increment_coupon_usage failed:', usageErr);
    }

    return res.json({
      success: true,
      orderId,
      orderNumber,
      subtotal: calculatedSubtotal,
      discountAmount,
      taxAmount,
      shippingCharge,
      totalAmount: finalTotalAmount,
      currency: 'INR',
    });
  } catch (err: any) {
    console.error('[API Order Create Exception]:', err);
    return res.status(500).json({ error: 'Server error processing order creation.' });
  }
});

// ==========================================
// 3. SECURE RAZORPAY PAYMENT CREATION
// ==========================================
app.post('/api/payment/create-order', async (req: Request, res: Response) => {
  try {
    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(503).json({
        configured: false,
        error: 'Online payment is temporarily unavailable. Razorpay keys are not configured.',
      });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    // Load order authoritatively from DB
    const { data: dbOrder, error: orderErr } = await supabaseServer
      .from('orders')
      .select('id, user_id, total_amount, payment_status, order_number')
      .eq('id', orderId)
      .single();

    if (orderErr || !dbOrder) {
      return res.status(404).json({ error: 'Order not found in database.' });
    }

    if (dbOrder.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized order payment attempt.' });
    }

    if (dbOrder.payment_status === 'Paid') {
      return res.status(400).json({ error: 'Order is already paid.' });
    }

    const amountInPaise = Math.round(Number(dbOrder.total_amount) * 100);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: dbOrder.order_number,
        payment_capture: 1,
        notes: {
          order_id: dbOrder.id,
          user_id: user.id,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.description || 'Razorpay order creation failed.' });
    }

    // Bind razorpay_order_id to DB order
    await supabaseServer
      .from('orders')
      .update({ razorpay_order_id: data.id })
      .eq('id', dbOrder.id);

    return res.json({
      configured: true,
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
      orderId: dbOrder.id,
    });
  } catch (err: any) {
    console.error('[API Payment Create Order Exception]:', err);
    return res.status(500).json({ error: 'Server payment order creation error.' });
  }
});

// ==========================================
// 4B. CANCEL AN UNPAID ORDER (Razorpay popup closed / abandoned)
// ==========================================
app.post('/api/payment/cancel-unpaid-order', async (req: Request, res: Response) => {
  try {
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });

    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, error: 'orderId is required.' });

    const cancelled = await cancelUnpaidOrderAndRestoreStock(orderId, user.id);
    return res.json({ success: true, cancelled });
  } catch (err: any) {
    console.error('[Cancel Unpaid Order] Exception:', err);
    return res.status(500).json({ success: false, error: 'Failed to cancel order.' });
  }
});

// ==========================================
// 4. SECURE RAZORPAY SIGNATURE VERIFICATION
// ==========================================
app.post('/api/payment/verify', async (req: Request, res: Response) => {
  try {
    if (!supabaseServer) {
      return res.status(503).json({ success: false, error: 'Database service unavailable.' });
    }

    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, error: 'Razorpay Key Secret is missing.' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, error: 'Missing required Razorpay verification parameters.' });
    }

    // Load DB Order
    const { data: dbOrder, error: orderErr } = await supabaseServer
      .from('orders')
      .select('id, user_id, razorpay_order_id, payment_status, total_amount')
      .eq('id', orderId)
      .single();

    if (orderErr || !dbOrder) {
      return res.status(404).json({ success: false, error: 'Target order not found.' });
    }

    if (dbOrder.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'Order ownership verification failed.' });
    }

    // Verify razorpay_order_id matches database binding
    if (dbOrder.razorpay_order_id && dbOrder.razorpay_order_id !== razorpay_order_id) {
      await cancelUnpaidOrderAndRestoreStock(orderId, user.id);
      return res.status(400).json({ success: false, error: 'Razorpay Order ID mismatch.' });
    }

    // Timing-safe HMAC SHA-256 signature verification
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (!timingSafeEqualString(generatedSignature, razorpay_signature)) {
      await cancelUnpaidOrderAndRestoreStock(orderId, user.id);
      return res.status(400).json({ success: false, error: 'Invalid payment signature. Payment rejected.' });
    }

    // Mark Order as Paid
    await supabaseServer
      .from('orders')
      .update({
        payment_status: 'Paid',
        payment_transaction_id: razorpay_payment_id,
        order_status: 'Processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // NOTE: real 3-level affiliate commission crediting happens automatically
    // via a database trigger (migration 010, trg_credit_affiliate_commission)
    // whenever payment_status transitions to 'Paid' — not called explicitly
    // here, so it also covers COD orders marked paid from the admin panel and
    // the Razorpay webhook path, with one single, idempotent mechanism.

    // Audit log payment entry
    await supabaseServer
      .from('payments')
      .insert([{
        order_id: orderId,
        transaction_id: razorpay_payment_id,
        razorpay_order_id,
        gateway: 'Razorpay',
        status: 'paid',
        amount: dbOrder.total_amount,
        currency: 'INR',
        raw_response: { razorpay_order_id, razorpay_payment_id },
        created_at: new Date().toISOString(),
      }]);

    // Record audit log
    await supabaseServer
      .from('audit_logs')
      .insert([{
        user_id: user.id,
        action: 'PAYMENT_VERIFIED',
        resource: 'orders',
        details: { order_id: orderId, razorpay_payment_id, amount: dbOrder.total_amount },
        ip_address: req.ip || 'unknown',
      }]);

    return res.json({
      success: true,
      message: 'Payment verified and recorded successfully.',
      transactionId: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error('[API Payment Verify Exception]:', err);
    return res.status(500).json({ success: false, error: 'Server error during payment verification.' });
  }
});

// ==========================================
// 5. SECURE RAZORPAY WEBHOOK ENDPOINT
// ==========================================
app.post('/api/payment/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(503).json({ error: 'Webhook secret not configured.' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature header.' });
    }

    // Extract raw body buffer
    const rawBodyBuffer = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBodyBuffer);
    const expectedSignature = hmac.digest('hex');

    if (!timingSafeEqualString(signature, expectedSignature)) {
      return res.status(400).json({ error: 'Webhook signature verification failed.' });
    }

    const event = JSON.parse(rawBodyBuffer.toString('utf8'));
    const eventId = event.event_id || `${event.event}_${Date.now()}`;

    // Check Webhook Idempotency in database
    if (supabaseServer) {
      const { data: existingEvent } = await supabaseServer
        .from('payment_events')
        .select('id')
        .eq('gateway_event_id', eventId)
        .single();

      if (existingEvent) {
        return res.json({ status: 'ok', message: 'Event already processed.' });
      }

      await supabaseServer.from('payment_events').insert([{
        gateway_event_id: eventId,
        event_type: event.event,
        payload: event,
        processed_at: new Date().toISOString(),
      }]);

      if (event.event === 'payment.captured') {
        const paymentEntity = event.payload.payment.entity;
        const orderId = paymentEntity.notes?.order_id;

        if (orderId) {
          await supabaseServer
            .from('orders')
            .update({
              payment_status: 'Paid',
              payment_transaction_id: paymentEntity.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
          // Commission crediting handled by the trg_credit_affiliate_commission
          // trigger (migration 010) — fires automatically on this update.
        }
      }
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[API Webhook Exception]:', err);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
});

// ==========================================
// 5. SECURE ORDER TRACKING (RATE-LIMITED, IDOR-PROTECTED)
// ==========================================
const trackRateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function checkTrackRateLimit(ip: string): Promise<boolean> {
  const { allowed } = await enforceRateLimit(`track:${ip}`, 10, 15 * 60, trackRateLimitMap);
  return allowed;
}

app.post('/api/orders/track', async (req: Request, res: Response) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    if (!(await checkTrackRateLimit(clientIp))) {
      return res.status(429).json({ error: 'Too many order tracking attempts. Please try again in 15 minutes.' });
    }

    const { trackingNumber, emailOrPhone } = req.body;
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Order ID or Tracking Number is required.' });
    }

    const user = await authenticateUser(req);
    // Previously this raw value was interpolated directly into a PostgREST `.or()`
    // filter expression string, where `,`, `.`, `(`, `)`, and `%` are all syntax
    // characters. That let a crafted trackingNumber (e.g. containing `%` — a
    // wildcard under ilike, or extra `,`-separated clauses) change what the filter
    // actually matched, rather than searching only for the literal value the user
    // typed. Ownership checks below still gated the response, but a query-filter
    // string should never be built by directly concatenating untrusted input.
    // Stripping PostgREST/SQL-LIKE special characters neutralizes that class of
    // issue regardless of how this query is written in the future.
    const cleanNum = String(trackingNumber).trim().replace(/[,.()%*]/g, '');

    if (!cleanNum) {
      return res.status(400).json({ error: 'Order ID or Tracking Number is required.' });
    }

    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    // Query orders table — matched as three independent exact-ish lookups instead
    // of one hand-built filter string.
    const [byTracking, byOrderNumber, byId] = await Promise.all([
      supabaseServer.from('orders').select('*').eq('tracking_number', cleanNum).limit(1),
      supabaseServer.from('orders').select('*').eq('order_number', cleanNum).limit(1),
      supabaseServer.from('orders').select('*').eq('id', cleanNum).limit(1),
    ]);

    const dbOrders = byTracking.data?.length ? byTracking.data
      : byOrderNumber.data?.length ? byOrderNumber.data
      : byId.data;

    if (!dbOrders || dbOrders.length === 0) {
      return res.status(404).json({ error: 'Order tracking number or Order ID not found.' });
    }

    const targetOrder = dbOrders[0];

    // Ownership check for logged in user / admin
    if (user) {
      // NOTE: role lives in user_roles (single source of truth), NOT profiles.
      // profiles has no `role` column — querying it here always returned
      // undefined, silently breaking admin lookups of other users' orders.
      const { data: userRole } = await supabaseServer
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      const isAdmin = Boolean(userRole);
      if (isAdmin || targetOrder.user_id === user.id) {
        return res.json({ success: true, order: targetOrder });
      }
    }

    // Ownership check for guest or unauthenticated user: require email / phone match
    if (!emailOrPhone) {
      return res.status(403).json({
        error: 'Ownership verification required. Please log in as the order owner or provide the email/phone associated with this order.'
      });
    }

    const cleanContact = String(emailOrPhone).trim().toLowerCase();
    const shipAddr = targetOrder.shipping_address || {};
    const buyerEmail = String(shipAddr.email || targetOrder.customer_email || '').toLowerCase();
    const buyerPhone = String(shipAddr.phone || targetOrder.customer_phone || '').toLowerCase();

    if ((buyerEmail && buyerEmail === cleanContact) || (buyerPhone && buyerPhone === cleanContact)) {
      return res.json({ success: true, order: targetOrder });
    }

    return res.status(403).json({ error: 'Access denied. The provided contact details do not match the order records.' });
  } catch (err: any) {
    console.error('[API Order Track Error]:', err);
    return res.status(500).json({ error: 'Error processing order tracking.' });
  }
});

// ==========================================
// CLOUDFLARE R2 OBJECT STORAGE UPLOAD ROUTE
// ==========================================
app.post('/api/media/upload', async (req: Request, res: Response) => {
  try {
    // 1. Authenticate user from Authorization Bearer header
    const user = await authenticateUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in as an administrator to upload files.'
      });
    }

    // 2. Admin authorization check
    // CRITICAL FIX: this previously also accepted `user.user_metadata?.role === 'admin'`.
    // Unlike app_metadata, user_metadata on a Supabase auth user is directly editable
    // by the user themselves via the client SDK (supabase.auth.updateUser({ data: {...} })) —
    // no admin/service-role access required. That meant ANY authenticated user could
    // grant themselves admin upload access from the browser console with a single
    // client-side call, a straightforward privilege-escalation vulnerability. The only
    // trustworthy sources of role are the server-verified `user_roles` table (the
    // isolated single source of truth used everywhere else in this app) and, as a
    // secondary signal, `app_metadata` (which genuinely cannot be self-edited by the
    // user — it requires the service role / Admin API). user_metadata is never
    // authoritative for authorization and must never be checked here again.
    let isAdmin = false;
    if (supabaseServer) {
      const { data: userRole } = await supabaseServer
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      isAdmin = Boolean(userRole) || user.app_metadata?.role === 'admin';
    }

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges are required to upload media.'
      });
    }

    const { fileName, fileType, fileData, folder = 'general' } = req.body || {};

    if (!fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fileName and fileData (base64 string or data URL) are required.'
      });
    }

    // Extract base64 buffer and mime type
    let mimeType = fileType || 'application/octet-stream';
    let base64Content = fileData;

    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const matches = fileData.match(/^data:(.+?);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Content = matches[2];
      }
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');
    const sizeInBytes = fileBuffer.length;

    const isImage = mimeType.startsWith('image/');

    // Validation limits: Images max 10MB, Audio/PDF max 50MB
    const maxSizeBytes = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

    if (sizeInBytes > maxSizeBytes) {
      const maxMb = isImage ? '10MB' : '50MB';
      return res.status(400).json({
        success: false,
        error: `File size exceeds the allowed limit of ${maxMb} for this file type. Uploaded size: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB.`
      });
    }

    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg',
      'application/pdf',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4'
    ];

    // FIXED: the original check was `!allowedMimeTypes.includes(mimeType) &&
    // !isImage && !isAudio && !isPdf` — since isImage/isAudio only test the MIME
    // prefix ("image/", "audio/"), that condition let ANY image/* or audio/*
    // MIME type through regardless of the allowlist above, and any filename
    // ending in .pdf through regardless of its actual content-type. In
    // particular, image/svg+xml would pass as "an image" even though it's not
    // in allowedMimeTypes — SVG files can embed <script> tags and are a known
    // stored-XSS vector, so silently accepting them defeats the point of
    // having an allowlist at all. Now this is a real allowlist: the MIME type
    // must actually be one of the listed values.
    if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `File type "${mimeType}" is not permitted. Only images (JPG, PNG, WebP, GIF), PDFs, and audio files (MP3, WAV, AAC, OGG) are supported.`
      });
    }

    const r2Client = getR2Client();
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    if (!r2Client || !bucketName) {
      return res.status(503).json({
        success: false,
        isConfigured: false,
        error: 'Cloudflare R2 storage is not configured on the server. Please ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME are set.'
      });
    }

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Defense in depth: strip any `..` traversal segments from the client-supplied
    // folder value, not just leading/trailing slashes. R2/S3 object keys are a flat
    // namespace (there's no real directory to "escape" the way there is on a
    // filesystem), so this was never exploitable as classic path traversal — but
    // there's no reason to allow `../` sequences into a stored object key at all.
    const sanitizedFolder = folder.replace(/\.\./g, '').replace(/^\/+|\/+$/g, '') || 'general';
    const objectKey = `${sanitizedFolder}/${Date.now()}_${sanitizedName}`;

    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    let publicUrl = '';
    if (publicUrlBase) {
      const baseUrlClean = publicUrlBase.replace(/\/+$/, '');
      publicUrl = `${baseUrlClean}/${objectKey}`;
    } else {
      const accountId = process.env.R2_ACCOUNT_ID;
      publicUrl = `https://${bucketName}.${accountId}.r2.dev/${objectKey}`;
    }

    return res.json({
      success: true,
      url: publicUrl,
      key: objectKey,
      size: sizeInBytes,
      contentType: mimeType
    });

  } catch (err: any) {
    // FIXED (security audit — debug info in production): this used to
    // include `err.message` directly in the JSON response sent to the
    // browser. For an R2/S3 SDK error, that can include internal details
    // (endpoint hostnames, bucket configuration hints, etc.) that have no
    // reason to reach an untrusted client. Full detail still goes to the
    // server log for debugging; the client only gets a generic message.
    console.error('[R2 Media Upload Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload file. Please try again, or contact support if the problem continues.'
    });
  }
});

export { app };

// ==========================================
// 6. VITE / STATIC SERVING & LOCAL LISTEN
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Dharma Books Pro Hardened Server running on http://${HOST}:${PORT}`);
  });
}

// Only run listener when executed directly in standalone server mode (not inside Netlify Functions)
const isMainModule = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') ||
   process.argv[1].endsWith('server.js') ||
   process.argv[1].endsWith('server.cjs'))
);

if (isMainModule && !process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT && !process.env.AWS_EXECUTION_ENV) {
  startServer();
}
