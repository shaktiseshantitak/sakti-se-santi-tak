-- ====================================================================
-- MIGRATION 015: STOCK RESTORE RPC + "AWAITING PAYMENT" ORDER STATUS
-- ====================================================================
-- BUG (2026-08-29 report): "Orders are placed even when payment fails."
--
-- Root cause: /api/orders/create decremented stock and set
-- order_status='Processing' immediately for ONLINE payment methods too
-- (Razorpay/UPI/Card) — before the customer had even seen the Razorpay
-- popup, let alone paid. If they closed the popup, the payment failed, or
-- signature verification failed, nothing ever rolled that back: the
-- order sat in the database forever as a real-looking "Processing" order
-- with stock already deducted for a sale that never happened.
--
-- Fix (server.ts): online-payment orders are now created with
-- order_status='Awaiting Payment' instead of 'Processing', and are
-- explicitly cancelled — via this migration's increment_inventory RPC
-- restoring the stock — the moment the Razorpay popup is dismissed or
-- payment verification fails. Only a real successful payment flips the
-- order to 'Processing'/'Paid'. COD is unaffected (payment is inherently
-- deferred to delivery for COD, so immediate 'Processing' remains
-- correct there).
-- ====================================================================

CREATE OR REPLACE FUNCTION public.increment_inventory(p_book_id TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_book_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid product ID: %', p_book_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_inventory(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_inventory(TEXT, INTEGER) TO service_role;

-- order_status is a real Postgres ENUM (order_status_enum) — 'Awaiting
-- Payment' has to be added as a valid value before any order can use it.
-- ALTER TYPE ... ADD VALUE cannot run inside the same transaction block as
-- other statements that might use it, so it's kept as its own statement.
ALTER TYPE order_status_enum ADD VALUE IF NOT EXISTS 'Awaiting Payment';
