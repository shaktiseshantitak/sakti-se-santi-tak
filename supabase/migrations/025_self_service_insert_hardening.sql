-- ====================================================================
-- MIGRATION 025: STOP USERS FROM WRITING THEIR OWN MODERATION/APPROVAL STATE
-- ====================================================================
-- Found in the full security review of Oct 2026. Two INSERT policies only
-- checked "this row belongs to me" and nothing about the row's CONTENT. Because
-- the Supabase anon key is public and PostgREST accepts any column, a logged-in
-- user could bypass the website entirely and send the insert themselves:
--
--  1. reviews: INSERT ... is_approved = true / is_verified = true
--     -> their review would go live instantly, skipping admin moderation and
--        showing a fake "verified" badge. (The site itself always inserts
--        is_approved = false, so nothing legitimate breaks.)
--
--  2. affiliate_withdrawals: INSERT ... status = 'APPROVED'
--     -> a self-approved payout request that the admin could mistake for one
--        they had approved. (The site always inserts status = 'PENDING'.)
--
-- Admins are unaffected (public.is_admin() still passes). The balance-integrity
-- trigger on affiliate_withdrawals (migration 005/022) is untouched.
-- Safe to re-run.
-- ====================================================================

DROP POLICY IF EXISTS "Insert own reviews" ON public.reviews;
CREATE POLICY "Insert own reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = user_id
      AND is_approved IS NOT TRUE
      AND COALESCE(is_verified, false) = false
    )
  );

DROP POLICY IF EXISTS "Affiliates insert own withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Affiliates insert own withdrawals" ON public.affiliate_withdrawals
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = affiliate_user_id
      AND status = 'PENDING'
    )
  );
