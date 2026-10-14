-- ====================================================================
-- MIGRATION 009: COUPON VALIDATION GAPS (FINANCIAL INTEGRITY FIX)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT:
-- The coupon lookup in /api/orders/create (server.ts) only ever checked
-- `is_active = true` before applying a discount. It never checked:
--   - expires_at — an expired coupon kept working indefinitely, because this
--     code runs on the SERVICE ROLE client, which bypasses the RLS policy
--     ("Public read active non-expired coupons") that would otherwise have
--     enforced this for a normal client.
--   - min_order_amount — a coupon meant for orders over a minimum threshold
--     could be applied to any order regardless of size.
--   - usage_limit vs times_used — a coupon meant to be capped at N total uses
--     had no cap at all, because times_used was never even incremented
--     anywhere in the codebase to begin with.
-- Net effect: any coupon, once created, effectively never expired, had no
-- minimum-order enforcement, and had no usage cap — a real, ongoing revenue
-- leak, not just a theoretical one.
--
-- FIX: add an atomic RPC to increment times_used (mirroring the existing
-- decrement_inventory() pattern used for stock) so usage tracking is safe
-- under concurrent checkouts, not a read-then-write race.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET times_used = COALESCE(times_used, 0) + 1
  WHERE id = p_coupon_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(TEXT) TO service_role;
