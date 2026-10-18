-- ====================================================================
-- MIGRATION 027: AUTHORS — SAVE TITLE, LOCATION AND WEBSITE
-- ====================================================================
-- The Control Panel "Add/Edit Author" form has Title, Location and Website
-- fields, but public.authors only had name/bio/photo columns, so those three
-- were never saved: after a reload every author showed the default title
-- "Vedic Scholar" and no location on the public /authors page.
--
-- This only ADDS three optional text columns. No policy, RLS, grant or
-- existing data is touched. Safe to re-run.
-- ====================================================================

ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS title    TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS website  TEXT;
