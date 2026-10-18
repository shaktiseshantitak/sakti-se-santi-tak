-- ====================================================================
-- MIGRATION 018: MISSING gallery TABLE (BROKEN FEATURE FIX)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT (user report: "Printing Press & Temple Seva
-- Photo Gallery page is completely hardcoded, no edit/upload option"):
-- There has never been a `gallery` table in this schema — the exact
-- same category of bug migration 007 fixed for `blogs`. In production
-- (Supabase configured), src/context/BookContext.tsx's `gallery` state
-- was NEVER included in the app's Supabase data load, so every visitor,
-- every page load, only ever saw the hardcoded INITIAL_GALLERY seed
-- array from src/data/initialData.ts. Worse, addGalleryItem/
-- deleteGalleryItem never attempted a Supabase write at all (unlike
-- books/categories/authors/blogs) — even if an admin UI had called
-- them, the change would only ever exist in that admin's own browser's
-- local React state and vanish on refresh. There was also no Admin UI
-- calling these functions at all, so this was a fully broken feature
-- end-to-end, not a partially-working one.
--
-- FIX: add the table (public-read, admin-write, matching the same
-- pattern as blogs/books/categories/authors), seed it with the exact
-- same 4 items that were previously hardcoded (so the live gallery page
-- looks identical immediately after this migration runs — nothing
-- visually changes until an admin actually edits it), and wire the
-- client functions + a real Admin UI to it in this same batch.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.gallery (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin write gallery" ON public.gallery;
CREATE POLICY "Admin write gallery" ON public.gallery FOR ALL USING (public.is_admin());

-- Seed with the exact same 4 items that were hardcoded in
-- src/data/initialData.ts's INITIAL_GALLERY, so nothing visually
-- changes on the live site the moment this migration runs.
INSERT INTO public.gallery (id, title, category, image_url, caption, created_at) VALUES
    ('gal-1', 'Sacred Printing Press in Varanasi', 'Publishing', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 'Gold foil stamping of Bhagavad Gita hardbound covers.', NOW() - INTERVAL '3 days'),
    ('gal-2', 'Annual Dharma Grantha Exhibition 2024', 'Events', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', 'Scholars and readers exploring rare Vedic manuscripts.', NOW() - INTERVAL '2 days'),
    ('gal-3', 'Devotional Book Donation Drive at Haridwar Ghats', 'Seva', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0YzRUJEOCIvPgogIDxyZWN0IHg9IjEiIHk9IjEiIHdpZHRoPSIzOTgiIGhlaWdodD0iMjk4IiBmaWxsPSJub25lIiBzdHJva2U9IiNENEFGMzciIHN0cm9rZS13aWR0aD0iMiIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxMjgpIiBmaWxsPSJub25lIiBzdHJva2U9IiM4QjFFM0YiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgIDxwYXRoIGQ9Ik0tMzgsLTMwIEwtMzgsMzIgUS0zOCw0MCAtMjgsNDAgTDAsNDAgTDAsLTM4IEwtMjgsLTM4IFEtMzgsLTM4IC0zOCwtMzAgWiIvPgogICAgPHBhdGggZD0iTTM4LC0zMCBMMzgsMzIgUTM4LDQwIDI4LDQwIEwwLDQwIEwwLC0zOCBMMjgsLTM4IFEzOCwtMzggMzgsLTMwIFoiLz4KICA8L2c+CiAgPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCBzZXJpZiIgZm9udC1zaXplPSIxNyIgZmlsbD0iIzhCMUUzRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC13ZWlnaHQ9ImJvbGQiPuCkm+CkteCkvyDgpIngpKrgpLLgpKzgpY3gpKcg4KSo4KS54KWA4KSCPC90ZXh0PgogIDx0ZXh0IHg9IjIwMCIgeT0iMjIyIiBmb250LWZhbWlseT0iR2VvcmdpYSwgc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2RTRFMzciIHRleHQtYW5jaG9yPSJtaWRkbGUiPnNoYWt0aXNlc2hhbnRpLmNvbTwvdGV4dD4KPC9zdmc+', 'Distributing pocket Bhagavad Gitas to young pilgrims.', NOW() - INTERVAL '1 day'),
    ('gal-4', 'Handcrafted Wood Altar Book Stand (Rehal)', 'Craftsmanship', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80', 'Teakwood carved Rehal stand included with luxury scripture editions.', NOW())
ON CONFLICT (id) DO NOTHING;
