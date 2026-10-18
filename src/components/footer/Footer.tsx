import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Shield, Heart, Award, ArrowUpRight, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { useBooks } from '../../context/BookContext';
import { subscribeNewsletterApi } from '../../lib/newsletterApi';
import { isRateLimited, isHoneypotTriggered } from '../../utils/security';
import { siteText } from '../../utils/siteText';
import { useSiteContent } from '../../lib/useSiteContent';
import { getSiteDomain, getBrandName } from '../../utils/siteDomain';

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const tx = useSiteContent();

  const { siteSettings, categories } = useBooks();
  const st = siteSettings?.siteTexts || {};
  const c = useSiteContent();
  const siteDomain = getSiteDomain(siteSettings);
  const brandName = getBrandName(siteSettings);
  const valueProps = [
    { icon: <Shield className="w-6 h-6" />, title: siteText(st.vp1Title, '100% Authentic Texts'), text: siteText(st.vp1Text, 'Verified by Varanasi Sanskrit Scholars') },
    { icon: <Award className="w-6 h-6" />, title: siteText(st.vp2Title, 'Gold Foil Edition'), text: siteText(st.vp2Text, 'Archival acid-free paper built to last') },
    { icon: <Heart className="w-6 h-6" />, title: siteText(st.vp3Title, 'Reverently Packed'), text: siteText(st.vp3Text, 'Moisture-proof sealed transit protection') },
    { icon: <Send className="w-6 h-6" />, title: siteText(st.vp4Title, 'Worldwide Shipping'), text: siteText(st.vp4Text, 'India Post, Delhivery, DTDC & DHL') },
  ].filter(vp => vp.title || vp.text);
  const footerHours = siteText(st.footerHours, '(Mon-Sat 9 AM - 7 PM IST)');
  const footerBrandSuffix = siteText(st.footerBrandSuffix, `(${siteDomain})`);
  const [email, setEmail] = useState<string>('');
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [nlHoney, setNlHoney] = useState<string>(''); // bot trap: real people never see/fill it
  const [nlBusy, setNlBusy] = useState<boolean>(false);
  const [nlError, setNlError] = useState<string>('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setNlError('');
    if (nlBusy || !email.trim()) return;
    if (isHoneypotTriggered(nlHoney)) { setSubscribed(true); setEmail(''); return; } // silently drop bots
    if (isRateLimited('newsletter', 3, 60000)) { setNlError('कृपया 1 मिनट बाद दोबारा प्रयास करें।'); return; }
    setNlBusy(true);
    const result = await subscribeNewsletterApi(email);
    setNlBusy(false);
    if (result === 'ok') {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    } else if (result === 'invalid') {
      setNlError('कृपया सही email लिखें।');
    } else if (result === 'busy') {
      setNlError('अभी बहुत अनुरोध हैं, थोड़ी देर बाद प्रयास करें।');
    } else {
      setNlError('अभी सदस्यता उपलब्ध नहीं है, कृपया बाद में प्रयास करें।');
    }
  };

  return (
    <footer className="bg-[color:var(--c-footer-bg)] text-[color:var(--c-footer-text)] pt-16 pb-8 border-t border-[color:var(--c-accent)]/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Trust Badges */}
        <div className="bg-gradient-to-r from-[color:var(--c-primary-deep)] via-[color:var(--c-primary)] to-[color:var(--c-primary-darkest)] border border-[color:var(--c-accent)]/50 rounded-3xl p-6 sm:p-10 mb-16 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="text-[color:var(--c-accent-light)] font-serif text-sm font-semibold uppercase tracking-wider block mb-1">
                {c('footer.nlKicker')}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                {c('footer.nlTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/90 mt-2 max-w-xl">
                {c('footer.nlText')}
              </p>
            </div>

            <div className="lg:col-span-5">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={c('footer.nlPlaceholder')}
                    maxLength={254}
                    required
                    className="w-full px-4 py-3 bg-[color:var(--c-primary-darkest)] border border-[color:var(--c-accent)]/60 rounded-xl text-sm text-white placeholder-amber-200/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-accent)]"
                  />
                  <Mail className="w-4 h-4 text-[color:var(--c-accent-light)] absolute right-3.5 top-3.5" />
                </div>
                <input
                  type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true"
                  value={nlHoney} onChange={e => setNlHoney(e.target.value)}
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                />
                <button
                  type="submit"
                  disabled={nlBusy}
                  className="bg-[color:var(--c-accent)] hover:bg-amber-300 text-[color:var(--c-ink)] font-extrabold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {subscribed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[color:var(--c-ink)]" />
                      <span>{c('footer.nlSuccess')}</span>
                    </>
                  ) : (
                    <>
                      <span>{c('footer.nlButton')}</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              {nlError && <p role="alert" className="text-[11px] text-rose-200 mt-2">{nlError}</p>}
              {c('footer.nlConsent') && <p className="text-[10px] text-amber-200/70 mt-2">{c('footer.nlConsent')}</p>}
            </div>
          </div>
        </div>

        {/* 4 Feature Value Props (text editable in Control Panel -> Settings) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-[color:var(--c-accent)]/30">
          {valueProps.map((vp, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="p-3 bg-[color:var(--c-primary-deep)] text-[color:var(--c-accent-light)] rounded-2xl border border-[color:var(--c-accent)]/30">
                {vp.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">{vp.title}</h4>
                <p className="text-xs text-amber-200/80 mt-0.5">{vp.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[color:var(--c-accent)] text-[color:var(--c-primary-deep)] flex items-center justify-center font-serif font-extrabold text-lg border border-amber-200">
                {tx('t.Footer.38d3d1b8')}
              </div>
              <span className="font-serif font-bold text-xl text-white">
                {brandName}{footerBrandSuffix ? ` ${footerBrandSuffix}` : ''}
              </span>
            </div>

            <p className="text-xs text-amber-100/85 leading-relaxed max-w-sm">
              {siteSettings.footerAboutText || `${siteDomain} — गायत्री महामंत्र और दुर्गा मंत्र की ब्रह्म साधना से परे अंतर्मन के गुप्त रहस्यों एवं 24 देवशक्तियों को उजागर करने वाला प्रामाणिक संस्थान। लेखकद्वय: कुंजेश शर्मा एवं पूनम शर्मा (Kunjesh Sharma & Poonam Sharma)।`}
            </p>

            <div className="space-y-2 text-xs text-amber-200/80 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[color:var(--c-accent-light)] shrink-0" />
                <span>{siteSettings.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[color:var(--c-accent-light)] shrink-0" />
                <span>{siteSettings.supportPhone}{footerHours ? ` ${footerHours}` : ''}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[color:var(--c-accent-light)] shrink-0" />
                <span>{siteSettings.supportEmail}</span>
              </p>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
              {c('footer.colCategories')}
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              {categories.slice(0, 10).map(cat => (
                <li key={cat.id}>
                  <button onClick={() => onNavigate('books', { categorySlug: cat.slug })} className="hover:text-[color:var(--c-accent-light)] transition-colors text-left">
                    {cat.name}
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <li>
                  <button onClick={() => onNavigate('books')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.colCategories')}
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
              {c('footer.colCustomer')}
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              {c('footer.linkAffiliate') && (
                <li>
                  <button onClick={() => onNavigate('affiliate')} className="hover:text-[color:var(--c-accent-light)] transition-colors font-bold text-[color:var(--c-accent-light)] flex items-center gap-1.5">
                    <span>🤝</span> {c('footer.linkAffiliate')}
                  </button>
                </li>
              )}
              {c('footer.linkDashboard') && (
                <li>
                  <button onClick={() => onNavigate('dashboard')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkDashboard')}
                  </button>
                </li>
              )}
              {c('footer.linkTrack') && (
                <li>
                  <button onClick={() => onNavigate('track-order')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkTrack')}
                  </button>
                </li>
              )}
              {c('footer.linkAuthors') && (
                <li>
                  <button onClick={() => onNavigate('authors')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkAuthors')}
                  </button>
                </li>
              )}
              {c('footer.linkBlog') && (
                <li>
                  <button onClick={() => onNavigate('blog')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkBlog')}
                  </button>
                </li>
              )}
              {c('footer.linkGallery') && (
                <li>
                  <button onClick={() => onNavigate('gallery')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkGallery')}
                  </button>
                </li>
              )}
              {c('footer.linkFaq') && (
                <li>
                  <button onClick={() => onNavigate('faq')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkFaq')}
                  </button>
                </li>
              )}
              {/* The public "Admin Portal Login" footer link was removed —
                  it advertised the admin panel's existence to every visitor.
                  Admin login is now reachable only via its own unlisted URL. */}
            </ul>
          </div>

          {/* Col 4: Policies & SEO */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
              {c('footer.colPolicies')}
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              {c('footer.linkPrivacy') && (
                <li>
                  <button onClick={() => onNavigate('privacy-policy')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkPrivacy')}
                  </button>
                </li>
              )}
              {c('footer.linkTerms') && (
                <li>
                  <button onClick={() => onNavigate('terms')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkTerms')}
                  </button>
                </li>
              )}
              {c('footer.linkShipping') && (
                <li>
                  <button onClick={() => onNavigate('shipping-policy')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkShipping')}
                  </button>
                </li>
              )}
              {c('footer.linkReturn') && (
                <li>
                  <button onClick={() => onNavigate('return-policy')} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                    {c('footer.linkReturn')}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* admin-
            created custom footer columns, rendered as an additional row
            below the 4 built-in columns above (kept as-is — they're tied
            to real navigation/category logic that shouldn't be touched).
            Only appears at all if the admin has actually added a column. */}
        {siteSettings.footerColumns && siteSettings.footerColumns.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pb-12 border-b border-[color:var(--c-accent)]/30 mt-6">
            {siteSettings.footerColumns.map(col => (
              <div key={col.id}>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-xs text-amber-100/80">
                  {col.links.map(link => (
                    <li key={link.id}>
                      {link.url ? (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--c-accent-light)] transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <button onClick={() => onNavigate(link.page)} className="hover:text-[color:var(--c-accent-light)] transition-colors">
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Payment & Logistics Badges */}
        <div className="pt-8 border-t border-[color:var(--c-accent)]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-amber-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-200/70 font-semibold">{tx('t.Footer.b339c7c3')}</span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-[color:var(--c-accent-light)] font-semibold">
              {tx('t.Footer.4264f192')}
            </span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-cyan-200 font-semibold">
              {tx('t.Footer.6c4a873f')}
            </span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-emerald-200 font-semibold">
              {tx('t.Footer.2aa8fcaa')}
            </span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-[color:var(--c-accent-light)] font-semibold">
              {tx('t.Footer.5bca7c6d')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-200/70 font-semibold">{tx('t.Footer.f309aafc')}</span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-orange-200 font-medium">
              {tx('t.Footer.4111f8b6')}
            </span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-red-200 font-medium">
              {tx('t.Footer.6b6eff4d')}
            </span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-blue-200 font-medium">
              {tx('t.Footer.5a0481fe')}
            </span>
            <span className="bg-[color:var(--c-primary-deep)] border border-[color:var(--c-accent)]/40 px-2 py-1 rounded text-indigo-200 font-medium">
              {tx('t.Footer.eeefcb52')}
            </span>
          </div>
        </div>

        {/* siteSettings.
            socialLinks was captured and saved by the admin form but no
            component anywhere on the site ever rendered them — the
            Footer had no social icons at all. Each icon only shows up if
            the admin actually filled in that platform's URL. */}
        {(siteSettings.socialLinks?.facebook || siteSettings.socialLinks?.instagram || siteSettings.socialLinks?.youtube || siteSettings.socialLinks?.twitter) && (
          <div className="flex justify-center gap-4 mt-6">
            {siteSettings.socialLinks?.facebook && (
              <a href={siteSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] text-amber-100 transition-colors" title={tx('t.Footer.89dbd45f')}>
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {siteSettings.socialLinks?.instagram && (
              <a href={siteSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] text-amber-100 transition-colors" title={tx('t.Footer.df1f6f39')}>
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {siteSettings.socialLinks?.youtube && (
              <a href={siteSettings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] text-amber-100 transition-colors" title={tx('t.Footer.6f19b480')}>
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {siteSettings.socialLinks?.twitter && (
              <a href={siteSettings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] text-amber-100 transition-colors" title={tx('t.Footer.0de51c0f')}>
                <Twitter className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t border-[color:var(--c-primary-deep)] text-center text-xs text-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{siteSettings.footerCopyrightText || `© ${new Date().getFullYear()} ${siteDomain} • ${brandName}। सर्वाधिकार सुरक्षित।`}</p>
          <p className="flex items-center gap-1 text-amber-100">
            {tx('t.Footer.4355f4e6')} <Heart className="w-3.5 h-3.5 text-[color:var(--c-accent-light)] fill-current" /> {tx('t.Footer.b81c7bbb')}
          </p>
        </div>
        <div className="mt-2 text-center text-[11px] text-amber-200/60">
          <p>{tx('t.Footer.0f6b376c')}</p>
        </div>
      </div>
    </footer>
  );
};
