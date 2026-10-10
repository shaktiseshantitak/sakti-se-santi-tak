-- =====================================================================
-- 024_admin_mfa_and_audit_log_integrity.sql
--
-- Security audit items 1 and 11. Safe to run more than once.
--
-- READ THIS BEFORE RUNNING
--   * This migration is SAFE TO RUN FIRST: it creates MFA enforcement in
--     the OFF position (admin_mfa_config.enforced = false), so nothing
--     changes for the admin panel until you turn it on.
--   * Order of rollout:
--       1. Run this migration.
--       2. Deploy the new server.ts + frontend.
--       3. Log in to the admin panel once, complete the email OTP, and
--          confirm the panel works (a row appears in admin_mfa_sessions).
--       4. THEN turn enforcement on:
--            UPDATE public.admin_mfa_config SET enforced = true;
--          From that moment a password alone no longer grants admin
--          access, in the API routes AND in direct Supabase (RLS) writes.
--       5. Emergency switch-off if the admin is ever locked out (run in
--          the Supabase SQL editor):
--            UPDATE public.admin_mfa_config SET enforced = false;
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Server-verified MFA records. Written ONLY by the server
--    (service role) after it has checked the email OTP itself. Bound to
--    the user AND the Supabase session, so it can't be reused from
--    another login. No RLS policies on purpose: the browser can never
--    read or write this table.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_mfa_sessions (
  user_id     UUID        NOT NULL,
  session_id  UUID        NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, session_id)
);
ALTER TABLE public.admin_mfa_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_mfa_sessions FROM anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Enforcement switch (single row). Default OFF for a safe rollout.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_mfa_config (
  id       BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  enforced BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE public.admin_mfa_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_mfa_config FROM anon, authenticated;
INSERT INTO public.admin_mfa_config (id, enforced) VALUES (TRUE, FALSE) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. is_admin(): still "has the admin role in user_roles" — and, when
--    enforcement is on, ALSO "this exact session has a live server-
--    verified MFA record". Every existing RLS policy that calls
--    is_admin() picks this up automatically.
--    Reads only user_roles + the two tables above (never user_metadata).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enforced BOOLEAN;
  v_session  UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN FALSE;
  END IF;

  SELECT enforced INTO v_enforced FROM public.admin_mfa_config WHERE id;
  IF NOT COALESCE(v_enforced, FALSE) THEN
    RETURN TRUE;
  END IF;

  BEGIN
    v_session := NULLIF(auth.jwt() ->> 'session_id', '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
  IF v_session IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_mfa_sessions
    WHERE user_id = auth.uid() AND session_id = v_session AND expires_at > NOW()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------
-- 4. audit_logs: server-written, append-only.
--    Before: any admin session could INSERT rows with arbitrary actor /
--    IP / details from the browser, and DELETE the whole table.
--    Now: rows are inserted only by the server (service role, which
--    bypasses RLS) using the authenticated context; admins can READ.
--    A trigger blocks edits, and blocks deletes until a row is 365 days
--    old (documented retention: after that a service-role purge is the
--    only way to remove them). The nightly backup already exports this
--    table to Google Sheets as a protected off-database copy.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin manage audit_logs"          ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated insert audit_logs"  ON public.audit_logs;
DROP POLICY IF EXISTS "Admin insert audit_logs"          ON public.audit_logs;
DROP POLICY IF EXISTS "Admin read audit_logs"            ON public.audit_logs;
CREATE POLICY "Admin read audit_logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.audit_logs_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- The ONLY permitted change: the FK action ON DELETE SET NULL that
    -- clears user_id when an auth user is deleted. Anything else is an edit.
    IF NEW.user_id IS NULL AND OLD.user_id IS NOT NULL
       AND (to_jsonb(NEW) - 'user_id') = (to_jsonb(OLD) - 'user_id') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'audit_logs rows are immutable';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.created_at > NOW() - INTERVAL '365 days' THEN
      RAISE EXCEPTION 'audit_logs rows cannot be deleted before the 365-day retention period ends';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_guard ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_guard
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_logs_guard();
