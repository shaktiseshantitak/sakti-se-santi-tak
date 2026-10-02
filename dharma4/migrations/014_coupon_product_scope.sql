-- ====================================================================
-- MIGRATION 014: OPTIONAL PRODUCT-SCOPED COUPONS
-- ====================================================================
-- BUG (2026-08-28 report): the coupon creation form had no way to
-- restrict a voucher to one specific book — every coupon applied to the
-- whole cart with no option otherwise. Adds a single nullable FK; NULL
-- (the default) means "applies to the whole order", unchanged from
-- today's behaviour, so this is fully backward compatible.
-- ====================================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS applicable_book_id TEXT REFERENCES public.books(id) ON DELETE SET NULL;
