-- ====================================================================
-- MIGRATION 010: REAL AFFILIATE SYSTEM (was localStorage-only)
-- ====================================================================
--
-- BUG REPORTED: "Affiliate & Referral Portal code base hai, database nahi
-- hai" — correct. The whole affiliate/commission/team/click system ran
-- entirely on browser localStorage:
--   - Referral link clicks were never counted anywhere durable
--   - There was no link between an actual order and the affiliate who
--     referred it (orders had no referral_code column at all)
--   - Commission was never calculated from real orders — only ever
--     client-side, and (per the earlier RLS fix) could only actually reach
--     affiliate_wallet_ledger via an admin-only insert, meaning real
--     commission crediting never happened through normal usage
--   - "My 3-Level Team" had no real parent/child relationship anywhere in
--     the database — it was 100% fabricated on the client
--
-- This migration adds the minimum real schema needed to back all of that
-- with actual data: who referred whom, how many real clicks a referral
-- link got, which order came from which affiliate, and RPCs to compute
-- real stats and credit real 3-level commission when an order is paid.
-- ====================================================================

-- Who referred this affiliate (their own upline), by referral code. Using
-- the code (not a UUID FK) keeps this simple to resolve recursively without
-- needing a separate closure table for a fixed 3-level depth.
ALTER TABLE public.affiliate_accounts
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT REFERENCES public.affiliate_accounts(referral_code);

-- Which affiliate (if any) an order should credit commission to.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT;

-- Real click tracking — one row per click, so counts are genuine and can be
-- deduplicated/analyzed later if needed (e.g. by day) rather than being a
-- single mutable counter.
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (including a logged-out visitor clicking a referral link) can
-- record a click; nobody can read the raw click log directly — stats are
-- exposed only through the aggregate RPC below.
CREATE POLICY "Public insert affiliate_clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read affiliate_clicks" ON public.affiliate_clicks FOR SELECT USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON public.affiliate_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code_used);
CREATE INDEX IF NOT EXISTS idx_affiliate_accounts_referred_by ON public.affiliate_accounts(referred_by_code);

-- ---------------------------------------------------------------------
-- record_affiliate_click: callable by anyone (even logged out) to log a
-- real click on a referral link. Silently no-ops on an unknown code rather
-- than erroring, since this fires automatically on page load.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_affiliate_click(p_referral_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.affiliate_accounts WHERE referral_code = p_referral_code) THEN
    INSERT INTO public.affiliate_clicks (referral_code) VALUES (p_referral_code);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_affiliate_click(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- get_affiliate_dashboard: real, computed-from-actual-data stats for one
-- affiliate — replaces the localStorage-only numbers entirely.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_total_clicks INT;
  v_total_orders INT;
  v_total_sales NUMERIC;
  v_total_earnings NUMERIC;
  v_pending_earnings NUMERIC;
  v_withdrawable NUMERIC;
  v_team_count INT;
  v_result JSON;
BEGIN
  SELECT referral_code INTO v_code FROM public.affiliate_accounts WHERE user_id = p_user_id;
  IF v_code IS NULL THEN
    RETURN json_build_object('error', 'not_an_affiliate');
  END IF;

  SELECT COUNT(*) INTO v_total_clicks FROM public.affiliate_clicks WHERE referral_code = v_code;

  SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_sales
    FROM public.orders
    WHERE referral_code_used = v_code AND payment_status = 'Paid';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_earnings
    FROM public.affiliate_wallet_ledger WHERE affiliate_user_id = p_user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_pending_earnings
    FROM public.affiliate_wallet_ledger
    WHERE affiliate_user_id = p_user_id AND entry_type = 'COMMISSION'
      AND created_at > NOW() - INTERVAL '7 days';

  v_withdrawable := public.get_affiliate_available_balance(p_user_id);

  SELECT COUNT(*) INTO v_team_count FROM public.affiliate_accounts WHERE referred_by_code = v_code;

  v_result := json_build_object(
    'referralCode', v_code,
    'totalClicks', v_total_clicks,
    'totalOrders', v_total_orders,
    'totalSalesValue', v_total_sales,
    'conversionRate', CASE WHEN v_total_clicks > 0 THEN ROUND((v_total_orders::NUMERIC / v_total_clicks) * 100, 2) ELSE 0 END,
    'totalEarnings', v_total_earnings,
    'pendingEarnings', v_pending_earnings,
    'withdrawableBalance', v_withdrawable,
    'teamSize', v_team_count
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- get_affiliate_team: real 3-level downline, by walking referred_by_code.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_affiliate_team(p_user_id UUID)
RETURNS TABLE(member_user_id UUID, member_name TEXT, member_email TEXT, level INT, joined_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code FROM public.affiliate_accounts WHERE user_id = p_user_id;
  IF v_code IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH level1 AS (
    SELECT aa.user_id, aa.referral_code, aa.created_at
    FROM public.affiliate_accounts aa WHERE aa.referred_by_code = v_code
  ),
  level2 AS (
    SELECT aa.user_id, aa.referral_code, aa.created_at
    FROM public.affiliate_accounts aa WHERE aa.referred_by_code IN (SELECT referral_code FROM level1)
  ),
  level3 AS (
    SELECT aa.user_id, aa.referral_code, aa.created_at
    FROM public.affiliate_accounts aa WHERE aa.referred_by_code IN (SELECT referral_code FROM level2)
  )
  SELECT l.user_id, COALESCE(p.full_name, p.email, 'Member'), p.email, lvl, l.created_at
  FROM (
    SELECT user_id, created_at, 1 AS lvl FROM level1
    UNION ALL SELECT user_id, created_at, 2 FROM level2
    UNION ALL SELECT user_id, created_at, 3 FROM level3
  ) l
  JOIN public.profiles p ON p.id = l.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_team(UUID) TO authenticated;

-- ---------------------------------------------------------------------
-- credit_affiliate_commission: called server-side (service_role only) once
-- a payment is actually verified/captured for an order. Walks up to 3
-- levels of the referring affiliate's upline and credits each their
-- configured percentage into affiliate_wallet_ledger — the same ledger
-- table the withdrawal-balance-integrity trigger (migration 005) already
-- trusts as the authoritative source of truth. Idempotent: if an order's
-- commission was already credited (checked via reference_order_id), this
-- does nothing on a second call — safe to call again from a webhook retry.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_affiliate_commission(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_l1_user UUID; v_l1_code TEXT;
  v_l2_user UUID; v_l2_code TEXT;
  v_l3_user UUID; v_l3_code TEXT;
  -- Matches DEFAULT_COMMISSION_SETTINGS in src/services/affiliateService.ts.
  -- Kept in sync manually since commission settings aren't yet a real DB
  -- table (a known, separately-flagged gap) — this is the authoritative
  -- rate actually applied to real money, regardless of what the client UI
  -- displays.
  v_l1_pct NUMERIC := 10;
  v_l2_pct NUMERIC := 5;
  v_l3_pct NUMERIC := 2.5;
BEGIN
  SELECT id, total_amount, referral_code_used, order_number INTO v_order
  FROM public.orders WHERE id = p_order_id;

  IF v_order.referral_code_used IS NULL THEN
    RETURN; -- no referral involved in this order
  END IF;

  IF EXISTS (SELECT 1 FROM public.affiliate_wallet_ledger WHERE reference_order_id = p_order_id) THEN
    RETURN; -- already credited — idempotent no-op
  END IF;

  -- Level 1: the affiliate whose code was actually used at checkout.
  SELECT user_id, referral_code, referred_by_code INTO v_l1_user, v_l1_code, v_l2_code
  FROM public.affiliate_accounts WHERE referral_code = v_order.referral_code_used;

  IF v_l1_user IS NOT NULL THEN
    INSERT INTO public.affiliate_wallet_ledger (affiliate_user_id, amount, entry_type, reference_order_id, description)
    VALUES (v_l1_user, ROUND(v_order.total_amount * v_l1_pct / 100, 2), 'COMMISSION', p_order_id,
            'Level 1 commission — order ' || v_order.order_number);
  END IF;

  -- Level 2: whoever referred the level-1 affiliate.
  IF v_l2_code IS NOT NULL THEN
    SELECT user_id, referred_by_code INTO v_l2_user, v_l3_code
    FROM public.affiliate_accounts WHERE referral_code = v_l2_code;

    IF v_l2_user IS NOT NULL THEN
      INSERT INTO public.affiliate_wallet_ledger (affiliate_user_id, amount, entry_type, reference_order_id, description)
      VALUES (v_l2_user, ROUND(v_order.total_amount * v_l2_pct / 100, 2), 'COMMISSION', p_order_id,
              'Level 2 commission — order ' || v_order.order_number);

      -- Level 3: whoever referred the level-2 affiliate.
      IF v_l3_code IS NOT NULL THEN
        SELECT user_id INTO v_l3_user FROM public.affiliate_accounts WHERE referral_code = v_l3_code;
        IF v_l3_user IS NOT NULL THEN
          INSERT INTO public.affiliate_wallet_ledger (affiliate_user_id, amount, entry_type, reference_order_id, description)
          VALUES (v_l3_user, ROUND(v_order.total_amount * v_l3_pct / 100, 2), 'COMMISSION', p_order_id,
                  'Level 3 commission — order ' || v_order.order_number);
        END IF;
      END IF;
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.credit_affiliate_commission(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_affiliate_commission(UUID) TO service_role;

-- ---------------------------------------------------------------------
-- Fires commission crediting automatically whenever payment_status
-- transitions to 'Paid', regardless of which code path did it — covers the
-- Razorpay verify endpoint, the webhook, AND an admin manually marking a
-- COD order as paid from the admin panel (a plain client-side
-- orders.update(), not a dedicated API route). This is the only place
-- credit_affiliate_commission is actually invoked from; server.ts doesn't
-- call it directly anywhere, relying entirely on this trigger.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_credit_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'Paid' AND (OLD.payment_status IS DISTINCT FROM 'Paid') THEN
    PERFORM public.credit_affiliate_commission(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_affiliate_commission ON public.orders;
CREATE TRIGGER trg_credit_affiliate_commission
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.trigger_credit_affiliate_commission();
