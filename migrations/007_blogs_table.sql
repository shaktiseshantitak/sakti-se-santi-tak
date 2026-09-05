-- ====================================================================
-- MIGRATION 007: MISSING blogs TABLE (BROKEN FEATURE FIX)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT:
-- There has never been a `blogs`/`blog_posts` table in this schema.
-- src/context/BookContext.tsx's addBlogPost/updateBlogPost/deleteBlogPost
-- never even attempted a Supabase sync (unlike every other content type in
-- this app) — meaning every blog post an admin "publishes" only ever exists
-- in that admin's own browser's local React state. No real site visitor, on
-- any other device or browser session, has ever been able to see a blog post
-- created through the admin panel. This is a fully broken feature, not a
-- partially-working one.
--
-- FIX: add the table (public-read, admin-write, matching the same pattern as
-- books/categories/authors) and wire the client functions to it.
-- ====================================================================

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

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read blogs" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Admin write blogs" ON public.blogs FOR ALL USING (public.is_admin());
