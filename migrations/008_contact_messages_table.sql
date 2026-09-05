-- ====================================================================
-- MIGRATION 008: MISSING contact_messages TABLE (BROKEN FEATURE FIX)
-- ====================================================================
--
-- BUG FOUND DURING AUDIT:
-- src/pages/ContactPage.tsx's handleSubmit sanitizes and validates the
-- contact form input, then does nothing with it except
-- `console.log('[Security Audit] Clean Contact Payload:', ...)` before
-- showing the user a success message. There was no database table, no API
-- call, and no email integration anywhere in this project to actually
-- deliver a contact/press inquiry. Every message submitted through this
-- form has been silently discarded — the site owner never received any of
-- them, while every sender was shown a fake "message sent" confirmation.
--
-- FIX: add a table to actually store submissions (public can insert their
-- own message; only admins can read/manage the inbox). This does not add
-- outbound email delivery (no SMTP/email-provider credentials or library
-- exist in this project, and wiring one up blind, untested, is out of
-- scope for a fix like this) — but a message that's durably saved and
-- queryable by an admin is a categorically different, working state
-- compared to one that vanishes into a browser console log.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit a message, but can never
-- read back the inbox — only admins can.
CREATE POLICY "Public insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage contact_messages" ON public.contact_messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin update contact_messages" ON public.contact_messages FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete contact_messages" ON public.contact_messages FOR DELETE USING (public.is_admin());
