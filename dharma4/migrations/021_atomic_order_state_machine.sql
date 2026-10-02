-- ====================================================================
-- MIGRATION 021: ATOMIC ORDER / PAYMENT / INVENTORY STATE MACHINE
-- ====================================================================
-- Source: FINAL_BUG_SECURITY_AUDIT.md, STEP 1-3 (BUG-001, 002, 003, 004,
-- 005, 006, 007, 008, 009, 010, 028), verified against the live code
-- before writing this fix.
--
-- Root cause shared by all of these: order creation, payment-state
-- transitions, stock restoration and coupon-usage tracking were each done
-- as multiple separate read-then-write calls from server.ts /
-- sweep-stale-orders.ts, instead of one atomic database operation. That
-- meant a failure partway through (BUG-001/002), or two of these
-- operations racing each other (BUG-008/009), could leave stock/order/
-- payment/coupon-usage state inconsistent: oversold-but-uncorrected
-- stock, stock restored twice for one cancellation, a cancelled order
-- reopened for payment (BUG-003/004), a late webhook resurrecting a
-- cancelled order (BUG-006/007), or a coupon usable more times than its
-- configured limit (BUG-010).
--
-- This migration adds three RPCs. A PL/pgSQL function body is one
-- implicit transaction — any RAISE EXCEPTION rolls back every write the
-- function made, including earlier iterations of a loop. Every *state
-- transition* (paying, cancelling) is done as a single conditional
-- `UPDATE ... WHERE order_status = ANY(expected) RETURNING id`, so two
-- concurrent callers can never both see the same "before" state and both
-- act on it — closing the read-then-write race behind BUG-008/009
-- directly, rather than just narrowing the window.
-- ====================================================================

-- ---------------------------------------------------------------------
-- 1. create_order_transactional
--    Replaces the sequential orders.insert + order_items.insert +
--    per-item decrement_inventory loop in POST /api/orders/create.
--    Any failure (bad book id, insufficient stock at the moment this
--    actually runs, coupon usage limit reached) raises an exception,
--    rolling back the order row, every item, and every stock decrement
--    already done in this same call — instead of leaving a cancelled
--    order sitting next to permanently-wrong stock (BUG-001/002). Also
--    writes the first order_status_history row here (BUG-028) and
--    performs the coupon usage check+increment atomically in the same
--    transaction as the order (BUG-010), instead of as a best-effort
--    call afterward that a concurrent order could race past the limit.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_transactional(
  p_order JSONB,  -- order_number, user_id, shipping_address, subtotal, discount_amount,
                  -- shipping_charge, tax_amount, total_amount, payment_method,
                  -- payment_status, order_status, coupon_code_used, referral_code_used
  p_items JSONB,  -- array of {book_id, book_title, unit_price, quantity, total_price, format, language}
  p_coupon_id TEXT DEFAULT NULL
)
RETURNS TABLE (order_id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_book_id TEXT;
  v_quantity INTEGER;
  v_coupon_ok INTEGER;
BEGIN
  IF p_coupon_id IS NOT NULL THEN
    -- Atomic check + reserve: only increments (and only lets the order
    -- proceed) if the coupon is still under its usage_limit at this exact
    -- moment — closes the race where two concurrent checkouts both read
    -- "not yet exhausted" and both apply the same limited-use coupon.
    UPDATE public.coupons
    SET times_used = COALESCE(times_used, 0) + 1
    WHERE id = p_coupon_id
      AND (usage_limit IS NULL OR COALESCE(times_used, 0) < usage_limit);
    GET DIAGNOSTICS v_coupon_ok = ROW_COUNT;
    IF v_coupon_ok = 0 THEN
      RAISE EXCEPTION 'COUPON_LIMIT_REACHED:%', p_coupon_id;
    END IF;
  END IF;

  INSERT INTO public.orders (
    order_number, user_id, shipping_address, subtotal, discount_amount,
    shipping_charge, tax_amount, total_amount, payment_method,
    payment_status, order_status, coupon_code_used, referral_code_used
  )
  SELECT
    p_order->>'order_number',
    (p_order->>'user_id')::UUID,
    p_order->'shipping_address',
    (p_order->>'subtotal')::NUMERIC,
    (p_order->>'discount_amount')::NUMERIC,
    (p_order->>'shipping_charge')::NUMERIC,
    (p_order->>'tax_amount')::NUMERIC,
    (p_order->>'total_amount')::NUMERIC,
    p_order->>'payment_method',
    (p_order->>'payment_status')::payment_status_enum,
    (p_order->>'order_status')::order_status_enum,
    p_order->>'coupon_code_used',
    p_order->>'referral_code_used'
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_book_id := v_item->>'book_id';
    v_quantity := (v_item->>'quantity')::INTEGER;

    INSERT INTO public.order_items (
      order_id, book_id, book_title, unit_price, quantity, total_price, format, language
    ) VALUES (
      v_order_id, v_book_id, v_item->>'book_title',
      (v_item->>'unit_price')::NUMERIC, v_quantity,
      (v_item->>'total_price')::NUMERIC,
      v_item->>'format', v_item->>'language'
    );

    -- Conditional, row-locked decrement: fails (and rolls back the WHOLE
    -- order via the exception below) if stock is insufficient at the
    -- moment this actually runs, even if an earlier pre-check in
    -- server.ts passed — e.g. a concurrent order for the same book beat
    -- this one to the last copies.
    UPDATE public.books
    SET stock = stock - v_quantity, updated_at = NOW()
    WHERE id = v_book_id AND stock >= v_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', v_book_id;
    END IF;

    INSERT INTO public.inventory_movements (book_id, change_quantity, movement_type, reference_id, notes)
    VALUES (v_book_id, -v_quantity, 'ORDER_PLACED', v_order_id::TEXT,
            'Order ' || (p_order->>'order_number') || ' placed');
  END LOOP;

  INSERT INTO public.order_status_history (order_id, status, notes)
  VALUES (v_order_id, (p_order->>'order_status')::order_status_enum, 'Order created');

  RETURN QUERY SELECT v_order_id, (p_order->>'order_number');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_transactional(JSONB, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_transactional(JSONB, JSONB, TEXT) TO service_role;

-- ---------------------------------------------------------------------
-- 2. cancel_order_atomic
--    Used by: cancelUnpaidOrderAndRestoreStock() (checkout abandonment /
--    signature-mismatch paths), the admin "Cancelled" status transition,
--    and the stale-order sweep. All three used to read order_status,
--    decide to cancel based on that read, then write the cancellation
--    and restore stock as separate later steps — so two of these running
--    at once (e.g. admin cancels the instant the sweep also picks it up)
--    could both see the pre-cancellation status and both restore stock
--    (BUG-008/009). The UPDATE below only ever matches (and only ever
--    reports success) for the ONE caller that actually performs the
--    transition; a second concurrent caller's UPDATE matches zero rows
--    and gets FOUND = false, so it never restores stock a second time.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
  p_order_id UUID,
  p_expected_statuses order_status_enum[],
  p_restore_reason TEXT,
  p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  UPDATE public.orders
  SET order_status = 'Cancelled',
      payment_status = CASE WHEN payment_status = 'Paid' THEN 'Refunded' ELSE 'Failed' END,
      updated_at = NOW()
  WHERE id = p_order_id AND order_status = ANY(p_expected_statuses);

  IF NOT FOUND THEN
    RETURN FALSE; -- already cancelled / already resolved elsewhere — no-op, don't double-restore
  END IF;

  FOR v_item IN SELECT book_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    UPDATE public.books SET stock = stock + v_item.quantity, updated_at = NOW() WHERE id = v_item.book_id;
    INSERT INTO public.inventory_movements (book_id, change_quantity, movement_type, reference_id, notes)
    VALUES (v_item.book_id, v_item.quantity, 'ORDER_CANCELLED', p_order_id::TEXT, p_restore_reason);
  END LOOP;

  INSERT INTO public.order_status_history (order_id, status, notes, updated_by)
  VALUES (p_order_id, 'Cancelled', p_restore_reason, p_updated_by);

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_order_atomic(UUID, order_status_enum[], TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(UUID, order_status_enum[], TEXT, UUID) TO service_role;

-- ---------------------------------------------------------------------
-- 3. mark_order_paid_atomic
--    Used by both /api/payment/verify and /api/payment/webhook — the
--    single place a real successful payment is recorded, so both paths
--    apply the exact same guarded transition instead of each doing its
--    own unconditional update (BUG-005/006). The WHERE clause is what
--    fixes BUG-007: a late webhook (or a replayed verify call) for an
--    order that a concurrent cancellation already moved to 'Cancelled'
--    matches zero rows and returns FALSE — it can no longer resurrect a
--    cancelled order back to Paid/Processing.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_order_paid_atomic(
  p_order_id UUID,
  p_transaction_id TEXT,
  p_expected_statuses order_status_enum[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET payment_status = 'Paid',
      payment_transaction_id = p_transaction_id,
      order_status = 'Processing',
      updated_at = NOW()
  WHERE id = p_order_id AND order_status = ANY(p_expected_statuses);

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.order_status_history (order_id, status, notes)
  VALUES (p_order_id, 'Processing', 'Payment confirmed');

  RETURN TRUE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_order_paid_atomic(UUID, TEXT, order_status_enum[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_paid_atomic(UUID, TEXT, order_status_enum[]) TO service_role;

-- increment_coupon_usage (migration 009) is superseded by the atomic
-- check-and-reserve now done inline in create_order_transactional above
-- — left in place (not dropped) only because dropping a function other
-- code might still reference is riskier than an unused leftover; it is
-- no longer called from server.ts after this migration.
