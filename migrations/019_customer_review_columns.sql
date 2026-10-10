-- ====================================================================
-- MIGRATION 019: MISSING COLUMNS ON reviews (CUSTOMER TESTIMONIALS BUG)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT (user report: "Reviews bhi hardcode hai, real
-- nahi. Control panel mein diya hai par woh bhi hardcode hai."):
--
-- The public "/reviews" page (ReviewsPage.tsx — "सत्यापित पाठकों एवं
-- साधकों की समीक्षाएं") uses a richer CustomerReview shape than the
-- simple per-book Review system (customer_name, business_name, city,
-- rating, review_text, photo_url, video_url, thumbnail_url,
-- is_verified) — but `public.reviews` only ever had columns for the
-- simpler per-book review system (book_id, user_id, user_name, rating,
-- comment, is_approved). This caused two separate real bugs, not one:
--
-- 1. DATA LOSS on every real submission: the "Write a Review" form on
--    /reviews collects business name, city, and an optional
--    photo/video, and src/lib/reviewsApi.ts's submitCustomerReviewApi
--    DOES receive all of it — but its Supabase insert only ever wrote
--    user_name/rating/comment. Every customer's business name, city,
--    and uploaded photo/video was silently discarded the moment they
--    submitted a review, with no error or warning to them.
--
-- 2. FABRICATED TESTIMONIALS shown as real: fetchCustomerReviewsApi
--    falls back to a hardcoded INITIAL_CUSTOMER_REVIEWS array (5
--    detailed fake reviews with specific invented names, professions,
--    cities, and stock photos) whenever the real `reviews` table
--    returns zero rows — which is exactly what happens on a real store
--    with no reviews yet. Real visitors were shown these as if they
--    were genuine customer testimonials, indistinguishable from real
--    ones in the UI, and admin's moderation controls on them
--    (verify/delete) were no-ops against the real database since those
--    fake rows never existed in `reviews` at all — only in that
--    admin's own browser's localStorage.
--
-- THIS MIGRATION fixes bug #1's root cause (missing columns). Bug #2's
-- fix is in the application code (src/lib/reviewsApi.ts,
-- see SESSION_HANDOFF.md), not the schema: the fake-fallback branch
-- for a real, properly-configured Supabase connection is removed
-- outright so a store with zero real reviews now honestly shows zero,
-- with an inviting "be the first to share your experience" empty
-- state, instead of invented testimonials.
-- ====================================================================

ALTER TABLE public.reviews
    ADD COLUMN IF NOT EXISTS business_name TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
