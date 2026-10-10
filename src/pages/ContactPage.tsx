import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';
import { sanitizeInput, isRateLimited, isHoneypotTriggered, validateEmail } from '../utils/security';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ContactPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { siteSettings } = useBooks();

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
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Contact Us & Press Desk' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
            Get in Touch with Our Publishing Desk
          </h1>
          <p className="text-xs sm:text-sm text-[#6E4E37] mt-1 font-medium">
            Questions about order tracking, bulk temple distribution, or manuscript submissions?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8">
          {/* Info Left */}
          <div className="md:col-span-5 bg-[#8B1E3F] text-amber-100 p-8 rounded-3xl space-y-6 shadow-sm border border-[#D4AF37]/40">
            <h3 className="font-serif font-bold text-xl text-amber-100">
              Varanasi Headquarters
            </h3>

            <div className="space-y-4 text-xs text-amber-100/90 font-medium">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="font-bold text-white">Main Office & Press:</p>
                  <p>{siteSettings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="font-bold text-white">Helpline Phone:</p>
                  <p>{siteSettings.supportPhone} (Mon-Sat 9 AM - 7 PM IST)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="font-bold text-white">Email Address:</p>
                  <p>{siteSettings.supportEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Right */}
          <div className="md:col-span-7 bg-[#FFF8EE] p-8 rounded-3xl border border-[#D4AF37]/40 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F] mb-4">
              Send Us a Message
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
                <span>Message received! Our customer desk will reply within 24 hours.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Anti-Bot Honeypot Field (Hidden from normal users) */}
              <div className="hidden" aria-hidden="true">
                <label>Do not fill this field if you are human</label>
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
                <label className="block font-bold text-[#8B1E3F] mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#8B1E3F] mb-1">Your Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#8B1E3F] mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Bulk Order Inquiry for Temple"
                  className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#8B1E3F] mb-1">Message Detail *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your query here..."
                  className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold px-6 py-3 rounded-xl shadow border border-amber-200 inline-flex items-center gap-2 transition-colors"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
