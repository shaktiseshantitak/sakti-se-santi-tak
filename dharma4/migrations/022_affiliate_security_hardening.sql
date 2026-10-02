-- ====================================================================
-- MIGRATION 022: AFFILIATE IDOR FIXES + RLS HARDENING
-- ====================================================================
-- Source: FINAL_BUG_SECURITY_AUDIT.md STEP 5 (SEC-001, 002, 003, 004,
-- 005, 006), verified against the live migrations before writing this.
-- ====================================================================

-- ---------------------------------------------------------------------
-- SEC-001 / SEC-002: get_affiliate_dashboard(p_user_id) and
-- get_affiliate_team(p_user_id) accepted a caller-supplied user ID with
-- no check that it belonged to the caller — GRANTed to `authenticated`,
-- so any logged-in user could call either RPC directly (bypassing the
-- UI entirely) with a DIFFERENT user's UUID and read that person's full
-- affiliate dashboard (clicks/orders/sales/earnings) or team list. Both
-- now ignore a mismatched p_user_id from a non-admin caller instead of
-- trusting it — auth.uid() (or an explicit admin override) decides whose
-- data is actually returned, not the parameter.
-- SEC-006 (same function): member_email is no longer returned at all —
-- it was never actually displayed anywhere in the affiliate team UI
-- (only member_name/level/joined_at are used), so there was no feature
-- reason to expose it. Kept as a column (always NULL) rather than
-- removed, so the existing `row.member_email || ''` in
-- AffiliateContext.tsx keeps working with zero frontend changes.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_affiliate_dashboard(p_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_code TEXT;
  v_total_clicks INT;
  v_total_orders INT;
  v_total_sales NUMERIC;
  v_total_earnings NUMERIC;
  v_pending_earnings NUMERIC;
  v_withdrawable NUMERIC;
  v_team_count INT;
BEGIN
  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() AND NOT public.is_admin() THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  SELECT referral_code INTO v_code FROM public.affiliate_accounts WHERE user_id = v_user_id;
  IF v_code IS NULL THEN
    RETURN json_build_object('error', 'not_an_affiliate');
  END IF;

  SELECT COUNT(*) INTO v_total_clicks FROM public.affiliate_clicks WHERE referral_code = v_code;

  SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
    INTO v_total_orders, v_total_sales
    FROM public.orders
    WHERE referral_code_used = v_code AND payment_status = 'Paid';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_earnings
    FROM public.affiliate_wallet_ledger WHERE affiliate_user_id = v_user_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_pending_earnings
    FROM public.affiliate_wallet_ledger
    WHERE affiliate_user_id = v_user_id AND entry_type = 'COMMISSION'
      AND created_at > NOW() - INTERVAL '7 days';

  v_withdrawable := public.get_affiliate_available_balance(v_user_id);

  SELECT COUNT(*) INTO v_team_count FROM public.affiliate_accounts WHERE referred_by_code = v_code;

  RETURN json_build_object(
    'referralCode', v_code,
    'totalClicks', v_total_clicks,
    'totalOrders', v_total_orders,
    'totalSales', v_total_sales,
    'totalEarnings', v_total_earnings,
    'pendingEarnings', v_pending_earnings,
    'withdrawableBalance', v_withdrawable,
    'teamSize', v_team_count,
    'conversionRate', CASE WHEN v_total_clicks > 0 THEN ROUND((v_total_orders::NUMERIC / v_total_clicks) * 100, 2) ELSE 0 END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliate_dashboard(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_affiliate_team(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(member_user_id UUID, member_name TEXT, member_email TEXT, level INT, joined_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_code TEXT;
BEGIN
  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() AND NOT public.is_admin() THEN
    RETURN;
  END IF;
  v_user_id := COALESCE(p_user_id, auth.uid());
  IF v_user_id IS NULL THEN RETURN; END IF;

  SELECT referral_code INTO v_code FROM public.affiliate_accounts WHERE user_id = v_user_id;
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
  SELECT l.user_id, COALESCE(p.full_name, 'Member'), NULL::TEXT, lvl, l.created_at
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
-- SEC-005: record_affiliate_click had zero validation beyond "code
-- exists" — any anon caller could call it unlimited times with a valid
-- code and inflate that affiliate's click count arbitrarily, corrupting
-- their conversion-rate analytics. Adds a simple, dependency-free
-- dedup: the same referral code can only record one click per 30
-- seconds. This isn't perfect bot protection, but it closes the trivial
-- "call the RPC in a loop" abuse case without needing IP/session
-- tracking this table doesn't have.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_affiliate_click(p_referral_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_click TIMESTAMPTZ;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.affiliate_accounts WHERE referral_code = p_referral_code) THEN
    RETURN;
  END IF;

  SELECT MAX(created_at) INTO v_last_click
    FROM public.affiliate_clicks WHERE referral_code = p_referral_code;

  IF v_last_click IS NOT NULL AND v_last_click > NOW() - INTERVAL '30 seconds' THEN
    RETURN; -- silently deduped — same behavior the caller already expects (VOID, no error)
  END IF;

  INSERT INTO public.affiliate_clicks (referral_code) VALUES (p_referral_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_affiliate_click(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- SEC-003: "Affiliates update own account" allowed a user to UPDATE any
-- column on their OWN affiliate_accounts row, including status (undo
-- their own suspension), referral_code (impersonate a different code),
-- and referred_by_code (fake being referred by anyone, corrupting the
-- 3-level commission hierarchy). Nothing in this codebase's frontend
-- actually performs a direct client-side .update() on affiliate_accounts
-- (verified — every real mutation goes through service-role server code
-- or the RPCs above), so the fix is simply to remove this policy
-- entirely rather than narrow it: there is no legitimate client UPDATE
-- to preserve. Row creation (self-signup) still works via the separate
-- INSERT policy below, untouched.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Affiliates update own account" ON public.affiliate_accounts;
-- Admins can still manage rows via a dedicated admin policy so the
-- Control Panel's affiliate management doesn't lose write access.
DROP POLICY IF EXISTS "Admin manage affiliate_accounts" ON public.affiliate_accounts;
CREATE POLICY "Admin manage affiliate_accounts" ON public.affiliate_accounts FOR UPDATE USING (public.is_admin());

-- ---------------------------------------------------------------------
-- SEC-004: "Authenticated insert audit_logs" let ANY logged-in user
-- insert an arbitrary audit_logs row (any action, any target, any
-- actor) with no server-side control at all — undermining the table's
-- entire purpose as forensic/security evidence. The Control Panel's own
-- audit-log feature (BookContext.tsx addAuditLog(), called from admin
-- actions) DOES legitimately insert here client-side, so this can't
-- just be removed — it's tightened to admin-only instead, matching who
-- is actually supposed to be able to write an audit entry.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated insert audit_logs" ON public.audit_logs;
CREATE POLICY "Admin insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());
