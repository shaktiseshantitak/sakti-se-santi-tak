import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import net from 'net';
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

// Raw body parser for Webhook signature verification (capped: a Razorpay
// event is a few KB — nothing legitimate needs more than 256 KB here).
app.use('/api/payment/webhook', express.raw({ type: 'application/json', limit: '256kb' }));

// FIXED (security audit item 7): this used to be one global 50 MB JSON limit
// for EVERY route, parsed BEFORE any authentication — so an anonymous caller
// could make the function buffer/parse tens of MB per request on the login,
// tracking, or order endpoints. Now: a small default limit for every ordinary
// route, and a separate, larger limit that applies ONLY to /api/media/upload
// and is only reached AFTER the admin check inside that route (see the
// upload route below — it authenticates first, then parses the body).
const JSON_LIMIT_DEFAULT = '100kb';
const MEDIA_UPLOAD_MAX_RAW_BYTES = 50 * 1024 * 1024; // largest allowed file (audio/PDF)
// base64 inflates by 4/3; add headroom for the JSON envelope (fileName etc.)
const MEDIA_UPLOAD_JSON_LIMIT_BYTES = Math.ceil((MEDIA_UPLOAD_MAX_RAW_BYTES * 4) / 3) + 16 * 1024;
const defaultJsonParser = express.json({ limit: JSON_LIMIT_DEFAULT });
const mediaUploadJsonParser = express.json({ limit: MEDIA_UPLOAD_JSON_LIMIT_BYTES });

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/payment/webhook' || req.path === '/api/media/upload') {
    return next(); // webhook: raw parser above; upload: parsed inside the route after auth
  }
  return defaultJsonParser(req, res, next);
});

// Security headers (audit item 9).
// - /api/* responses are JSON/XML/text: they never need to load anything, so
//   they get the strictest possible CSP.
// - Everything else (only reachable when this server also serves the site,
//   i.e. local/standalone mode — on Netlify the HTML is served by Netlify's
//   CDN, NOT by this app) gets the same policy the Netlify config uses, in
//   REPORT-ONLY mode. KEEP THIS STRING IN SYNC with netlify.toml and
//   public/_headers. It stays report-only until the browser console has been
//   checked against real checkout / admin / video / audio pages — an
//   enforcing policy that's slightly wrong would silently break payments.
const SITE_CSP_REPORT_ONLY =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://connect.facebook.net; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob: https:; " +
  "media-src 'self' blob: https:; " +
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://*.r2.dev https://api.cloudinary.com; " +
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com; " +
  "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (req.path.startsWith('/api/')) {
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  } else {
    res.setHeader('Content-Security-Policy-Report-Only', SITE_CSP_REPORT_ONLY);
  }
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
  fallbackMap: Map<string, { count: number; resetTime: number }>,
  failClosed: boolean = false
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
      console.error('[Rate Limit] RPC error:', error);
      // FIXED (SEC-007 — FINAL_BUG_SECURITY_AUDIT.md): this used to always
      // fail OPEN (allow the request) when the rate-limit RPC itself
      // failed — meaning a brief Postgres hiccup would silently remove
      // brute-force/abuse protection from auth, payment, and tracking
      // endpoints at exactly the moment infrastructure is already
      // stressed. Callers for those sensitive endpoints now pass
      // failClosed=true, so an RPC failure there rejects the request
      // instead of waving it through. Left fail-OPEN by default for
      // everything else (the general /api/ traffic limiter) — that one
      // failing closed on every transient DB hiccup would turn a minor
      // rate-limit outage into a full site outage for legitimate traffic,
      // which isn't what this fix is asking for.
      if (failClosed) {
        return { allowed: false, retryAfterSeconds: 30 };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    } catch (err) {
      console.error('[Rate Limit] RPC exception:', err);
      if (failClosed) {
        return { allowed: false, retryAfterSeconds: 30 };
      }
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

// ==========================================
// TRUSTED CLIENT IDENTITY (security audit item 2)
// ==========================================
// FIXED: rate limits used to key on the raw `x-forwarded-for` header, which
// any client can set to an arbitrary value per request — rotating it gave a
// fresh rate-limit bucket every time, defeating every limiter below. The
// client IP is now taken ONLY from a source the platform controls:
//   1. On Netlify: `x-nf-client-connection-ip`, which Netlify's edge sets
//      itself (a client-supplied copy is overwritten). This is only honoured
//      when actually running on Netlify/Lambda — on a plain Node host the
//      header is just client input and is ignored.
//   2. Elsewhere: Express `req.ip` ONLY if TRUSTED_PROXY_HOPS is explicitly
//      configured with the real number of proxies in front of the app.
//   3. Otherwise: the raw socket address (never a client header).
// If none of these yields a real IP the request falls into a shared bucket —
// stricter for everyone, never bypassable. NOTE: whether Netlify really
// overwrites this header for your site is a LIVE-environment fact that must
// be verified (see SECURITY_FIX_STATUS.md); it cannot be proven from code.
const RUNNING_ON_NETLIFY = Boolean(process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const TRUSTED_PROXY_HOPS = Math.max(0, Math.floor(Number(process.env.TRUSTED_PROXY_HOPS || 0))) || 0;
if (TRUSTED_PROXY_HOPS > 0) {
  app.set('trust proxy', TRUSTED_PROXY_HOPS);
}

function getClientIp(req: Request): string {
  if (RUNNING_ON_NETLIFY) {
    const raw = req.headers['x-nf-client-connection-ip'];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value && net.isIP(value)) return value;
  }
  if (TRUSTED_PROXY_HOPS > 0 && req.ip) return req.ip;
  return req.socket.remoteAddress || 'unknown';
}

// Rate limiting for API endpoints
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 60;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  const { allowed } = await enforceRateLimit(`api:${ip}`, maxRequestsPerWindow, rateLimitWindowMs / 1000, ipRequestCounts);

  if (!allowed) {
    return res.status(429).json({
      error: 'Too many requests. Please try again in 1 minute.',
    });
  }

  next();
};

app.use('/api/', rateLimiter);

// Login preflight (customer + admin password step). ADVISORY ONLY: the
// password itself is checked by Supabase Auth directly from the browser, so
// this endpoint can never be the thing that stops password guessing —
// Supabase Auth's own rate limits / CAPTCHA (a live setting) are. What this
// adds is a per-email AND per-IP counter that fails CLOSED, and the client
// now treats "limiter unreachable" as a block instead of continuing.
// The MFA step, by contrast, is enforced for real — see /api/admin/mfa/*.
const authAttemptCounts = new Map<string, { count: number; resetTime: number }>();
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
  const email = rawEmail.toLowerCase().trim().slice(0, 254) || 'anonymous';
  const byEmail = await enforceRateLimit(`auth-login:email:${email}`, 10, 15 * 60, authAttemptCounts, true);
  const byIp = await enforceRateLimit(`auth-login:ip:${ip}`, 30, 15 * 60, authAttemptCounts, true);
  if (!byEmail.allowed || !byIp.allowed) {
    const minutesLeft = Math.max(1, Math.ceil(Math.max(byEmail.retryAfterSeconds, byIp.retryAfterSeconds) / 60));
    return res.status(429).json({
      error: `Too many login attempts. Please try again in ${minutesLeft} minute(s).`,
      lockout: true,
      retryAfterMinutes: minutesLeft,
    });
  }
  res.json({ status: 'ok' });
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

// ==========================================
// SERVER-VERIFIED ADMIN MFA (security audit item 1)
// ==========================================
// FIXED: the admin email-OTP step used to be enforced ONLY in the browser
// (a sessionStorage flag) — a valid password produced a fully working
// Supabase session, and every admin API route / RLS policy only checked
// user_roles, never whether the OTP step had actually been completed. So
// anyone who knew the admin password could skip the OTP screen entirely
// and call the admin APIs (or write straight to Supabase under RLS).
//
// Now the OTP is verified HERE, on the server, and the result is recorded in
// public.admin_mfa_sessions (migration 024), bound to the user id AND the
// Supabase session id (`session_id` claim of the access token):
//   - /api/admin/mfa/send   : only for a session that was created by PASSWORD
//                             sign-in (JWT amr contains "password"), so a
//                             session minted from the email OTP alone can
//                             never be promoted — both factors are needed.
//   - /api/admin/mfa/verify : checks the code with Supabase on a throwaway
//                             client (browser session untouched), then writes
//                             the verified row. Rate-limited per USER as well
//                             as per IP, fail-closed.
//   - requireAdmin()        : every sensitive admin route calls this. When
//                             MFA is enforced it requires a live verified row
//                             for exactly this user + this session.
// public.is_admin() (used by every RLS policy) is updated in migration 024 to
// apply the same rule, so direct browser->Supabase admin writes are covered
// too. Browser storage plays no part in any of this.
const ADMIN_MFA_TTL_HOURS = 12;
const anonKeyForAuth = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const mfaSendMap = new Map<string, { count: number; resetTime: number }>();
const mfaVerifyMap = new Map<string, { count: number; resetTime: number }>();

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return token || null;
}

// Only ever called on a token that authenticateUser() has ALREADY validated
// with Supabase — this just reads claims (session_id, amr) out of it.
function decodeJwtClaims(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// A separate, non-persisting client used ONLY to send/check the email OTP so
// the caller's own browser session is never replaced or revoked.
function createThrowawayAuthClient() {
  const key = anonKeyForAuth || supabaseKey;
  if (!supabaseUrl || !key) return null;
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function isAdminMfaEnforced(): Promise<boolean> {
  if (!supabaseServer) return true; // fail closed
  const { data, error } = await supabaseServer.from('admin_mfa_config').select('enforced').eq('id', true).maybeSingle();
  if (error) {
    // PGRST205 / 42P01 = table missing, i.e. migration 024 has not been run
    // yet. Treated as "not enforced yet" (and logged loudly) so deploying the
    // code before the migration can't lock the owner out of the panel —
    // ENFORCEMENT IS NOT ACTIVE until 024 is applied and the flag is on.
    if (error.code === 'PGRST205' || error.code === '42P01') {
      console.warn('[Admin MFA] admin_mfa_config missing — migration 024 not applied; MFA is NOT enforced server-side.');
      return false;
    }
    console.error('[Admin MFA] enforcement lookup failed — failing closed:', error);
    return true;
  }
  return Boolean(data?.enforced);
}

async function hasVerifiedAdminMfa(userId: string, token: string): Promise<boolean> {
  if (!supabaseServer) return false;
  const sessionId = decodeJwtClaims(token)?.session_id;
  if (typeof sessionId !== 'string' || !sessionId) return false;
  const { data, error } = await supabaseServer
    .from('admin_mfa_sessions')
    .select('expires_at')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error || !data) return false;
  return new Date(data.expires_at).getTime() > Date.now();
}

async function hasAdminRole(userId: string): Promise<boolean> {
  if (!supabaseServer) return false;
  const { data } = await supabaseServer
    .from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  return Boolean(data);
}

// Uniform gate for every sensitive admin route: authenticated + admin role
// (from user_roles only — never user_metadata) + verified MFA for THIS
// session when enforcement is on. Sends the response itself on failure and
// returns null; the message is deliberately identical for "not an admin" and
// "MFA missing" so it reveals nothing about which admin resources exist.
async function requireAdmin(req: Request, res: Response): Promise<{ id: string; email: string } | null> {
  if (!supabaseServer) {
    res.status(503).json({ error: 'Database not configured.' });
    return null;
  }
  const user = await authenticateUser(req);
  const token = getBearerToken(req);
  if (!user || !token) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  if (!(await hasAdminRole(user.id))) {
    res.status(403).json({ error: 'Access denied.' });
    return null;
  }
  if ((await isAdminMfaEnforced()) && !(await hasVerifiedAdminMfa(user.id, token))) {
    res.status(403).json({ error: 'Access denied.', mfaRequired: true });
    return null;
  }
  return { id: user.id, email: user.email || '' };
}

// Same check but returns a boolean, for routes where admin is one of several
// allowed callers (e.g. order tracking).
async function isVerifiedAdmin(req: Request, userId: string): Promise<boolean> {
  const token = getBearerToken(req);
  if (!token || !(await hasAdminRole(userId))) return false;
  if (await isAdminMfaEnforced()) return hasVerifiedAdminMfa(userId, token);
  return true;
}

// The password-authenticated admin session that is allowed to START/COMPLETE
// the second factor. Requires the JWT to say the session came from a password
// sign-in (amr method "password").
async function requirePasswordAdminSession(req: Request, res: Response) {
  if (!supabaseServer) {
    res.status(503).json({ error: 'Service unavailable.' });
    return null;
  }
  const user = await authenticateUser(req);
  const token = getBearerToken(req);
  if (!user || !token || !user.email) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const claims = decodeJwtClaims(token);
  const viaPassword = Array.isArray(claims?.amr) && claims!.amr.some((a: any) => a?.method === 'password');
  if (!viaPassword || !claims?.session_id || !(await hasAdminRole(user.id))) {
    res.status(403).json({ error: 'Access denied.' });
    return null;
  }
  return { user, token, claims: claims as Record<string, any> };
}

app.post('/api/admin/mfa/send', async (req: Request, res: Response) => {
  try {
    const ctx = await requirePasswordAdminSession(req, res);
    if (!ctx) return;
    const ip = getClientIp(req);
    const byUser = await enforceRateLimit(`mfa-send:user:${ctx.user.id}`, 5, 15 * 60, mfaSendMap, true);
    const byIp = await enforceRateLimit(`mfa-send:ip:${ip}`, 20, 15 * 60, mfaSendMap, true);
    if (!byUser.allowed || !byIp.allowed) {
      return res.status(429).json({ error: 'Too many verification code requests. Please try again later.' });
    }
    const client = createThrowawayAuthClient();
    if (!client) return res.status(503).json({ error: 'Service unavailable.' });
    const { error } = await client.auth.signInWithOtp({
      email: ctx.user.email!,
      options: { shouldCreateUser: false },
    });
    if (error) {
      console.error('[Admin MFA] send failed:', error.message);
      return res.status(502).json({ error: 'Could not send the verification code. Please try again shortly.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[Admin MFA] send exception:', err);
    return res.status(500).json({ error: 'Could not send the verification code.' });
  }
});

app.post('/api/admin/mfa/verify', async (req: Request, res: Response) => {
  try {
    const ctx = await requirePasswordAdminSession(req, res);
    if (!ctx) return;
    const ip = getClientIp(req);
    // Counted per USER (so guesses are limited no matter which IPs they come
    // from) AND per IP, before the code is even looked at; fails closed.
    const byUser = await enforceRateLimit(`mfa-verify:user:${ctx.user.id}`, 5, 15 * 60, mfaVerifyMap, true);
    const byIp = await enforceRateLimit(`mfa-verify:ip:${ip}`, 20, 15 * 60, mfaVerifyMap, true);
    if (!byUser.allowed || !byIp.allowed) {
      return res.status(429).json({ error: 'Too many verification attempts. Account security lockout active. Please try again later.', lockout: true });
    }

    const code = String(req.body?.code ?? '').trim();
    if (!/^\d{6,10}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    const client = createThrowawayAuthClient();
    if (!client) return res.status(503).json({ error: 'Service unavailable.' });
    const { data, error } = await client.auth.verifyOtp({ email: ctx.user.email!, token: code, type: 'email' });
    if (error || !data?.user || data.user.id !== ctx.user.id) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }
    // Discard the throwaway session. scope:'local' is essential — the default
    // ('global') would revoke EVERY session of this user, including the
    // admin's real one.
    await client.auth.signOut({ scope: 'local' }).catch(() => {});

    const expiresAt = new Date(Date.now() + ADMIN_MFA_TTL_HOURS * 3600 * 1000).toISOString();
    const { error: upsertErr } = await supabaseServer!
      .from('admin_mfa_sessions')
      .upsert({ user_id: ctx.user.id, session_id: ctx.claims.session_id, expires_at: expiresAt }, { onConflict: 'user_id,session_id' });
    if (upsertErr) {
      console.error('[Admin MFA] could not record verification:', upsertErr);
      return res.status(500).json({ error: 'Could not complete verification. Please try again.' });
    }
    // Housekeeping: drop this user's expired rows.
    await supabaseServer!.from('admin_mfa_sessions').delete().eq('user_id', ctx.user.id).lt('expires_at', new Date().toISOString());

    await writeServerAuditLog({
      userId: ctx.user.id, actorEmail: ctx.user.email || '', action: 'ADMIN_MFA_VERIFIED',
      resource: 'auth', details: { note: 'Admin email-OTP second factor verified' }, ip,
    });
    return res.json({ success: true, expiresAt });
  } catch (err) {
    console.error('[Admin MFA] verify exception:', err);
    return res.status(500).json({ error: 'Could not complete verification.' });
  }
});

// Lets the admin UI ask the SERVER (not sessionStorage) whether this session
// has completed the second factor, e.g. after a page refresh.
app.get('/api/admin/mfa/status', async (req: Request, res: Response) => {
  try {
    if (!supabaseServer) return res.status(503).json({ error: 'Service unavailable.' });
    const user = await authenticateUser(req);
    const token = getBearerToken(req);
    if (!user || !token) return res.status(401).json({ error: 'Authentication required.' });
    if (!(await hasAdminRole(user.id))) return res.json({ verified: false });
    return res.json({ verified: await hasVerifiedAdminMfa(user.id, token) });
  } catch {
    return res.status(500).json({ error: 'Could not check verification status.' });
  }
});

// Called on logout: drops every verified-MFA record for this user.
app.post('/api/admin/mfa/revoke', async (req: Request, res: Response) => {
  try {
    if (!supabaseServer) return res.status(503).json({ error: 'Service unavailable.' });
    const user = await authenticateUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    await supabaseServer.from('admin_mfa_sessions').delete().eq('user_id', user.id);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Could not revoke verification.' });
  }
});

// Audit rows are written ONLY here, from the authenticated server context —
// actor, user id, IP and timestamp can no longer be supplied (or forged) by a
// browser. Failures are logged, never thrown into the caller's flow.
async function writeServerAuditLog(entry: {
  userId: string | null; actorEmail?: string; action: string; resource: string;
  details?: Record<string, any>; ip?: string;
}) {
  if (!supabaseServer) return;
  const { error } = await supabaseServer.from('audit_logs').insert([{
    user_id: entry.userId,
    action: entry.action,
    resource: entry.resource,
    details: { ...(entry.details || {}), actor_email: entry.actorEmail || undefined },
    ip_address: entry.ip || null,
  }]);
  if (error) console.error('[Audit Log] insert failed:', error);
}

app.post('/api/admin/audit-log', async (req: Request, res: Response) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const action = String(req.body?.action ?? '').slice(0, 64);
    const resource = String(req.body?.entity ?? '').slice(0, 64);
    const note = String(req.body?.details ?? '').slice(0, 1000);
    if (!action || !resource) return res.status(400).json({ error: 'action and entity are required.' });
    await writeServerAuditLog({
      userId: admin.id, actorEmail: admin.email, action, resource, details: { note }, ip: getClientIp(req),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[Audit Log] route exception:', err);
    return res.status(500).json({ error: 'Could not record audit entry.' });
  }
});

// FIXED (2026-08-29 — "orders placed even when payment fails"): shared by
// the new /api/payment/cancel-unpaid-order endpoint AND every failure path
// inside /api/payment/verify. Cancels an order that's still 'Awaiting
// Payment' and restores the stock that was optimistically decremented at
// order-creation time — see migration 015's increment_inventory. Guarded
// so it only ever touches an order that's genuinely still unpaid (never a
// real 'Processing'/'Paid' order), and is safe to call more than once.
// FIXED (BUG-008/009 — FINAL_BUG_SECURITY_AUDIT.md): this used to read
// order_status, decide to cancel based on that read, then restore stock
// and write 'Cancelled' as later separate steps — so this helper racing
// against the stale-order sweep, an admin cancellation, or a payment
// verification could both observe "still Awaiting Payment" and both
// restore stock for the same order. Now delegates to cancel_order_atomic
// (migration 021), whose UPDATE ... WHERE order_status = ANY(...) only
// ever matches for the one caller that actually performs the transition.
async function cancelUnpaidOrderAndRestoreStock(orderId: string, userId: string): Promise<boolean> {
  if (!supabaseServer) return false;

  const { data: order } = await supabaseServer
    .from('orders')
    .select('id, user_id')
    .eq('id', orderId)
    .single();

  if (!order || order.user_id !== userId) {
    return false; // not this user's order
  }

  const { data: cancelled, error } = await supabaseServer.rpc('cancel_order_atomic', {
    p_order_id: orderId,
    p_expected_statuses: ['Awaiting Payment'],
    p_restore_reason: `Stock restored — order ${orderId} payment never completed.`,
  });
  if (error) {
    console.error('[Cancel Unpaid Order] cancel_order_atomic failed:', error);
    return false;
  }
  return !!cancelled;
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
    service: 'Shakti Se Shanti Tak Production API',
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

// FIXED (2026-09-26 — "SEO dummy hai"): public/sitemap.xml was a static,
// hand-written file listing ~12 fixed URLs — no book, category, or blog
// page was ever in it, and it never changed as the catalog changed. There
// was already a real generator (SitemapPage.tsx, at the human-facing
// /sitemap route) that builds a correct sitemap from live book/category
// data, but search engines request /sitemap.xml, not /sitemap, so that
// generator was never actually seen by a crawler. This serves the same
// kind of sitemap for real, at the URL crawlers use — see the
// netlify.toml redirect that routes /sitemap.xml here (same pattern as
// the /robots.txt fix above). Book/category/blog URLs match what
// resolvePath() in src/App.tsx actually navigates to (/book/:slug,
// /blog/:slug) — a book's "slug" is its id (see mapDbBookToBook).
app.get('/api/seo/sitemap-xml', async (req: Request, res: Response) => {
  res.set('Content-Type', 'application/xml');
  const baseUrl = 'https://shaktiseshanti.com';
  const staticUrls: Array<{ loc: string; changefreq: string; priority: string }> = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/books', changefreq: 'daily', priority: '0.9' },
    { loc: '/authors', changefreq: 'weekly', priority: '0.6' },
    { loc: '/blog', changefreq: 'daily', priority: '0.7' },
    { loc: '/gallery', changefreq: 'weekly', priority: '0.5' },
    { loc: '/faq', changefreq: 'monthly', priority: '0.4' },
    { loc: '/about', changefreq: 'monthly', priority: '0.5' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.4' },
  ];

  let categoryUrls: Array<{ loc: string; lastmod?: string }> = [];
  let bookUrls: Array<{ loc: string; lastmod?: string }> = [];
  let blogUrls: Array<{ loc: string; lastmod?: string }> = [];

  if (supabaseServer) {
    const [{ data: categories }, { data: books }, { data: blogs }] = await Promise.all([
      supabaseServer.from('categories').select('slug, id'),
      supabaseServer.from('books').select('id, created_at'),
      supabaseServer.from('blogs').select('slug, id, published_at'),
    ]);
    categoryUrls = (categories || []).map((c: any) => ({ loc: `/books/${c.slug || c.id}` }));
    bookUrls = (books || []).map((b: any) => ({ loc: `/book/${b.id}`, lastmod: b.created_at }));
    blogUrls = (blogs || []).map((b: any) => ({ loc: `/blog/${b.slug || b.id}`, lastmod: b.published_at }));
  }

  const urlXml = (u: { loc: string; changefreq?: string; priority?: string; lastmod?: string }) => `
  <url>
    <loc>${baseUrl}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls.map(urlXml).join('')}${categoryUrls.map(u => urlXml({ ...u, changefreq: 'weekly', priority: '0.8' })).join('')}${bookUrls.map(u => urlXml({ ...u, changefreq: 'monthly', priority: '0.7' })).join('')}${blogUrls.map(u => urlXml({ ...u, changefreq: 'monthly', priority: '0.6' })).join('')}
</urlset>`;

  res.send(xml);
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
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { orderId, newStatus, note } = req.body;
    if (!orderId || !newStatus) return res.status(400).json({ error: 'orderId and newStatus are required.' });

    // FIXED (BUG-008 — FINAL_BUG_SECURITY_AUDIT.md): this used to read
    // order_status, decide whether to restore stock based on that read,
    // then write the status change and restore stock as later separate
    // steps — two concurrent cancellations (e.g. an admin click racing the
    // stale-order sweep) could both read "not yet cancelled" and both
    // restore stock. The 'Cancelled' transition now goes through
    // cancel_order_atomic (migration 021), whose atomic conditional UPDATE
    // guarantees only one caller ever performs the restoration.
    if (newStatus === 'Cancelled') {
      const { data: cancelled, error: cancelErr } = await supabaseServer.rpc('cancel_order_atomic', {
        p_order_id: orderId,
        p_expected_statuses: ['Awaiting Payment', 'Processing', 'Shipped', 'Out for Delivery'],
        p_restore_reason: note || `Stock restored — order ${orderId} cancelled by admin.`,
        p_updated_by: user.id,
      });
      if (cancelErr) {
        console.error('[Admin Update Order Status] cancel_order_atomic failed:', cancelErr);
        return res.status(500).json({ error: 'Failed to cancel order.' });
      }
      if (!cancelled) {
        return res.status(409).json({ error: 'Order is already Cancelled or Delivered and cannot be cancelled.' });
      }
      return res.json({ success: true });
    }

    // FIXED (BUG-025 — FINAL_BUG_SECURITY_AUDIT.md): the update/insert
    // results below were never checked — a failed DB write still returned
    // {success:true} to the admin panel, which could show a status change
    // as saved when it never actually persisted.
    const { data: updatedRows, error: updateErr } = await supabaseServer
      .from('orders')
      .update({ order_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('id');
    if (updateErr) {
      console.error('[Admin Update Order Status] orders update failed:', updateErr);
      return res.status(500).json({ error: 'Failed to update order status.' });
    }
    if (!updatedRows || updatedRows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Real, timestamped history entry — this is what the customer's
    // tracking page timeline now actually reads from.
    const { error: historyErr } = await supabaseServer.from('order_status_history').insert([{
      order_id: orderId,
      status: newStatus,
      notes: note || null,
      updated_by: user.id,
    }]);
    if (historyErr) {
      console.error('[Admin Update Order Status] history insert failed:', historyErr);
      return res.status(500).json({ error: 'Order status changed but history entry failed to save.' });
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
    const user = await requireAdmin(req, res);
    if (!user) return;

    const results = await runDailyBackup(supabaseServer!);
    await writeServerAuditLog({
      userId: user.id, actorEmail: user.email, action: 'BACKUP_TRIGGERED', resource: 'backup',
      details: { tabs: Array.isArray(results) ? results.length : undefined }, ip: getClientIp(req),
    });
    return res.json({ success: true, results });
  } catch (err: any) {
    // FIXED (audit item 11): err.message used to be returned to the browser,
    // which can carry Apps Script / network / config detail. Full detail
    // stays in the server log only.
    console.error('[Backup Now] Failed:', err);
    return res.status(500).json({ error: 'Backup failed. Check the server logs for details.' });
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
    // FIXED (BUG-010/011/012 — FINAL_BUG_SECURITY_AUDIT.md): three issues
    // in one place, all now closed:
    //  - BUG-012: a hardcoded RAMA108 fallback applied a 10% discount
    //    whenever no matching DB coupon was found — meaning it kept
    //    working even after the real coupon was deleted/deactivated in
    //    the Control Panel. Removed entirely; the database is the only
    //    coupon authority now.
    //  - BUG-011: a product-scoped coupon (`applicable_book_id`) only
    //    checked that the eligible book was *somewhere* in the cart, but
    //    calculated its discount off the WHOLE cart subtotal — a 10%
    //    coupon meant for one ₹500 book discounted a ₹5,500 cart by ₹550
    //    instead of ₹50. Discount is now calculated only from eligible
    //    line items when applicable_book_id is set.
    //  - BUG-010: usage_limit was checked here, then incremented later in
    //    a separate call — a classic race where concurrent checkouts
    //    could both pass the check. The check-and-reserve is now atomic,
    //    inside create_order_transactional below.
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
        const discountBase = coupon.applicable_book_id
          ? validatedItems
              .filter(it => it.bookId === coupon.applicable_book_id)
              .reduce((sum, it) => sum + it.totalPrice, 0)
          : calculatedSubtotal;
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.round(discountBase * (coupon.discount_value / 100) * 100) / 100;
        } else {
          discountAmount = Math.min(discountBase, coupon.discount_value);
        }
      }
    }

    // FIXED (BUG-013/014): the backend previously used its own hardcoded
    // tax rate (5%) and shipping rule (free at ₹499, else ₹50) — different
    // numbers from what CartContext.tsx shows the customer (free at
    // siteSettings.freeShippingMinAmount||799, else ₹60; tax at
    // siteSettings.taxPercentage||5). The customer-visible checkout total
    // could disagree with the authoritative server total. Both now read
    // from the same site_settings row (`s`, already fetched above for the
    // payment-method toggles) with identical fallback constants to
    // CartContext.tsx, so server and frontend can never silently diverge.
    const afterDiscount = Math.max(0, calculatedSubtotal - discountAmount);
    const taxPercentage = Number(s.taxPercentage ?? 5);
    const freeShippingMinAmount = Number(s.freeShippingMinAmount ?? 799);
    const taxAmount = Math.round((afterDiscount * taxPercentage) / 100 * 100) / 100;
    const shippingCharge = afterDiscount > 0 && afterDiscount < freeShippingMinAmount ? 60 : 0;
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

    // FIXED (BUG-001/002/028 — FINAL_BUG_SECURITY_AUDIT.md): order insert,
    // order_items insert, per-item stock decrement and the initial
    // order_status_history row used to be separate sequential calls. A
    // later item failing (insufficient stock) left the order "Cancelled"
    // but never rolled back stock already decremented for earlier items
    // in the same order — inventory drifted permanently wrong. This is
    // now one atomic RPC (migration 021): any failure inside it rolls
    // back every write the call made, including earlier loop iterations.
    const { data: rpcResult, error: rpcErr } = await supabaseServer.rpc('create_order_transactional', {
      p_order: {
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
      },
      p_items: validatedItems.map(item => ({
        book_id: item.bookId,
        book_title: item.bookTitle,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        total_price: item.totalPrice,
        format: item.format,
        language: item.language,
      })),
      p_coupon_id: appliedCouponId,
    });

    if (rpcErr || !rpcResult || !rpcResult[0]) {
      const msg = String(rpcErr?.message || '');
      if (msg.includes('INSUFFICIENT_STOCK:')) {
        const bookId = msg.split('INSUFFICIENT_STOCK:')[1];
        const failedItem = validatedItems.find(it => it.bookId === bookId);
        return res.status(409).json({
          error: `Stock ran out while placing your order for: ${failedItem?.bookTitle || bookId}. Your order was not confirmed — please review your cart and try again.`,
        });
      }
      if (msg.includes('COUPON_LIMIT_REACHED:')) {
        return res.status(400).json({ error: 'This coupon has just reached its usage limit. Please remove it and try again.' });
      }
      console.error('[API Order Create] create_order_transactional failed:', rpcErr);
      return res.status(500).json({ error: 'Failed to record order in database.' });
    }

    const orderId = rpcResult[0].order_id;

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
// RAZORPAY PAYMENT CROSS-CHECKS (security audit item 5)
// ==========================================
// A valid signature only proves "Razorpay signed this order-id|payment-id
// pair" — it says nothing about HOW MUCH was paid, in which currency, or
// whether the money was actually captured. Both the browser verify path and
// the webhook path now check the gateway's own payment record against the
// authoritative local order BEFORE anything is marked paid.
type PaymentCheck = {
  ok: boolean;
  reason?: 'malformed' | 'order_mismatch' | 'currency_mismatch' | 'amount_mismatch' | 'refunded' | 'not_captured';
};

function checkPaymentEntity(
  entity: any,
  expected: { razorpayOrderId: string | null; amountPaise: number }
): PaymentCheck {
  if (!entity || typeof entity !== 'object' || typeof entity.id !== 'string') return { ok: false, reason: 'malformed' };
  // gateway payment must belong to the gateway order we created for THIS local order
  if (!expected.razorpayOrderId || entity.order_id !== expected.razorpayOrderId) return { ok: false, reason: 'order_mismatch' };
  if (entity.currency !== 'INR') return { ok: false, reason: 'currency_mismatch' };
  // never trust client amounts; compare against OUR stored total, in paise, exactly
  if (!Number.isInteger(entity.amount) || entity.amount !== expected.amountPaise) return { ok: false, reason: 'amount_mismatch' };
  if (Number(entity.amount_refunded || 0) !== 0) return { ok: false, reason: 'refunded' };
  if (entity.status !== 'captured') return { ok: false, reason: 'not_captured' };
  return { ok: true };
}

async function fetchRazorpayPayment(paymentId: string): Promise<any | null> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const r = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (err) {
    console.error('[Razorpay] payment fetch failed:', (err as any)?.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================
// 3. SECURE RAZORPAY PAYMENT CREATION
// ==========================================
const paymentRateLimitMap = new Map<string, { count: number; resetTime: number }>();
// FIXED (SEC-007 — FINAL_BUG_SECURITY_AUDIT.md): payment creation/
// verification is on the audit's explicit sensitive-endpoint list, but
// previously only had the generic 60-req/min-per-IP limiter shared by
// every /api/ route — no dedicated limit, and that generic one fails
// open on RPC error anyway. This is a real per-endpoint limit, and it
// fails CLOSED (rejects) if the rate-limit RPC itself is unreachable.
async function checkPaymentRateLimit(ip: string): Promise<boolean> {
  const { allowed } = await enforceRateLimit(`payment:${ip}`, 20, 10 * 60, paymentRateLimitMap, true);
  return allowed;
}

app.post('/api/payment/create-order', async (req: Request, res: Response) => {
  try {
    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const ipForLimit = getClientIp(req);
    if (!(await checkPaymentRateLimit(ipForLimit))) {
      return res.status(429).json({ error: 'Too many payment attempts. Please try again shortly.' });
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

    // FIXED (BUG-003 — FINAL_BUG_SECURITY_AUDIT.md): only payment_status
    // was checked here, not order_status — a cancelled order (payment_
    // status left as 'Failed'/'Pending Verification', order_status
    // 'Cancelled') could still receive a brand-new Razorpay order and
    // potentially be paid again after cancellation. Now requires the
    // order to still be in the one state that's actually payable.
    const { data: payableOrder } = await supabaseServer
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('order_status', 'Awaiting Payment')
      .maybeSingle();
    if (!payableOrder) {
      return res.status(400).json({ error: 'This order is no longer awaiting payment and cannot be paid.' });
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

    // Conditional bind: only succeeds if the order is still payable at this
    // exact moment (closes the remaining race between the check above and
    // this write — e.g. a concurrent cancellation in between the two).
    const { data: bound } = await supabaseServer
      .from('orders')
      .update({ razorpay_order_id: data.id })
      .eq('id', dbOrder.id)
      .eq('order_status', 'Awaiting Payment')
      .select('id')
      .maybeSingle();
    if (!bound) {
      return res.status(400).json({ error: 'This order is no longer awaiting payment and cannot be paid.' });
    }

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

    const ipForLimit = getClientIp(req);
    if (!(await checkPaymentRateLimit(ipForLimit))) {
      return res.status(429).json({ success: false, error: 'Too many payment attempts. Please try again shortly.' });
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

    // FIXED (BUG-004): previously this check only ran `if
    // (dbOrder.razorpay_order_id && ...)` — a NULL/missing DB binding
    // (e.g. a race before the bind above completed) skipped the mismatch
    // check entirely, so any razorpay_order_id the client claimed would
    // pass. Now the DB binding must exist AND match exactly.
    if (!dbOrder.razorpay_order_id || dbOrder.razorpay_order_id !== razorpay_order_id) {
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

    // FIXED (audit item 5): ask Razorpay itself what this payment actually
    // is and compare it with the local order — same gateway order id, INR,
    // exact amount, captured, not refunded — before anything is marked paid.
    // Deliberately does NOT cancel the order on these failures: the money may
    // really have moved, so this needs a human, not an automatic stock
    // restore + cancellation.
    const gatewayPayment = await fetchRazorpayPayment(razorpay_payment_id);
    if (!gatewayPayment) {
      return res.status(503).json({
        success: false,
        pending: true,
        error: 'We could not confirm your payment with the payment gateway just now. Please do not pay again — check My Orders in a few minutes, or contact support with your payment ID.',
      });
    }
    const gatewayCheck = checkPaymentEntity(gatewayPayment, {
      razorpayOrderId: dbOrder.razorpay_order_id,
      amountPaise: Math.round(Number(dbOrder.total_amount) * 100),
    });
    if (!gatewayCheck.ok) {
      if (gatewayCheck.reason === 'not_captured') {
        // e.g. still 'authorized' — Razorpay's auto-capture / the
        // payment.captured webhook will complete the order.
        return res.status(202).json({
          success: false,
          pending: true,
          error: 'Your payment was received and is being confirmed by the bank. Your order will be confirmed automatically in a few minutes — please do not pay again.',
        });
      }
      console.error('[API Payment Verify] gateway/local mismatch:', gatewayCheck.reason, { orderId, razorpay_payment_id });
      await writeServerAuditLog({
        userId: user.id, actorEmail: user.email || '', action: 'PAYMENT_MISMATCH', resource: 'orders',
        details: { order_id: orderId, razorpay_payment_id, reason: gatewayCheck.reason, path: 'verify' }, ip: getClientIp(req),
      });
      return res.status(409).json({
        success: false,
        pending: true, // held for review — the order is NOT cancelled (client shows the message as-is)
        error: 'We could not match your payment to this order, so it has not been marked as paid. Please contact support with your payment ID.',
      });
    }

    // FIXED (BUG-005/006 — FINAL_BUG_SECURITY_AUDIT.md): a valid signature
    // alone isn't enough — this used to unconditionally set payment_status
    // /order_status regardless of the order's current state, so it could
    // transition an order that a concurrent cancellation (sweep, admin,
    // or the mismatch/signature-failure paths above) had already resolved.
    // mark_order_paid_atomic (migration 021) only transitions an order
    // that is still 'Awaiting Payment', atomically, and reports whether it
    // actually did so.
    const { data: marked, error: markErr } = await supabaseServer.rpc('mark_order_paid_atomic', {
      p_order_id: orderId,
      p_transaction_id: razorpay_payment_id,
      p_expected_statuses: ['Awaiting Payment'],
    });
    if (markErr) {
      console.error('[API Payment Verify] mark_order_paid_atomic failed:', markErr);
      return res.status(500).json({ success: false, error: 'Server error recording payment.' });
    }
    if (!marked) {
      // Order was already resolved by something else (cancelled by the
      // sweep, etc.) before this verification landed — a real payment
      // was captured for an order we can no longer confirm automatically.
      // Surface this distinctly rather than silently reporting success.
      return res.status(409).json({
        success: false,
        error: 'This order was already cancelled before payment could be confirmed. Please contact support with your payment ID — your money is safe and will be resolved.',
      });
    }

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
        ip_address: getClientIp(req),
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

    const signature = req.headers['x-razorpay-signature'];
    if (typeof signature !== 'string' || !signature) {
      return res.status(400).json({ error: 'Missing webhook signature header.' });
    }

    // The signature MUST be computed over the exact raw bytes Razorpay sent.
    // If the raw parser didn't run (body isn't a Buffer) we refuse instead of
    // re-serialising a parsed object, which would never match reliably.
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: 'Invalid webhook payload.' });
    }
    const rawBodyBuffer: Buffer = req.body;

    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBodyBuffer).digest('hex');
    if (!timingSafeEqualString(signature, expectedSignature)) {
      return res.status(400).json({ error: 'Webhook signature verification failed.' });
    }

    let event: any;
    try {
      event = JSON.parse(rawBodyBuffer.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid webhook payload.' });
    }
    if (!event || typeof event !== 'object' || typeof event.event !== 'string') {
      return res.status(400).json({ error: 'Invalid webhook payload.' });
    }
    if (!supabaseServer) {
      // Never acknowledge (200) an event we could not durably record —
      // Razorpay will retry it.
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    // FIXED (audit item 5): idempotency used to key on `event.event_id` (a
    // field Razorpay does not put in the body) and otherwise on
    // `${event}_${Date.now()}` — a NEW key on every delivery, so duplicates
    // were never actually detected. Razorpay sends a stable id in the
    // x-razorpay-event-id header; if it is ever absent, a hash of the exact
    // raw body is just as stable across retries of the same event.
    const headerEventId = req.headers['x-razorpay-event-id'];
    const eventId = (typeof headerEventId === 'string' && headerEventId.trim())
      ? headerEventId.trim()
      : `sha256:${crypto.createHash('sha256').update(rawBodyBuffer).digest('hex')}`;

    // Claim the event FIRST via the UNIQUE(gateway_event_id) constraint — this
    // is atomic, so two concurrent deliveries can't both proceed (the old
    // select-then-insert let them race).
    const { error: claimErr } = await supabaseServer.from('payment_events').insert([{
      gateway_event_id: eventId,
      event_type: event.event,
      payload: event,
      processed_at: new Date().toISOString(),
    }]);
    if (claimErr) {
      if (claimErr.code === '23505') {
        return res.json({ status: 'ok', message: 'Event already processed.' });
      }
      console.error('[API Webhook] could not record event:', claimErr);
      return res.status(500).json({ error: 'Webhook processing error.' });
    }

    try {
      // Only a captured payment can mark an order paid. payment.failed,
      // refund.* and everything else are recorded above and change no order.
      if (event.event === 'payment.captured') {
        await processCapturedPaymentEvent(event);
      }
    } catch (processErr) {
      // Release the claim so Razorpay's retry of this event can be processed.
      await supabaseServer.from('payment_events').delete().eq('gateway_event_id', eventId);
      throw processErr;
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('[API Webhook Exception]:', err);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Throws ONLY for transient failures (so the caller releases the idempotency
// claim and Razorpay retries). Everything that is a definitive "this payment
// does not match" is logged + audited and acknowledged — retrying it could
// never change the answer.
async function processCapturedPaymentEvent(event: any): Promise<void> {
  const db = supabaseServer!;
  const entity = event?.payload?.payment?.entity;
  const localOrderId = entity?.notes?.order_id;
  if (!entity || typeof entity.id !== 'string' || typeof localOrderId !== 'string' || !UUID_RE.test(localOrderId)) {
    console.error('[API Webhook] payment.captured with unusable payload — ignored.');
    return;
  }

  const { data: order, error: orderErr } = await db
    .from('orders')
    .select('id, total_amount, razorpay_order_id, order_status, user_id')
    .eq('id', localOrderId)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) {
    console.error('[API Webhook] payment.captured for unknown local order:', localOrderId);
    return;
  }

  const check = checkPaymentEntity(entity, {
    razorpayOrderId: order.razorpay_order_id,
    amountPaise: Math.round(Number(order.total_amount) * 100),
  });
  if (!check.ok) {
    console.error('[API Webhook] captured payment does not match local order:', check.reason, { orderId: order.id, paymentId: entity.id });
    await writeServerAuditLog({
      userId: order.user_id, action: 'PAYMENT_MISMATCH', resource: 'orders',
      details: { order_id: order.id, razorpay_payment_id: entity.id, reason: check.reason, path: 'webhook' },
    });
    return;
  }

  // FIXED (BUG-006/007): transitions payment_status + order_status together,
  // only from 'Awaiting Payment' — a late/duplicate webhook for an order that
  // is already Processing/Paid or was Cancelled matches zero rows (no-op) and
  // can never resurrect a cancelled order.
  const { data: marked, error: markErr } = await db.rpc('mark_order_paid_atomic', {
    p_order_id: order.id,
    p_transaction_id: entity.id,
    p_expected_statuses: ['Awaiting Payment'],
  });
  if (markErr) throw markErr;
  if (!marked && order.order_status === 'Cancelled') {
    // A real captured payment for an order we already cancelled: needs a
    // manual refund/decision — flag it instead of silently dropping it.
    await writeServerAuditLog({
      userId: order.user_id, action: 'LATE_PAYMENT_ON_CANCELLED_ORDER', resource: 'orders',
      details: { order_id: order.id, razorpay_payment_id: entity.id },
    });
  }
  // Commission crediting is handled by the trg_credit_affiliate_commission
  // trigger (migration 010) — fires automatically on the paid transition.
}

// ==========================================
// 5. SECURE ORDER TRACKING (RATE-LIMITED, IDOR-PROTECTED)
// ==========================================
const trackRateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function checkTrackRateLimit(key: string, max: number): Promise<boolean> {
  // FIXED (SEC-007): order tracking is on the audit's explicit sensitive-
  // endpoint list — fails closed (rejects on RPC failure) instead of
  // silently allowing unlimited tracking-lookup attempts during an outage.
  const { allowed } = await enforceRateLimit(key, max, 15 * 60, trackRateLimitMap, true);
  return allowed;
}

// FIXED (audit item 3): every guest failure mode — nonexistent identifier,
// wrong identifier, missing contact, wrong contact — now returns this one
// identical response (same status, same body), so the endpoint can no longer
// be used to learn which order numbers / tracking codes exist.
const TRACK_GENERIC_NOT_FOUND = { error: 'No matching order found. Please check the order/tracking number and the email or phone used at checkout.' };

// Compares fixed-length digests in constant time, and always evaluates both
// the email and the phone comparison, so neither the content nor the
// position of a mismatch shows up in response timing.
function guestContactMatches(input: string, shippingAddress: any): boolean {
  const digest = (v: string) => crypto.createHash('sha256').update(v.trim().toLowerCase()).digest();
  const given = digest(input || '');
  const addr = shippingAddress || {};
  const email = String(addr.email || '').trim().toLowerCase();
  const phone = String(addr.phone || '').trim().toLowerCase();
  const emailOk = Boolean(email) && crypto.timingSafeEqual(given, digest(email));
  const phoneOk = Boolean(phone) && crypto.timingSafeEqual(given, digest(phone));
  return emailOk || phoneOk;
}

function maskOrderReference(orderNumber: string): string {
  const v = String(orderNumber || '');
  if (v.length <= 5) return '••••';
  return `${v.slice(0, 3)}••••${v.slice(-2)}`;
}

app.post('/api/orders/track', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    if (!(await checkTrackRateLimit(`track:${clientIp}`, 10))) {
      return res.status(429).json({ error: 'Too many order tracking attempts. Please try again in 15 minutes.' });
    }

    const { trackingNumber, emailOrPhone } = req.body || {};
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return res.status(400).json({ error: 'Order ID or Tracking Number is required.' });
    }

    // Previously this raw value was interpolated directly into a PostgREST `.or()`
    // filter expression string, where `,`, `.`, `(`, `)`, and `%` are all syntax
    // characters. Stripping them neutralizes that class of issue regardless of
    // how the query below is written in the future.
    const cleanNum = trackingNumber.trim().replace(/[,.()%*]/g, '').slice(0, 100);

    if (!cleanNum) {
      return res.status(400).json({ error: 'Order ID or Tracking Number is required.' });
    }

    // Per-identifier limit too, so one order number can't be brute-forced
    // against many contact guesses from many IPs.
    if (!(await checkTrackRateLimit(`track:id:${cleanNum.toLowerCase()}`, 10))) {
      return res.status(429).json({ error: 'Too many order tracking attempts. Please try again in 15 minutes.' });
    }

    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const user = await authenticateUser(req);

    // `id` only participates in the lookup when the input is a real UUID —
    // comparing a uuid column to arbitrary text makes Postgres raise an error
    // that would otherwise look different from "not found".
    const TRACK_FIELDS = 'id, order_number, user_id, shipping_address, subtotal, discount_amount, shipping_charge, tax_amount, total_amount, payment_method, payment_status, order_status, tracking_number, courier_name, estimated_delivery_date, created_at, updated_at';
    const [byTracking, byOrderNumber, byId] = await Promise.all([
      supabaseServer.from('orders').select(TRACK_FIELDS).eq('tracking_number', cleanNum).limit(1),
      supabaseServer.from('orders').select(TRACK_FIELDS).eq('order_number', cleanNum).limit(1),
      UUID_RE.test(cleanNum)
        ? supabaseServer.from('orders').select(TRACK_FIELDS).eq('id', cleanNum).limit(1)
        : Promise.resolve({ data: null as any[] | null }),
    ]);

    const targetOrder =
      (byTracking.data?.length ? byTracking.data[0] : null) ||
      (byOrderNumber.data?.length ? byOrderNumber.data[0] : null) ||
      (byId.data?.length ? byId.data[0] : null);

    // 1) The signed-in owner, or a verified (MFA-complete) admin, is an
    //    authorised viewer and gets the full order.
    if (user && targetOrder && (targetOrder.user_id === user.id || (await isVerifiedAdmin(req, user.id)))) {
      return res.json({ success: true, order: targetOrder });
    }

    // 2) Everyone else — guests AND signed-in users who are not the owner —
    //    must prove contact ownership and only ever receive a minimal DTO.
    //    The contact comparison always runs (against an empty address when
    //    the order doesn't exist) so the failure paths stay indistinguishable.
    const contactOk = guestContactMatches(String(emailOrPhone || ''), targetOrder?.shipping_address);
    if (!targetOrder || !contactOk) {
      return res.status(404).json(TRACK_GENERIC_NOT_FOUND);
    }

    // Timeline: status + timestamp ONLY. Admin notes are private and never
    // included here.
    const { data: history } = await supabaseServer
      .from('order_status_history')
      .select('status, created_at')
      .eq('order_id', targetOrder.id)
      .order('created_at', { ascending: true });

    return res.json({
      success: true,
      minimal: true,
      order: {
        reference: maskOrderReference(targetOrder.order_number),
        order_status: targetOrder.order_status,
        courier_name: targetOrder.courier_name || null,
        tracking_number: targetOrder.tracking_number || null,
        estimated_delivery_date: targetOrder.estimated_delivery_date || null,
        timeline: (history || []).map((h: any) => ({ status: h.status, at: h.created_at })),
      },
    });
  } catch (err: any) {
    console.error('[API Order Track Error]:', err);
    return res.status(500).json({ error: 'Error processing order tracking.' });
  }
});

// ==========================================
// CLOUDFLARE R2 OBJECT STORAGE UPLOAD ROUTE (security audit items 1, 6, 7)
// ==========================================
// FIXED (item 6): the client-declared `fileType` used to decide the allowed
// types, the size class AND the stored Content-Type, and the bytes were never
// looked at — so an HTML/SVG/script file could be uploaded under an
// "image/png" label. Now the type is determined ONLY from the file's actual
// leading bytes (magic numbers); anything that doesn't match the allowlist
// (SVG, HTML, scriptable documents, mismatched or unknown content) is
// rejected BEFORE anything is stored. The client's fileType and file name are
// ignored; the object key and extension are generated server-side.
// (Hand-rolled signatures rather than a dependency: the allowlist is tiny and
// the popular detector, file-type, is ESM-only which doesn't load from this
// CJS server bundle.)
type DetectedFile = { mime: string; ext: string; kind: 'image' | 'pdf' | 'audio' };

function detectFileType(buf: Buffer): DetectedFile | null {
  if (buf.length < 12) return null;
  const ascii = (start: number, end: number) => buf.toString('latin1', start, end);
  // Images
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' };
  if (buf[0] === 0x89 && ascii(1, 4) === 'PNG' && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) {
    return { mime: 'image/png', ext: 'png', kind: 'image' };
  }
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return { mime: 'image/gif', ext: 'gif', kind: 'image' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp', kind: 'image' };
  // PDF — header must be at byte 0 (rejects HTML/PDF polyglots with a prefix)
  if (ascii(0, 5) === '%PDF-') return { mime: 'application/pdf', ext: 'pdf', kind: 'pdf' };
  // Audio
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return { mime: 'audio/wav', ext: 'wav', kind: 'audio' };
  if (ascii(0, 4) === 'OggS') return { mime: 'audio/ogg', ext: 'ogg', kind: 'audio' };
  if (ascii(0, 3) === 'ID3') return { mime: 'audio/mpeg', ext: 'mp3', kind: 'audio' };
  if (buf[0] === 0xff && (buf[1] & 0xf6) === 0xf0) return { mime: 'audio/aac', ext: 'aac', kind: 'audio' }; // ADTS AAC
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0 && (buf[1] & 0x06) !== 0) return { mime: 'audio/mpeg', ext: 'mp3', kind: 'audio' }; // MPEG frame sync
  if (ascii(4, 8) === 'ftyp' && ['M4A ', 'M4B ', 'isom', 'mp41', 'mp42', 'iso2'].includes(ascii(8, 12))) {
    return { mime: 'audio/mp4', ext: 'm4a', kind: 'audio' };
  }
  return null;
}

const MEDIA_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MEDIA_MAX_OTHER_BYTES = MEDIA_UPLOAD_MAX_RAW_BYTES;
const MEDIA_MAX_ENCODED_LENGTH = Math.ceil(MEDIA_UPLOAD_MAX_RAW_BYTES / 3) * 4 + 4;
const MAX_CONCURRENT_UPLOADS = 2;
let activeUploads = 0;

// Gate 1 (item 1/7): authenticate + verify MFA BEFORE the body is read, so an
// anonymous or password-only caller can't make the server buffer megabytes.
const uploadAuthGate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    (req as any).adminUser = admin;
    next();
  } catch (err) {
    console.error('[R2 Media Upload] auth gate error:', err);
    res.status(500).json({ success: false, error: 'Upload failed.' });
  }
};

// Gate 2 (item 7): declared-size precheck + bounded concurrency.
const uploadConcurrencyGate = (req: Request, res: Response, next: NextFunction) => {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > MEDIA_UPLOAD_JSON_LIMIT_BYTES) {
    return res.status(413).json({ success: false, error: 'File is too large.' });
  }
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    res.setHeader('Retry-After', '5');
    return res.status(429).json({ success: false, error: 'The server is busy with other uploads. Please retry in a few seconds.' });
  }
  activeUploads += 1;
  let released = false;
  const release = () => { if (!released) { released = true; activeUploads -= 1; } };
  res.on('close', release);
  res.on('finish', release);
  next();
};

app.post('/api/media/upload', uploadAuthGate, uploadConcurrencyGate, mediaUploadJsonParser, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).adminUser as { id: string; email: string };
    const { fileName, fileData, folder } = req.body || {};

    if (typeof fileName !== 'string' || typeof fileData !== 'string' || !fileName || !fileData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fileName and fileData (base64 string or data URL) are required.'
      });
    }

    // Strip a data-URL prefix if present — its declared MIME is IGNORED.
    let base64Content = fileData;
    const dataUrlPrefix = /^data:[^;,]{1,100};base64,/.exec(fileData);
    if (dataUrlPrefix) base64Content = fileData.slice(dataUrlPrefix[0].length);

    // Length is enforced BEFORE any decoding.
    if (base64Content.length > MEDIA_MAX_ENCODED_LENGTH) {
      return res.status(413).json({ success: false, error: 'File is too large.' });
    }
    if (base64Content.length === 0 || base64Content.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64Content)) {
      return res.status(400).json({ success: false, error: 'The file data is not valid base64.' });
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');
    const padding = base64Content.endsWith('==') ? 2 : base64Content.endsWith('=') ? 1 : 0;
    if (fileBuffer.length !== (base64Content.length / 4) * 3 - padding) {
      return res.status(400).json({ success: false, error: 'The file data is not valid base64.' });
    }

    // The real type comes from the bytes, not from anything the client said.
    const detected = detectFileType(fileBuffer);
    if (!detected) {
      return res.status(400).json({
        success: false,
        error: 'This file type is not permitted. Only real JPG, PNG, WebP or GIF images, PDFs, and audio files (MP3, WAV, OGG, AAC, M4A) are supported.'
      });
    }

    const maxSizeBytes = detected.kind === 'image' ? MEDIA_MAX_IMAGE_BYTES : MEDIA_MAX_OTHER_BYTES;
    if (fileBuffer.length > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: `File size exceeds the allowed limit of ${detected.kind === 'image' ? '10MB' : '50MB'} for this file type.`
      });
    }

    // Polyglot guard for images: a genuine image has no reason to contain
    // markup that a browser could run as a page.
    if (detected.kind === 'image') {
      const text = fileBuffer.toString('latin1').toLowerCase();
      if (text.includes('<script') || text.includes('<html') || text.includes('<svg') || text.includes('javascript:')) {
        return res.status(400).json({ success: false, error: 'This file contains content that is not permitted in an image.' });
      }
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

    // Object key is generated here: safe folder segments only, random name,
    // extension from the DETECTED type — nothing from the client file name.
    const safeFolder = String(typeof folder === 'string' ? folder : 'general')
      .split('/')
      .map(seg => seg.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40))
      .filter(Boolean)
      .slice(0, 2)
      .join('/') || 'general';
    const objectKey = `${safeFolder}/${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${detected.ext}`;

    const abort = new AbortController();
    const abortTimer = setTimeout(() => abort.abort(), 45_000);
    try {
      await r2Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: detected.mime,
        ContentDisposition: 'inline',
        CacheControl: 'public, max-age=31536000, immutable',
      }), { abortSignal: abort.signal });
    } finally {
      clearTimeout(abortTimer);
    }

    let publicUrl = '';
    if (publicUrlBase) {
      publicUrl = `${publicUrlBase.replace(/\/+$/, '')}/${objectKey}`;
    } else {
      publicUrl = `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.dev/${objectKey}`;
    }

    await writeServerAuditLog({
      userId: admin.id, actorEmail: admin.email, action: 'MEDIA_UPLOAD', resource: 'media',
      details: { key: objectKey, contentType: detected.mime, size: fileBuffer.length }, ip: getClientIp(req),
    });

    return res.json({
      success: true,
      url: publicUrl,
      key: objectKey,
      size: fileBuffer.length,
      contentType: detected.mime
    });

  } catch (err: any) {
    // Full detail goes to the server log only; the client gets a generic message.
    console.error('[R2 Media Upload Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload file. Please try again, or contact support if the problem continues.'
    });
  }
});

// Turns body-parser failures into clean JSON instead of a stack-trace page.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request body too large.' });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ success: false, error: 'Invalid request body.' });
  }
  console.error('[Unhandled API Error]:', err);
  return res.status(500).json({ success: false, error: 'Server error.' });
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
    console.log(`Shakti Se Shanti Tak Hardened Server running on http://${HOST}:${PORT}`);
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
