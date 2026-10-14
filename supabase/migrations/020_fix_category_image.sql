-- ====================================================================
-- MIGRATION 020: CORRECT MISMATCHED STOCK PHOTO IN categories (Bhagavad
-- Gita category's image_url, seeded by already-applied migration 013)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT (user: "sab jagah se remove karna hai" — remove
-- a specific Unsplash stock photo of a gold-embossed leather book, which
-- reads as a different religion's holy book to many viewers, from
-- everywhere it was hardcoded across the codebase):
--
-- Migration 013 (already applied to production) seeded the
-- "Bhagavad Gita" category's `image_url` with exactly this mismatched
-- photo. `categories.image_url` (mapped to `Category.image` in the
-- frontend) is not currently rendered anywhere in the live UI — spot-
-- checked both the public site and the Admin category list — so this
-- was not visibly wrong to a real visitor, but the underlying data was
-- still wrong and worth correcting outright rather than leaving it.
--
-- Unlike the ~35 in-code fallback usages fixed this same session (see
-- SESSION_HANDOFF.md — those now use a neutral local placeholder,
-- src/lib/placeholderImage.ts), this one is live seeded DATA that an
-- already-applied migration put there, so a code change alone can't
-- reach it — it needs this follow-up UPDATE.
-- ====================================================================

UPDATE public.categories
SET image_url = NULL
WHERE id = 'cat-1'
  AND image_url = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80';
