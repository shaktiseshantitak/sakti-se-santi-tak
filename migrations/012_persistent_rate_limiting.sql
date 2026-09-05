-- ====================================================================
-- MIGRATION 012: PERSISTENT RATE LIMITING (SECURITY AUDIT FINDING)
-- ====================================================================
--
-- BUG FOUND DURING SECURITY AUDIT:
-- server.ts's three rate limiters (general /api/* traffic, /api/auth/*
-- brute-force protection, and /api/orders/track IDOR-guard) all counted
-- requests in plain in-memory `Map` objects (ipRequestCounts,
-- authAttemptCounts, trackRateLimitMap).
--
-- This project deploys to Netlify Functions (see netlify/functions/api.ts,
-- which wraps server.ts's Express app with serverless-http). Serverless
-- functions do not guarantee the same warm instance handles the next
-- request — under any real traffic (and especially under an actual brute-
-- force/abuse attempt, which by definition sends many concurrent
-- requests), each request can land on a different, independent Lambda
-- instance with its own empty Map starting back at count = 0. In
-- practice this meant the rate limits were close to decorative in
-- production: spreading requests across concurrent invocations bypasses
-- them almost entirely, exactly the failure mode called out in the audit
-- ("do not use an unsafe in-memory-only rate limiter if the production
-- architecture requires multiple instances").
--
-- FIX: move the counters into Postgres (shared by every function
-- instance) behind one atomic, row-locked RPC. server.ts now calls this
-- instead of touching a local Map. Only the trusted service-role server
-- client may call it — no policy is granted to anon/authenticated, so
-- this table and function are unreachable from the browser.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    rate_key TEXT PRIMARY KEY,
    request_count INT NOT NULL DEFAULT 0,
    window_reset_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: RLS default-denies anon/authenticated
-- entirely. Only the service-role connection used by server.ts (which
-- bypasses RLS) can read/write this table.

-- ---------------------------------------------------------------------
-- check_and_increment_rate_limit: atomically checks and increments a
-- request counter for p_key within a p_window_seconds sliding window,
-- capped at p_max_requests. Row-locked (FOR UPDATE) so concurrent
-- requests hitting the same key serialize instead of racing each other
-- past the limit.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS TABLE(allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_row public.api_rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.api_rate_limits WHERE rate_key = p_key FOR UPDATE;

  IF NOT FOUND OR v_row.window_reset_at <= v_now THEN
    INSERT INTO public.api_rate_limits (rate_key, request_count, window_reset_at)
    VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
    ON CONFLICT (rate_key) DO UPDATE
      SET request_count = 1, window_reset_at = EXCLUDED.window_reset_at;
    RETURN QUERY SELECT TRUE, 0;
    RETURN;
  END IF;

  IF v_row.request_count >= p_max_requests THEN
    RETURN QUERY SELECT FALSE, GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_row.window_reset_at - v_now)))::INT);
    RETURN;
  END IF;

  UPDATE public.api_rate_limits SET request_count = request_count + 1 WHERE rate_key = p_key;
  RETURN QUERY SELECT TRUE, 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, INT) TO service_role;

-- Housekeeping: nothing purges old rows on its own. This is a cheap,
-- optional cleanup an admin/cron can run periodically; not required for
-- correctness (expired rows are simply ignored/overwritten on next use).
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_reset_at ON public.api_rate_limits(window_reset_at);
