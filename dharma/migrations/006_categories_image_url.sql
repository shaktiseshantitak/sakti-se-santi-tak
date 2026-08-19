-- ====================================================================
-- MIGRATION 006: MISSING categories.image_url COLUMN (FUNCTIONAL BUG FIX)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT:
-- src/context/BookContext.tsx's addCategory() has always sent an `image_url`
-- field on every INSERT into public.categories, but that column never existed
-- in the schema. PostgREST rejects inserts referencing unknown columns, so
-- EVERY category created through the admin panel has been silently failing to
-- save to the database (the error was caught and only logged with
-- console.warn — the admin UI showed success because it updates local React
-- state regardless of whether the remote insert succeeded).
--
-- FIX: add the column the app was already designed to use, rather than
-- silently dropping category images from the insert (which would be a loss
-- of intended functionality, not a fix).
-- ====================================================================

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
