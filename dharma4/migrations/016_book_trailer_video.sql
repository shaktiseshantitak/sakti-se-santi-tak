-- ====================================================================
-- MIGRATION 016: BOOK TRAILER VIDEO (YouTube link OR direct upload)
-- ====================================================================
-- FEATURE (2026-08-29 — clarified: "Add Book" needed a video upload
-- option, YouTube link OR direct file upload — not an ad-booking system).
-- ====================================================================

ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS trailer_video_url TEXT,
  ADD COLUMN IF NOT EXISTS trailer_video_is_youtube BOOLEAN DEFAULT FALSE;

-- FEATURE (2026-08-31 — "book ki multiple photo lagayi par sirf 1 hi
-- dikh rahi hai"): admin's book form already captured multiple gallery
-- image URLs (formAdditionalImages), but there was no column to save
-- them to at all — the whole feature was silently a no-op end-to-end.
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]'::jsonb;

-- FEATURE (2026-08-29 — admin customer management: account status).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';



