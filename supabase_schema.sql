-- ====================================================================
-- DHARMA BOOKS PRO - ENTERPRISE HARDENED DATABASE SCHEMA & MIGRATIONS
-- Compatible with Supabase PostgreSQL, Row-Level Security (RLS), and MFA (AAL2)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('customer', 'admin', 'editor', 'affiliate');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('Pending', 'Pending Verification', 'Paid', 'Failed', 'Refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE affiliate_status_enum AS ENUM ('pending', 'active', 'suspended', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE (Strictly User Metadata - NO ROLE Column!)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    addresses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ISOLATED USER ROLES TABLE (Single Source of Role Truth)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'customer',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 5. CATEGORIES & AUTHORS
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_hi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_name TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.authors (
    id TEXT PRIMARY KEY,
    name_hi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT,
    author_name TEXT NOT NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    offer_price NUMERIC(10, 2) NOT NULL CHECK (offer_price >= 0),
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    format TEXT DEFAULT 'Hardcover',
    language TEXT DEFAULT 'Hindi',
    cover_image TEXT,
    description TEXT,
    is_bestseller BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BOOK VARIANTS & INVENTORY MOVEMENTS
CREATE TABLE IF NOT EXISTS public.book_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    format TEXT NOT NULL,
    language TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    change_quantity INTEGER NOT NULL,
    movement_type TEXT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_charge NUMERIC(10, 2) DEFAULT 0 CHECK (shipping_charge >= 0),
    tax_amount NUMERIC(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL,
    payment_status payment_status_enum DEFAULT 'Pending',
    payment_transaction_id TEXT,
    razorpay_order_id TEXT,
    order_status order_status_enum DEFAULT 'Processing',
    courier_name TEXT,
    tracking_number TEXT,
    estimated_delivery_date TEXT,
    coupon_code_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDER ITEMS (Relational Table)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES public.books(id) ON DELETE SET NULL,
    book_title TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    format TEXT DEFAULT 'Hardcover',
    language TEXT DEFAULT 'Hindi',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status order_status_enum NOT NULL,
    notes TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PAYMENTS & WEBHOOK IDEMPOTENCY EVENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL,
    razorpay_order_id TEXT,
    gateway TEXT NOT NULL DEFAULT 'Razorpay',
    status TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. COUPONS & REVIEWS & WISHLISTS
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    cover_image TEXT,
    author_name TEXT,
    category TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    read_time_minutes INTEGER DEFAULT 5,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_wishlist UNIQUE (user_id, book_id)
);

-- 12. AFFILIATE SYSTEM (Immutable Ledger in PostgreSQL)
CREATE TABLE IF NOT EXISTS public.affiliate_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    status affiliate_status_enum DEFAULT 'pending',
    bank_details JSONB,
    upi_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_wallet_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    entry_type TEXT NOT NULL, -- 'COMMISSION', 'WITHDRAWAL', 'REVERSAL'
    reference_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    payment_method TEXT NOT NULL,
    transaction_reference TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS & SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    settings JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- SECURITY HELPER FUNCTION & ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Secure Helper Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- PROFILES: Select/update own record
CREATE POLICY "Users can select own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- USER ROLES: Read own role or admin read. NO PUBLIC INSERT/UPDATE/DELETE
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- BOOKS/CATEGORIES/AUTHORS: Anyone can read active catalog. Admin write only.
CREATE POLICY "Public read books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Admin write books" ON public.books FOR ALL USING (public.is_admin());

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "Public read authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Admin write authors" ON public.authors FOR ALL USING (public.is_admin());

CREATE POLICY "Public read blogs" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Admin write blogs" ON public.blogs FOR ALL USING (public.is_admin());

-- ORDERS: Users can read own orders. Admin manage all.
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "Admin write orders" ON public.orders FOR ALL USING (public.is_admin());
CREATE POLICY "Admin write order_items" ON public.order_items FOR ALL USING (public.is_admin());

-- REVIEWS & WISHLISTS
CREATE POLICY "Read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin moderate reviews" ON public.reviews FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete reviews" ON public.reviews FOR DELETE USING (public.is_admin());

CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- AUDIT LOGS
CREATE POLICY "Admin manage audit_logs" ON public.audit_logs FOR ALL USING (public.is_admin());
CREATE POLICY "Authenticated insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR public.is_admin());

-- AFFILIATE
CREATE POLICY "Affiliates view own account" ON public.affiliate_accounts FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Affiliates insert own account" ON public.affiliate_accounts FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Affiliates update own account" ON public.affiliate_accounts FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Affiliates view own ledger" ON public.affiliate_wallet_ledger FOR SELECT USING (auth.uid() = affiliate_user_id OR public.is_admin());
CREATE POLICY "Admin write affiliate_wallet_ledger" ON public.affiliate_wallet_ledger FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Affiliates view own withdrawals" ON public.affiliate_withdrawals FOR SELECT USING (auth.uid() = affiliate_user_id OR public.is_admin());
CREATE POLICY "Affiliates insert own withdrawals" ON public.affiliate_withdrawals FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);
CREATE POLICY "Admin update affiliate_withdrawals" ON public.affiliate_withdrawals FOR UPDATE USING (public.is_admin());

-- COUPONS: Public read active non-expired coupons; Admin write
CREATE POLICY "Public read active non-expired coupons" ON public.coupons FOR SELECT USING ((is_active = true AND (expires_at IS NULL OR expires_at > NOW())) OR public.is_admin());
CREATE POLICY "Admin write coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- SITE SETTINGS: Public read; Admin write
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin write site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- BOOK VARIANTS: Public read; Admin write
CREATE POLICY "Public read book_variants" ON public.book_variants FOR SELECT USING (true);
CREATE POLICY "Admin write book_variants" ON public.book_variants FOR ALL USING (public.is_admin());

-- INVENTORY MOVEMENTS: Admin only SELECT/INSERT
CREATE POLICY "Admin view inventory_movements" ON public.inventory_movements FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin insert inventory_movements" ON public.inventory_movements FOR INSERT WITH CHECK (public.is_admin());

-- ORDER STATUS HISTORY: User view for own orders; Admin/service_role insert
CREATE POLICY "Users view order status history for own orders" ON public.order_status_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = order_status_history.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
  )
);
CREATE POLICY "Admin write order status history" ON public.order_status_history FOR INSERT WITH CHECK (public.is_admin());

-- ATOMIC INVENTORY DECREMENT PROCEDURE
CREATE OR REPLACE FUNCTION public.decrement_inventory(p_book_id TEXT, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_book_id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock or invalid product ID: %', p_book_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_inventory(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_inventory(TEXT, INTEGER) TO service_role;

-- AUTOMATIC USER PROFILE & ROLE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STORAGE BUCKETS & RLS POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-images',
  'book-images',
  true,
  5242880, -- 5MB limit in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Book Images" ON storage.objects;
CREATE POLICY "Public Read Book Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-images');

DROP POLICY IF EXISTS "Admin Upload Book Images" ON storage.objects;
CREATE POLICY "Admin Upload Book Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-images' AND
  (public.is_admin() OR auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Admin Update Book Images" ON storage.objects;
CREATE POLICY "Admin Update Book Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-images' AND
  (public.is_admin() OR auth.role() = 'service_role')
);

DROP POLICY IF EXISTS "Admin Delete Book Images" ON storage.objects;
CREATE POLICY "Admin Delete Book Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-images' AND
  (public.is_admin() OR auth.role() = 'service_role')
);
