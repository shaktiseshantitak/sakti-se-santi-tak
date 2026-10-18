import { useSiteContent } from '../../lib/useSiteContent';
import React, { useState } from 'react';
import { getSiteDomain } from '../../utils/siteDomain';
import { useReviewStats } from '../../lib/useReviewStats';
import { ShoppingCart, Sparkles, BookOpen, Star, ShieldCheck, HeartHandshake, CheckCircle2, ArrowRight, ZoomIn, X, Eye } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../context/BookContext';

interface ShaktiHeroBannerProps {
  shaktiBook?: Book;
  onBuyNow: (book?: Book) => void;
  onAuthorsClick: () => void;
}

export const ShaktiHeroBanner: React.FC<ShaktiHeroBannerProps> = ({
  shaktiBook,
  onBuyNow,
  onAuthorsClick,
}) => {
  const tx = useSiteContent();

  const { siteSettings } = useBooks();
  const reviewStats = useReviewStats();
  // Admin's own text wins; otherwise ONLY real approved-review numbers are
  // shown. No reviews yet -> the badge is hidden (nothing invented).
  const ratingBadgeText =
    siteSettings?.heroBannerOverrideRatingText?.trim() ||
    (reviewStats && reviewStats.total > 0
      ? `${reviewStats.average.toFixed(1)}/5 ★ (${reviewStats.total} पाठक समीक्षाएं)`
      : '');
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  // This used to fall back to a specific unrelated Unsplash stock photo
  // (a generic gold-embossed leather book that reads as a different
  // religion's holy book to many viewers) whenever `shaktiBook` hadn't
  // loaded yet — which is EVERY page load, for the ~3-4 seconds before
  // the real book data arrives from Supabase — and again on any image
  // load error. A real visitor's first impression of the homepage was
  // that mismatched photo, every single time. Replaced with a neutral
  // loading/placeholder box (icon + text, no unrelated photo at all)
  // for both states — no image source is ever wrong, only ever "still
  // loading" or "no image available".
  const [mainImgFailed, setMainImgFailed] = useState(false);
  const [modalImgFailed, setModalImgFailed] = useState(false);

  React.useEffect(() => {
    if (shaktiBook?.coverImage) {
      setMainImgFailed(false);
      setModalImgFailed(false);
    }
  }, [shaktiBook?.coverImage]);

  const CoverPlaceholder: React.FC<{ label: string; className?: string }> = ({ label, className = '' }) => (
    <div className={`w-full aspect-[3/4] rounded-xl bg-gradient-to-br from-[color:var(--c-primary-deep)] to-[color:var(--c-primary-darkest)] flex flex-col items-center justify-center gap-3 ${className}`}>
      <BookOpen className="w-14 h-14 text-amber-400/50" />
      <span className="text-amber-200/70 text-xs font-serif px-4 text-center">{label}</span>
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-red-950 via-red-900 to-amber-950 text-amber-50 py-10 sm:py-16 lg:py-20 border-b border-amber-500/30">
      {/* Sacred Ambient Soft Light Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.3),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(120,0,22,0.4),transparent_50%)] pointer-events-none" />
      
      {/* Sacred Mantra Mandala Ring Background */}
      <div className="absolute -right-20 -top-20 opacity-10 pointer-events-none hidden lg:block">
        <div className="w-[500px] h-[500px] rounded-full border-[12px] border-amber-400 flex items-center justify-center animate-spin-slow">
          <span className="text-8xl font-serif text-amber-300">{tx('t.ShaktiHeroBanner.4b4b9d81')}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Domain & Brand Tag */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{siteSettings?.heroBannerBadgeText || `शक्ति से शांति तक • ${getSiteDomain(siteSettings)}`}</span>
          </div>

          {ratingBadgeText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/60 border border-red-500/40 text-amber-200 text-xs font-semibold">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>{ratingBadgeText}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Main Headline & Details Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

            {/* Main Premium Headline */}
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-amber-100 leading-tight tracking-tight">
              {siteSettings?.heroBannerOverrideTitle || shaktiBook?.title || 'क्या वर्षों से मंत्र जप करने के बाद भी मन को वास्तविक शांति नहीं मिली?'}
            </h1>

            {/* Subheadline matching Cover Tagline */}
            <div className="space-y-2">
              <p className="font-serif text-lg sm:text-2xl font-bold text-amber-300 tracking-wide">
                {siteSettings?.heroBannerOverrideTagline || shaktiBook?.originalTitle || 'शक्ति से शांति तक'}
              </p>
              <p className="font-serif text-base sm:text-xl font-medium text-amber-200/95 leading-relaxed">
                {siteSettings?.heroBannerOverrideSubtitle || shaktiBook?.subtitle || 'गायत्री मंत्र और दुर्गा मंत्र का अंतर्यात्रा रहस्य'}
              </p>
            </div>

            {/* Study & Tradition Context Note */}
            <div className="bg-red-950/70 p-4 sm:p-5 rounded-2xl border border-amber-500/30">
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed italic">
                "{shaktiBook?.description || 'यह पुस्तक गायत्री मंत्र और दुर्गा मंत्र से जुड़े आध्यात्मिक रहस्यों, चिंतन और साधना के दृष्टिकोण को सरल भाषा में प्रस्तुत करती है।'}"
              </p>
              <p className="text-[11px] text-amber-300/80 mt-2 font-semibold">
                {tx('t.ShaktiHeroBanner.1bc844ef')} {shaktiBook?.authorName || 'कुंजेश शर्मा एवं पूनम शर्मा'}
              </p>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => onBuyNow(shaktiBook)}
                className="bg-amber-500 hover:bg-amber-400 text-red-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-sm shadow-amber-500/40 flex items-center justify-center gap-3 transition-transform active:scale-95 group border border-amber-300"
              >
                <ShoppingCart className="w-5 h-5 text-red-950 group-hover:scale-110 transition-transform" />
                <span>{tx('t.ShaktiHeroBanner.2aa6c815')}{shaktiBook?.offerPrice || 499})</span>
                <ArrowRight className="w-5 h-5 ml-1 text-red-950 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onAuthorsClick}
                className="bg-red-950/90 hover:bg-red-900 text-amber-200 font-bold px-6 py-4 rounded-2xl text-sm border border-amber-500/40 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{tx('t.ShaktiHeroBanner.f2c15c41')}</span>
              </button>
            </div>

            {/* Key Value Guarantee Badges */}
            <div className="pt-4 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{tx('t.ShaktiHeroBanner.de07d88d')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{tx('t.ShaktiHeroBanner.e1a24623')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start col-span-2 sm:col-span-1">
                <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{tx('t.ShaktiHeroBanner.b5b9956e')}</span>
              </div>
            </div>

          </div>

          {/* Book Image Showcase Column (Matching exact position & size from user guidelines) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative group w-full max-w-[310px] sm:max-w-[340px] md:max-w-[360px] lg:max-w-[370px] transition-all">
              
              <div className="relative bg-[color:var(--c-primary-deep)] p-3 sm:p-4 rounded-3xl border-2 border-amber-400/80 shadow-sm text-center space-y-3">
                
                {/* Discount Tag */}
                <div className="absolute -top-3.5 right-4 bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black text-xs px-3.5 py-1 rounded-full shadow-xs border border-amber-200 uppercase tracking-wider z-20">
                  {shaktiBook?.discountPercent || (shaktiBook?.mrp && shaktiBook?.offerPrice ? Math.round(((shaktiBook.mrp - shaktiBook.offerPrice) / shaktiBook.mrp) * 100) : 38)}{tx('t.ShaktiHeroBanner.8dd75009')}
                </div>

                {/* Actual Original Book Cover Display Box */}
                <div 
                  onClick={() => setIsFullscreenPreviewOpen(true)}
                  className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-[color:var(--c-primary-darkest)] border-2 border-[color:var(--c-accent)]/60 p-1 cursor-pointer group/img transition-all hover:border-amber-300 flex justify-center"
                  title={tx('t.ShaktiHeroBanner.afbba22b')}
                >
                  {shaktiBook?.coverImage && !mainImgFailed ? (
                    <img
                      src={shaktiBook.coverImage}
                      alt={`${shaktiBook?.title || 'पुस्तक'} - मूल आवरण`}
                      className="w-full h-auto max-h-[460px] sm:max-h-[500px] object-contain rounded-xl transition-transform duration-300 group-hover/img:scale-[1.015]"
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      onError={() => setMainImgFailed(true)}
                    />
                  ) : (
                    <CoverPlaceholder
                      label={shaktiBook ? 'आवरण जल्द उपलब्ध होगा' : 'लोड हो रहा है...'}
                      className="max-h-[460px] sm:max-h-[500px]"
                    />
                  )}

                  {/* Hover Overlay with Zoom Icon */}
                  <div className="absolute inset-0 bg-red-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 rounded-xl flex flex-col items-center justify-center text-amber-200 space-y-2 p-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-red-950 flex items-center justify-center shadow-xs">
                      <Eye className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-serif bg-red-950/90 text-amber-300 px-3 py-1 rounded-full border border-amber-400/50 shadow-xs">
                      {tx('t.ShaktiHeroBanner.e22e12ea')}
                    </span>
                  </div>
                </div>

                {/* Price & Order Action Bar */}
                <div className="w-full pt-1 space-y-2.5">
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">₹{shaktiBook?.offerPrice || 499}</span>
                    {shaktiBook?.mrp && shaktiBook.mrp > (shaktiBook.offerPrice || 0) && (
                      <span className="text-sm text-amber-200/60 line-through">₹{shaktiBook.mrp}</span>
                    )}
                    {shaktiBook?.mrp && shaktiBook?.offerPrice && shaktiBook.mrp > shaktiBook.offerPrice && (
                      <span className="bg-red-900 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        ₹{shaktiBook.mrp - shaktiBook.offerPrice} {tx('t.ShaktiHeroBanner.1922550c')}
                      </span>
                    )}
                  </div>

                  {/* Buy Now Direct Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuyNow(shaktiBook);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-red-950 font-extrabold text-sm sm:text-base py-3 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 border border-amber-300"
                  >
                    <ShoppingCart className="w-4.5 h-4.5" />
                    <span>{tx('t.ShaktiHeroBanner.af7b60b5')}{shaktiBook?.offerPrice || 499})</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen Book Cover Preview Modal */}
      {isFullscreenPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--c-primary-darkest)]/90 p-4 animate-in fade-in duration-300"
          onClick={() => setIsFullscreenPreviewOpen(false)}
        >
          <div 
            className="relative max-w-2xl max-h-[92vh] w-full bg-[color:var(--c-primary-deep)] p-4 sm:p-6 rounded-3xl border-2 border-[color:var(--c-accent)] shadow-sm flex flex-col items-center justify-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between border-b border-[color:var(--c-accent)]/30 pb-3">
              <div className="flex items-center gap-2 text-amber-300">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="font-serif font-bold text-sm sm:text-base">
                  {tx('t.ShaktiHeroBanner.b7efdc2b')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreenPreviewOpen(false)}
                className="w-9 h-9 rounded-full bg-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-darkest)] text-amber-300 border border-[color:var(--c-accent)]/50 flex items-center justify-center transition-transform hover:scale-110"
                title={tx('t.ShaktiHeroBanner.44deb2e4')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High Res Full Cover Image */}
            <div className="overflow-auto max-h-[72vh] flex justify-center w-full p-2 bg-[color:var(--c-primary-darkest)] rounded-2xl border border-[color:var(--c-accent)]/40">
              {shaktiBook?.coverImage && !modalImgFailed ? (
                <img
                  src={shaktiBook.coverImage}
                  alt="शक्ति से शांति तक - मूल पुस्तक आवरण"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-sm border border-amber-400/40"
                  loading="lazy"
                  decoding="async"
                  onError={() => setModalImgFailed(true)}
                />
              ) : (
                <CoverPlaceholder label="आवरण जल्द उपलब्ध होगा" className="max-w-sm" />
              )}
            </div>

            {/* Modal Footer CTA */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-amber-200/80 font-serif">
                {shaktiBook?.authorName ? `लेखक: ${shaktiBook.authorName} | ` : ''}{getSiteDomain(siteSettings)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenPreviewOpen(false);
                  onBuyNow(shaktiBook);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-red-950 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{shaktiBook?.offerPrice ? `अभी ऑर्डर करें (Buy Now @ ₹${shaktiBook.offerPrice})` : 'अभी ऑर्डर करें (Buy Now)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};


