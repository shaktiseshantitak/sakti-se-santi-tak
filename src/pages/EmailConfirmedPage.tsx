import { useSiteContent } from '../lib/useSiteContent';
import React, { useState, useEffect } from 'react';
import { MailCheck, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface EmailConfirmedPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// Where the email-confirmation link lands.
//
// FIXED: previously the Supabase email template used {{ .ConfirmationURL }},
// which points straight at https://<project-ref>.supabase.co/auth/v1/verify
// — a raw Supabase URL visible to the customer, and one that corporate/Gmail
// link-scanners can "pre-click" and burn before the real user ever opens the
// email. The template should now link to OUR OWN domain instead
// (`{{ .SiteURL }}/email-confirmed?token_hash={{ .TokenHash }}&type=signup`),
// and this page does the verification itself via verifyOtp() — the browser
// never has to visit a supabase.co address at all.
//
// The old getSession() fallback is kept below so this page still works
// for links sent before the email template is updated (Supabase's own
// /verify endpoint redirects back here with a session already in the URL
// hash in that case).
export const EmailConfirmedPage: React.FC<EmailConfirmedPageProps> = ({ onNavigate }) => {
  const tx = useSiteContent();

  const c = useSiteContent();
  const [status, setStatus] = useState<'checking' | 'confirmed' | 'failed'>('checking');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('failed');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');

    if (tokenHash && type) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: type as 'signup' | 'email' })
        .then(({ error }) => {
          setStatus(error ? 'failed' : 'confirmed');
        });
      return;
    }

    // Backward-compatible fallback for the old supabase.co-redirect link style.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? 'confirmed' : 'failed');
    });
  }, []);

  return (
    <div className="py-16 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-3xl p-8 shadow-sm text-center space-y-4">
        {status === 'checking' && (
          <p className="text-sm text-[color:var(--c-text-muted)]">{tx('t.EmailConfirmedPage.8084c908')}</p>
        )}

        {status === 'confirmed' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
              <MailCheck className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[color:var(--c-primary)]">
              {c('confirm.okTitle')}
            </h1>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              {c('confirm.okText')}
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-deep)] text-amber-100 font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              {c('confirm.openAccount')}
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
            <h1 className="font-serif text-xl font-bold text-[color:var(--c-primary)]">
              {c('confirm.badTitle')}
            </h1>
            <p className="text-sm text-[color:var(--c-text-muted)]">
              {c('confirm.badText')}
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="text-[color:var(--c-primary)] font-bold underline"
            >
              {c('confirm.toLogin')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
