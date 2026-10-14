-- ====================================================================
-- MIGRATION 011: PREVENT DUPLICATE REGISTRATION (same email / same phone)
-- ====================================================================
--
-- BUG REPORTED: "Registration ke time duplicate registration ho raha hai —
-- same mobile number aur email ID se multiple users ban rahe hain."
--
-- Two separate real gaps were found:
--
-- 1. EMAIL: Supabase Auth already enforces a unique auth.users.email at the
--    database level, so two *real* auth accounts can never share an email.
--    But `AuthContext.register()` on the client never checked Supabase's
--    "this email already exists" signal — when signUp() is called with an
--    email that's already registered, Supabase (by design, to avoid leaking
--    which emails exist) returns `{ data: { user, session: null }, error:
--    null }` with `user.identities` as an EMPTY array, instead of a normal
--    error. The old client code treated `data.user && !data.session` as
--    "just needs email confirmation" in both cases, so re-registering an
--    existing email showed "Account created! Check your email" — which
--    looks and feels exactly like a duplicate signup succeeded, even
--    though no second database row was actually created. Fixed in
--    AuthContext.tsx by checking `identities.length === 0`.
--
-- 2. PHONE: profiles.phone had NO uniqueness constraint at all. Since two
--    different email addresses are two different, entirely legitimate
--    auth.users rows, nothing stopped the same real mobile number from
--    being attached to any number of separate accounts. This migration
--    adds a partial unique index (ignoring blank/NULL phones, since not
--    every profile is required to have one) plus a SECURITY DEFINER RPC
--    so the signup form can check "is this phone already taken?" *before*
--    calling supabase.auth.signUp(), without needing broad read access to
--    other users' profiles (RLS still only lets someone read their own row).
-- ====================================================================

-- Normalize existing phone values a little before adding the constraint,
-- so pre-existing whitespace-only variants of "no phone" don't collide.
UPDATE public.profiles SET phone = NULL WHERE phone IS NOT NULL AND btrim(phone) = '';

-- One real phone number = one account. Partial index so multiple profiles
-- with no phone at all don't conflict with each other.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- ---------------------------------------------------------------------
-- is_phone_registered: lets the signup form ask "is this phone already in
-- use?" without exposing whose it is or any other profile data. Callable
-- by anyone, including logged-out visitors filling in the signup form.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_phone_registered(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_phone IS NULL OR btrim(p_phone) = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE phone = btrim(p_phone)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_phone_registered(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_phone_registered(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- is_email_registered: same idea for email, so the signup form can show a
-- clear "this email is already registered, please log in" message up
-- front, instead of relying only on parsing Supabase Auth's identities
-- array after the fact (kept as defense-in-depth in AuthContext.tsx too).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(email) = lower(btrim(p_email))
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_email_registered(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_registered(TEXT) TO anon, authenticated;
