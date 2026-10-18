-- ====================================================================
-- MIGRATION 026: STORE THE BOOK DETAILS THE CONTROL PANEL ALREADY ASKS FOR
-- ====================================================================
-- The book form collects ISBN, publisher, pages, edition, weight, subtitle, the
-- long description, sample PDF / audio links and per-book SEO — but the books
-- table had nowhere to keep them, so they vanished on the next page load and the
-- site showed placeholder values (ISBN 978-81-900000-0-0, 350 pages, ...).
--
-- Purely additive: new nullable columns, no data touched, existing RLS policies
-- ("Public read books" / "Admin write books") already cover them. Variants are
-- deliberately NOT added here — checkout prices come from books.offer_price, so
-- variants need server-side pricing support before they can be stored.
-- Safe to re-run.
-- ====================================================================

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS subtitle          TEXT,
  ADD COLUMN IF NOT EXISTS isbn              TEXT,
  ADD COLUMN IF NOT EXISTS publisher         TEXT,
  ADD COLUMN IF NOT EXISTS publication_year  INTEGER CHECK (publication_year IS NULL OR publication_year BETWEEN 1000 AND 2200),
  ADD COLUMN IF NOT EXISTS edition           TEXT,
  ADD COLUMN IF NOT EXISTS pages             INTEGER CHECK (pages IS NULL OR pages >= 0),
  ADD COLUMN IF NOT EXISTS weight_grams      INTEGER CHECK (weight_grams IS NULL OR weight_grams >= 0),
  ADD COLUMN IF NOT EXISTS long_description  TEXT,
  ADD COLUMN IF NOT EXISTS sample_pdf_url    TEXT,
  ADD COLUMN IF NOT EXISTS sample_audio_url  TEXT,
  ADD COLUMN IF NOT EXISTS seo               JSONB;

-- PostgREST caches the table shape; ask it to reload so the new columns work at once.
NOTIFY pgrst, 'reload schema';
