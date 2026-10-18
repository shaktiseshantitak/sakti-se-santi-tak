import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';
import { useSiteContent } from '../lib/useSiteContent';
import { sanitizeInput, isRateLimited, isHoneypotTriggered, validateEmail } from '../utils/security';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ContactPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const tx = useSiteContent();

  const { siteSettings } = useBooks();
  const c = useSiteContent();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>(''); // Bot Trap
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Anti-Bot Honeypot Check
    if (isHoneypotTriggered(honeypot)) {
      console.warn('[Security] Bot honeypot triggered on contact form.');
      setSubmitted(true); // Silently discard bot submission
      return;
    }

    // 2. Client-side Rate Limiting (max 3 submissions per minute)
    if (isRateLimited('contact-form', 3, 60000)) {
      setErrorMessage('Security Rate Limit: Too many submissions. Please wait 1 minute before trying again.');
      return;
    }

    // 3. Email format validation
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 4. Sanitize inputs
    const cleanName = sanitizeInput(name, 100);
    const cleanEmail = sanitizeInput(email, 150);
    const cleanSubject = sanitizeInput(subject, 200);
    const cleanMessage = sanitizeInput(message, 2000);

    // NOTE: this used to only console.log the payload and show a fake success
    // message — no database write, no email, nothing. Every message was
    // silently discarded and the sender was never actually contacted back.
    // There's still no outbound email here (no email provider is configured
    // anywhere in this project), but the message is now durably saved so an
    // admin can actually see and act on it (via migration 008's
    // contact_messages table).
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('contact_messages').insert({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      });

      if (error) {
        console.warn('Supabase contact_messages insert error:', error.message);
        setErrorMessage('Could not send your message right now. Please try again in a moment, or email us directly.');
        return;
      }
    }

    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: c('contact.breadcrumb') }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[color:var(--c-primary)]">
            {c('contact.title')}
          </h1>
          <p className="text-xs sm:text-sm text-[color:var(--c-text-muted)] mt-1 font-medium">
            {c('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8">
          {/* Info Left */}
          <div className="md:col-span-5 bg-[color:var(--c-primary)] text-amber-100 p-8 rounded-3xl space-y-6 shadow-sm border border-[color:var(--c-accent)]/40">
            <h3 className="font-serif font-bold text-xl text-amber-100">
              {c('contact.hqTitle')}
            </h3>

            <div className="space-y-4 text-xs text-amber-100/90 font-medium">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[color:var(--c-accent)] shrink-0" />
                <div>
                  <p className="font-bold text-white">{c('contact.officeLabel')}</p>
                  <p>{siteSettings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[color:var(--c-accent)] shrink-0" />
                <div>
                  <p className="font-bold text-white">{c('contact.phoneLabel')}</p>
                  <p>{siteSettings.supportPhone} {c('contact.phoneHours')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[color:var(--c-accent)] shrink-0" />
                <div>
                  <p className="font-bold text-white">{tx('t.ContactPage.a86ab0b8')}</p>
                  <p>{siteSettings.supportEmail}</p>
                  {siteSettings.ordersEmail && <p>{siteSettings.ordersEmail} <span className="opacity-70">(Orders)</span></p>}
                  {siteSettings.privacyEmail && <p>{siteSettings.privacyEmail} <span className="opacity-70">(Privacy)</span></p>}
                </div>
              </div>
            </div>
          </div>

          {/* Form Right */}
          <div className="md:col-span-7 bg-[color:var(--c-surface)] p-8 rounded-3xl border border-[color:var(--c-accent)]/40 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)] mb-4">
              {tx('t.ContactPage.4c5b0a93')}
            </h3>

            {errorMessage && (
              <div className="p-4 bg-rose-100 border border-rose-300 rounded-2xl text-xs text-rose-900 flex items-center gap-2 mb-4 font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitted && (
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 mb-4 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{tx('t.ContactPage.f19368ff')}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Anti-Bot Honeypot Field (Hidden from normal users) */}
              <div className="hidden" aria-hidden="true">
                <label>{tx('t.ContactPage.d6543e05')}</label>
                <input
                  type="text"
                  name="website_url_honeypot"
                  tabIndex={-1}
                  value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block font-bold text-[color:var(--c-primary)] mb-1">{tx('t.ContactPage.21975ea1')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={tx('t.ContactPage.b1ad07cb')}
                  className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-xl text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[color:var(--c-primary)] mb-1">{tx('t.ContactPage.49258b89')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={tx('t.ContactPage.6a326e34')}
                  className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-xl text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[color:var(--c-primary)] mb-1">{tx('t.ContactPage.36e8a953')}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={tx('t.ContactPage.53452c5b')}
                  className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-xl text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[color:var(--c-primary)] mb-1">{tx('t.ContactPage.f69f203f')}</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={tx('t.ContactPage.e1e43ecf')}
                  className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-xl text-[color:var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                />
              </div>

              <button
                type="submit"
                className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold px-6 py-3 rounded-xl shadow border border-amber-200 inline-flex items-center gap-2 transition-colors"
              >
                <span>{tx('t.ContactPage.ae0a4d50')}</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
