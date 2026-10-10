-- ====================================================================
-- DHARMA BOOKS PRO - MIGRATION 002: SECURITY HARDENING & RLS FIXES
-- ====================================================================

-- 1. RESTRICT EXECUTE ON decrement_inventory TO service_role ONLY
REVOKE EXECUTE ON FUNCTION public.decrement_inventory(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_inventory(TEXT, INTEGER) TO service_role;

-- 2. ENABLE ROW LEVEL SECURITY ON MISSING TABLES
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR COUPONS
DROP POLICY IF EXISTS "Public read active non-expired coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admin write coupons" ON public.coupons;

CREATE POLICY "Public read active non-expired coupons" ON public.coupons 
FOR SELECT USING (
  (is_active = true AND (expires_at IS NULL OR expires_at > NOW())) OR public.is_admin()
);

CREATE POLICY "Admin write coupons" ON public.coupons 
FOR ALL USING (public.is_admin());

-- 4. RLS POLICIES FOR SITE_SETTINGS
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin write site_settings" ON public.site_settings;

CREATE POLICY "Public read site_settings" ON public.site_settings 
FOR SELECT USING (true);

CREATE POLICY "Admin write site_settings" ON public.site_settings 
FOR ALL USING (public.is_admin());

-- 5. RLS POLICIES FOR BOOK_VARIANTS
DROP POLICY IF EXISTS "Public read book_variants" ON public.book_variants;
DROP POLICY IF EXISTS "Admin write book_variants" ON public.book_variants;

CREATE POLICY "Public read book_variants" ON public.book_variants 
FOR SELECT USING (true);

CREATE POLICY "Admin write book_variants" ON public.book_variants 
FOR ALL USING (public.is_admin());

-- 6. RLS POLICIES FOR INVENTORY_MOVEMENTS
DROP POLICY IF EXISTS "Admin view inventory_movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Admin insert inventory_movements" ON public.inventory_movements;

CREATE POLICY "Admin view inventory_movements" ON public.inventory_movements 
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin insert inventory_movements" ON public.inventory_movements 
FOR INSERT WITH CHECK (public.is_admin());

-- 7. RLS POLICIES FOR ORDER_STATUS_HISTORY
DROP POLICY IF EXISTS "Users view order status history for own orders" ON public.order_status_history;
DROP POLICY IF EXISTS "Admin write order status history" ON public.order_status_history;

CREATE POLICY "Users view order status history for own orders" ON public.order_status_history 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_status_history.order_id 
    AND (orders.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Admin write order status history" ON public.order_status_history 
FOR INSERT WITH CHECK (public.is_admin());
