-- ====================================================================
-- MIGRATION 028: REAL NEWSLETTER SUBSCRIBERS (footer "Join" form)
-- ====================================================================
-- Until now the footer newsletter form only showed "Subscribed!" and never
-- stored the email anywhere. This adds the table and a safe way to fill it.
--
-- SECURITY DESIGN
--  * Visitors can NOT touch the table directly: all table privileges are
--    revoked from anon/authenticated and there is no INSERT policy.
--    They can only call subscribe_newsletter(), which validates the email,
--    stores it once (duplicates are silently ignored, so nobody can probe
--    "is this email subscribed?") and has a global flood brake.
--  * Only admins (public.is_admin()) can read or delete subscribers.
--  * Emails are stored lower-case, length-limited and format-checked by the
--    table itself, so even a bug in the app cannot store junk.
-- Safe to re-run.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL,
    source     TEXT NOT NULL DEFAULT 'footer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT newsletter_email_format
        CHECK (char_length(email) BETWEEN 5 AND 254
               AND email = lower(email)
               AND email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
    CONSTRAINT newsletter_source_len CHECK (char_length(source) <= 40)
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
    ON public.newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_idx
    ON public.newsletter_subscribers (created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.newsletter_subscribers FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.newsletter_subscribers TO authenticated;

DROP POLICY IF EXISTS "Admin read newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin read newsletter_subscribers"
    ON public.newsletter_subscribers FOR SELECT TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admin delete newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admin delete newsletter_subscribers"
    ON public.newsletter_subscribers FOR DELETE TO authenticated
    USING (public.is_admin());

-- The ONLY way a visitor can add an email.
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(p_email TEXT, p_source TEXT DEFAULT 'footer')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email  TEXT := lower(btrim(coalesce(p_email, '')));
  v_source TEXT := left(btrim(coalesce(p_source, 'footer')), 40);
BEGIN
  IF char_length(v_email) < 5 OR char_length(v_email) > 254
     OR v_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22023';
  END IF;

  -- Global flood brake: at most 60 NEW subscribers per minute site-wide.
  IF (SELECT count(*) FROM public.newsletter_subscribers
       WHERE created_at > NOW() - INTERVAL '1 minute') >= 60 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.newsletter_subscribers (email, source)
  VALUES (v_email, CASE WHEN v_source = '' THEN 'footer' ELSE v_source END)
  ON CONFLICT (email) DO NOTHING;   -- duplicate = same silent success
END;
$$;

REVOKE EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT, TEXT) TO anon, authenticated;
