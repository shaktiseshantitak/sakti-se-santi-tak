import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Shield, Heart, Award, ArrowUpRight, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { useBooks } from '../../context/BookContext';

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { siteSettings } = useBooks();
  const [email, setEmail] = useState<string>('');
  const [subscribed, setSubscribed] = useState<boolean>(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#8B1E3F] text-amber-100 pt-16 pb-8 border-t border-[#D4AF37]/40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Trust Badges */}
        <div className="bg-gradient-to-r from-[#66122C] via-[#8B1E3F] to-[#500D20] border border-[#D4AF37]/50 rounded-3xl p-6 sm:p-10 mb-16 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="text-[#F4E285] font-serif text-sm font-semibold uppercase tracking-wider block mb-1">
                ॐ Sacred Knowledge Updates
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                Subscribe to Daily Verse & Spiritual Releases
              </h3>
              <p className="text-xs sm:text-sm text-amber-100/90 mt-2 max-w-xl">
                Receive weekly commentary on Bhagavad Gita, notifications on rare manuscript printings, and exclusive 15% discount codes for new scripture releases.
              </p>
            </div>

            <div className="lg:col-span-5">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="w-full px-4 py-3 bg-[#500D20] border border-[#D4AF37]/60 rounded-xl text-sm text-white placeholder-amber-200/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <Mail className="w-4 h-4 text-[#F4E285] absolute right-3.5 top-3.5" />
                </div>
                <button
                  type="submit"
                  className="bg-[#D4AF37] hover:bg-amber-300 text-[#3A1F0D] font-extrabold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {subscribed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#3A1F0D]" />
                      <span>Subscribed!</span>
                    </>
                  ) : (
                    <>
                      <span>Join</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 4 Feature Value Props */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-[#D4AF37]/30">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#66122C] text-[#F4E285] rounded-2xl border border-[#D4AF37]/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">100% Authentic Texts</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">Verified by Varanasi Sanskrit Scholars</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#66122C] text-[#F4E285] rounded-2xl border border-[#D4AF37]/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Gold Foil Edition</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">Archival acid-free paper built to last</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#66122C] text-[#F4E285] rounded-2xl border border-[#D4AF37]/30">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Reverently Packed</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">Moisture-proof sealed transit protection</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#66122C] text-[#F4E285] rounded-2xl border border-[#D4AF37]/30">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Worldwide Shipping</h4>
              <p className="text-xs text-amber-200/80 mt-0.5">India Post, Delhivery, DTDC & DHL</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#66122C] flex items-center justify-center font-serif font-extrabold text-lg border border-amber-200">
                ॐ
              </div>
              <span className="font-serif font-bold text-xl text-white">
                {siteSettings.siteName || 'शक्ति से शांति'} (shaktiseshanti.com)
              </span>
            </div>

            <p className="text-xs text-amber-100/85 leading-relaxed max-w-sm">
              {siteSettings.footerAboutText || 'shaktiseshanti.com — गायत्री महामंत्र और दुर्गा मंत्र की ब्रह्म साधना से परे अंतर्मन के गुप्त रहस्यों एवं 24 देवशक्तियों को उजागर करने वाला प्रामाणिक संस्थान। लेखकद्वय: कुंजेश शर्मा एवं पूनम शर्मा (Kunjesh Sharma & Poonam Sharma)।'}
            </p>

            <div className="space-y-2 text-xs text-amber-200/80 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F4E285] shrink-0" />
                <span>{siteSettings.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F4E285] shrink-0" />
                <span>{siteSettings.supportPhone} (Mon-Sat 9 AM - 7 PM IST)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4E285] shrink-0" />
                <span>{siteSettings.supportEmail}</span>
              </p>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
              Sacred Scripture Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              <li>
                <button onClick={() => onNavigate('books', { categorySlug: 'bhagavad-gita' })} className="hover:text-[#F4E285] transition-colors">
                  Bhagavad Gita Editions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('books', { categorySlug: 'ramayana' })} className="hover:text-[#F4E285] transition-colors">
                  Valmiki Ramayana & Ramcharitmanas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('books', { categorySlug: 'upanishads' })} className="hover:text-[#F4E285] transition-colors">
                  108 Upanishads Anthology
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('books', { categorySlug: 'vedas' })} className="hover:text-[#F4E285] transition-colors">
                  Four Vedas Samhita
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('books', { categorySlug: 'stotra-chalisa' })} className="hover:text-[#F4E285] transition-colors">
                  Hanuman Chalisa & Stotram
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('books', { categorySlug: 'puranas' })} className="hover:text-[#F4E285] transition-colors">
                  Srimad Bhagavatam & Puranas
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
              Customer & Readers
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              <li>
                <button onClick={() => onNavigate('affiliate')} className="hover:text-[#F4E285] transition-colors font-bold text-[#F4E285] flex items-center gap-1.5">
                  <span>🤝</span> Affiliate Partner Program (अफ़िलिएट पार्टनर बनें - 3-Tier)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-[#F4E285] transition-colors">
                  Customer Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('track-order')} className="hover:text-[#F4E285] transition-colors">
                  Track Your Order Status
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('authors')} className="hover:text-[#F4E285] transition-colors">
                  Revered Authors & Translators
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-[#F4E285] transition-colors">
                  Spiritual Blog & News
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gallery')} className="hover:text-[#F4E285] transition-colors">
                  Photo & Printing Press Gallery
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-[#F4E285] transition-colors">
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              {/* The public "Admin Portal Login" footer link was removed —
                  it advertised the admin panel's existence to every visitor.
                  Admin login is now reachable only via its own unlisted URL. */}
            </ul>
          </div>

          {/* Col 4: Policies & SEO */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
              Store Policies & SEO
            </h4>
            <ul className="space-y-2.5 text-xs text-amber-100/80">
              <li>
                <button onClick={() => onNavigate('privacy-policy')} className="hover:text-[#F4E285] transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-[#F4E285] transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shipping-policy')} className="hover:text-[#F4E285] transition-colors">
                  Shipping & Dispatch Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('return-policy')} className="hover:text-[#F4E285] transition-colors">
                  Returns & Refunds Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* FIXED (2026-08-29 — "footerColumns kya hai, banao"): admin-
            created custom footer columns, rendered as an additional row
            below the 4 built-in columns above (kept as-is — they're tied
            to real navigation/category logic that shouldn't be touched).
            Only appears at all if the admin has actually added a column. */}
        {siteSettings.footerColumns && siteSettings.footerColumns.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pb-12 border-b border-[#D4AF37]/30 mt-6">
            {siteSettings.footerColumns.map(col => (
              <div key={col.id}>
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 font-serif">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-xs text-amber-100/80">
                  {col.links.map(link => (
                    <li key={link.id}>
                      {link.url ? (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#F4E285] transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <button onClick={() => onNavigate(link.page)} className="hover:text-[#F4E285] transition-colors">
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
        <div className="pt-8 border-t border-[#D4AF37]/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-amber-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-200/70 font-semibold">Accepted Payments:</span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-[#F4E285] font-semibold">
              BHIM / UPI
            </span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-cyan-200 font-semibold">
              Paytm / PhonePe
            </span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-emerald-200 font-semibold">
              Visa / Mastercard
            </span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-[#F4E285] font-semibold">
              Cash on Delivery (COD)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-200/70 font-semibold">Couriers:</span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-orange-200 font-medium">
              India Post
            </span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-red-200 font-medium">
              Delhivery
            </span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-blue-200 font-medium">
              Blue Dart
            </span>
            <span className="bg-[#66122C] border border-[#D4AF37]/40 px-2 py-1 rounded text-indigo-200 font-medium">
              DTDC
            </span>
          </div>
        </div>

        {/* FIXED (2026-08-29 — "Control Panel is dummy"): siteSettings.
            socialLinks was captured and saved by the admin form but no
            component anywhere on the site ever rendered them — the
            Footer had no social icons at all. Each icon only shows up if
            the admin actually filled in that platform's URL. */}
        {(siteSettings.socialLinks?.facebook || siteSettings.socialLinks?.instagram || siteSettings.socialLinks?.youtube || siteSettings.socialLinks?.twitter) && (
          <div className="flex justify-center gap-4 mt-6">
            {siteSettings.socialLinks?.facebook && (
              <a href={siteSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#66122C] hover:bg-[#500D20] text-amber-100 transition-colors" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {siteSettings.socialLinks?.instagram && (
              <a href={siteSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#66122C] hover:bg-[#500D20] text-amber-100 transition-colors" title="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {siteSettings.socialLinks?.youtube && (
              <a href={siteSettings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#66122C] hover:bg-[#500D20] text-amber-100 transition-colors" title="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {siteSettings.socialLinks?.twitter && (
              <a href={siteSettings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-[#66122C] hover:bg-[#500D20] text-amber-100 transition-colors" title="Twitter / X">
                <Twitter className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Bottom Copyright */}
        <div className="mt-8 pt-6 border-t border-[#66122C] text-center text-xs text-amber-200/70 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{siteSettings.footerCopyrightText || `© ${new Date().getFullYear()} shaktiseshanti.com • शक्ति से शांति तक। सर्वाधिकार सुरक्षित।`}</p>
          <p className="flex items-center gap-1 text-amber-100">
            Crafted with <Heart className="w-3.5 h-3.5 text-[#F4E285] fill-current" /> for Seekers of Sanatana Dharma worldwide.
          </p>
        </div>
        <div className="mt-2 text-center text-[11px] text-amber-200/60">
          <p>Developed &amp; Deployed by Mr. Sitaram Ghintala</p>
        </div>
      </div>
    </footer>
  );
};
