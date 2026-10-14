-- ====================================================================
-- MIGRATION 017: MANUAL CUSTOMER CONTACTS
-- ====================================================================
-- FEATURE (2026-08-31 — "Customer Directory mein manually add/edit/remove
-- karne ka option chahiye"): the Customer Directory is built from real
-- orders (and profiles.account_status for registered accounts) by
-- design — that data must never be editable/deletable directly, since
-- doing so would corrupt real order/financial history. This table is a
-- SEPARATE, lightweight list for contacts an admin adds by hand (e.g. a
-- walk-in customer, a phone-order lead) who haven't placed an online
-- order yet. The admin panel merges this with the real order-derived
-- list, and only rows in THIS table are actually deletable.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.manual_customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.manual_customer_contacts ENABLE ROW LEVEL SECURITY;

-- Admin-only in every direction — this is back-office data, never
-- customer-facing.
CREATE POLICY "Admin manage manual_customer_contacts" ON public.manual_customer_contacts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
