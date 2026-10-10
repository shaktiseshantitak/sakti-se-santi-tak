-- ====================================================================
-- MIGRATION 005: AFFILIATE WITHDRAWAL BALANCE INTEGRITY (CRITICAL FIX)
-- ====================================================================
--
-- VULNERABILITY FOUND DURING AUDIT:
-- The affiliate wallet/commission/withdrawal system (src/services/affiliateService.ts,
-- src/context/AffiliateContext.tsx) computes wallet balances and validates withdrawal
-- requests entirely in the BROWSER using localStorage as the source of truth:
--
--   createWithdrawalRequest() reads `wallet.withdrawableBalance` from localStorage,
--   checks `amount > wallet.withdrawableBalance` CLIENT-SIDE ONLY, then inserts
--   directly into public.affiliate_withdrawals via the Supabase client SDK.
--
-- Because localStorage is fully attacker-controlled (any user can open devtools and
-- run `localStorage.setItem('dharma_affiliate_wallets', JSON.stringify({withdrawableBalance: 999999, ...}))`),
-- and because the ONLY database-side constraint on affiliate_withdrawals was
-- `CHECK (amount > 0)` plus an ownership RLS policy (auth.uid() = affiliate_user_id),
-- there was NO server-side check that a requested withdrawal amount was ever actually
-- earned. The admin approval UI (AdminAffiliateManagement.tsx) trusts the stored
-- `amount` at face value. This is a direct payout-fraud vector: an authenticated
-- affiliate could submit a withdrawal request for an arbitrary amount and, if approved,
-- receive a real payment for money they never earned.
--
-- Note: this also currently affects legitimate use, since commission crediting
-- (AffiliateService.processOrderCommission) tries to INSERT into
-- affiliate_wallet_ledger from the browser, but that table's INSERT policy requires
-- is_admin() — so for a non-admin affiliate, those inserts silently fail today
-- (errors are swallowed with console.warn). This migration also does not fix that
-- gap; it only prevents the balance from going negative / being fabricated. Real
-- commission crediting into affiliate_wallet_ledger should be moved server-side
-- (e.g. in /api/payment/verify) as a follow-up — flagged separately in the audit
-- report, not fixed here to avoid redesigning the whole affiliate feature in one pass.
--
-- FIX: enforce, at the database level (so it holds regardless of which client code
-- path is used, now or in the future), that a withdrawal's amount can never exceed
-- the affiliate's ledger-derived balance minus amounts already tied up in
-- pending/approved withdrawals.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_available_balance(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ledger_total NUMERIC;
  reserved_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO ledger_total
  FROM public.affiliate_wallet_ledger
  WHERE affiliate_user_id = p_user_id;

  -- Withdrawals that are already pending or approved are "spoken for" even before
  -- they land in the ledger as a WITHDRAWAL entry, so they must be subtracted here
  -- to avoid the same balance being withdrawn twice via concurrent requests.
  SELECT COALESCE(SUM(amount), 0) INTO reserved_total
  FROM public.affiliate_withdrawals
  WHERE affiliate_user_id = p_user_id
    AND status IN ('PENDING', 'APPROVED');

  RETURN ledger_total - reserved_total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_affiliate_available_balance(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_available_balance(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_affiliate_withdrawal_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available NUMERIC;
BEGIN
  available := public.get_affiliate_available_balance(NEW.affiliate_user_id);

  IF NEW.amount > available THEN
    RAISE EXCEPTION 'Withdrawal amount (%) exceeds available affiliate balance (%).', NEW.amount, available
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_affiliate_withdrawal_balance ON public.affiliate_withdrawals;
CREATE TRIGGER trg_enforce_affiliate_withdrawal_balance
  BEFORE INSERT ON public.affiliate_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_affiliate_withdrawal_balance();

-- Defense in depth: also block a withdrawal being re-approved for a higher amount
-- than the balance supports at the time of approval (in case amount is ever editable).
DROP TRIGGER IF EXISTS trg_enforce_affiliate_withdrawal_balance_upd ON public.affiliate_withdrawals;
CREATE TRIGGER trg_enforce_affiliate_withdrawal_balance_upd
  BEFORE UPDATE OF amount ON public.affiliate_withdrawals
  FOR EACH ROW
  WHEN (NEW.amount IS DISTINCT FROM OLD.amount)
  EXECUTE FUNCTION public.enforce_affiliate_withdrawal_balance();
