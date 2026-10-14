-- MIGRATION 003: RLS POLICIES HARDENING & SECURITY PERMISSIONS
-- Fixes missing INSERT/UPDATE/DELETE policies across categories, authors, reviews, orders, affiliate, and audit_logs

-- 1. CATEGORIES & AUTHORS (Admin Write Policies)
DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin write authors" ON public.authors;
CREATE POLICY "Admin write authors" ON public.authors FOR ALL USING (public.is_admin());

-- 2. REVIEWS (Admin Moderation & Deletion)
DROP POLICY IF EXISTS "Admin moderate reviews" ON public.reviews;
CREATE POLICY "Admin moderate reviews" ON public.reviews FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admin delete reviews" ON public.reviews;
CREATE POLICY "Admin delete reviews" ON public.reviews FOR DELETE USING (public.is_admin());

-- 3. ORDERS & ORDER ITEMS (Admin Write / Service Role Only)
DROP POLICY IF EXISTS "Admin write orders" ON public.orders;
CREATE POLICY "Admin write orders" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin write order_items" ON public.order_items;
CREATE POLICY "Admin write order_items" ON public.order_items FOR ALL USING (public.is_admin());

-- 4. AUDIT LOGS (Admin Manage & Authenticated Insert)
DROP POLICY IF EXISTS "Admin manage audit_logs" ON public.audit_logs;
CREATE POLICY "Admin manage audit_logs" ON public.audit_logs FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated insert audit_logs" ON public.audit_logs;
CREATE POLICY "Authenticated insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());

-- 5. AFFILIATE ACCOUNTS (User Read/Insert/Update Own, Admin Manage All)
DROP POLICY IF EXISTS "Affiliates insert own account" ON public.affiliate_accounts;
CREATE POLICY "Affiliates insert own account" ON public.affiliate_accounts FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Affiliates update own account" ON public.affiliate_accounts;
CREATE POLICY "Affiliates update own account" ON public.affiliate_accounts FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 6. AFFILIATE WALLET LEDGER (Admin / Service Role Write)
DROP POLICY IF EXISTS "Admin write affiliate_wallet_ledger" ON public.affiliate_wallet_ledger;
CREATE POLICY "Admin write affiliate_wallet_ledger" ON public.affiliate_wallet_ledger FOR INSERT WITH CHECK (public.is_admin());

-- 7. AFFILIATE WITHDRAWALS (User Request Own, Admin Process/Update)
DROP POLICY IF EXISTS "Affiliates insert own withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Affiliates insert own withdrawals" ON public.affiliate_withdrawals FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);

DROP POLICY IF EXISTS "Admin update affiliate_withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Admin update affiliate_withdrawals" ON public.affiliate_withdrawals FOR UPDATE USING (public.is_admin());
