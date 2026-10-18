import React from 'react';
import { ShoppingCart, MessageCircle, Sparkles, ShieldCheck, Truck, Star, ArrowRight } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../context/BookContext';
import { getSiteDomain } from '../../utils/siteDomain';
import { useSiteContent } from '../../lib/useSiteContent';
import { useReviewStats } from '../../lib/useReviewStats';

interface BuyCtaSectionProps {
  shaktiBook?: Book;
  onBuyNow: (book?: Book) => void;
}

export const BuyCtaSection: React.FC<BuyCtaSectionProps> = ({
  shaktiBook,
  onBuyNow,
}) => {
  const tx = useSiteContent();

  const { siteSettings } = useBooks();
  const reviewStats = useReviewStats();
  const c = useSiteContent();
  const whatsappNumber = siteSettings?.supportWhatsapp || siteSettings?.whatsappNumber || "+919876543210";
  const whatsappMsg = encodeURIComponent(`नमस्ते! मुझे '${shaktiBook?.title || 'शक्ति से शांति'}' पुस्तक के बारे में प्रश्न पूछना है / आर्डर करना है।`);

  return (
    <section className="py-16 bg-[color:var(--c-page)] text-[color:var(--c-text)] relative overflow-hidden border-t-2 border-[color:var(--c-accent)]/50">
      
      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,146,58,0.15),transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[color:var(--c-accent)]/20 border border-[color:var(--c-accent)]/50 text-[color:var(--c-primary)] text-xs font-extrabold uppercase tracking-widest shadow-sm">
          <Sparkles className="w-4 h-4 text-[color:var(--c-primary)]" />
          <span>{getSiteDomain(siteSettings)} {tx('t.BuyCtaSection.639f189f')}</span>
        </div>

        {/* Large Headline */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-[color:var(--c-primary)] leading-tight">
            {siteSettings?.buyCtaHeadline || `आज ही '${shaktiBook?.title || 'शक्ति से शांति'}' ग्रंथ अपने द्वार मंगवाएं`}
          </h2>
          <p className="font-serif text-base sm:text-xl text-[color:var(--c-text)] leading-relaxed font-medium">
            {siteSettings?.buyCtaSubtitle || shaktiBook?.subtitle || 'मंत्रों के आभ्यंतर रहस्यों और अंतर्मन की 24 देवशक्तियों से अपने जीवन को संवारें।'}
          </p>
        </div>

        {/* Pricing Offer Card */}
        <div className="bg-[color:var(--c-surface)] p-6 sm:p-8 rounded-3xl border-2 border-[color:var(--c-accent)] max-w-xl mx-auto shadow-sm space-y-4">
          <div className="flex items-center justify-center gap-4">
            <span className="text-3xl sm:text-4xl font-black text-[color:var(--c-primary)]">₹{shaktiBook?.offerPrice || 499}</span>
            {shaktiBook?.mrp && shaktiBook.mrp > (shaktiBook?.offerPrice || 0) && (
              <span className="text-lg sm:text-xl text-[color:var(--c-text-muted)] line-through">₹{shaktiBook.mrp}</span>
            )}
            <span className="bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black text-xs px-3 py-1 rounded-full uppercase border border-amber-200">
              {shaktiBook?.discountPercent || (shaktiBook?.mrp && shaktiBook?.offerPrice ? Math.round(((shaktiBook.mrp - shaktiBook.offerPrice) / shaktiBook.mrp) * 100) : 38)}{tx('t.BuyCtaSection.09c734f0')}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[color:var(--c-text)] font-medium">
            {c('buy.shippingNote')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 pt-2">
            
            {/* Primary Buy Now Button */}
            <button
              onClick={() => onBuyNow(shaktiBook)}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold text-base py-4 px-8 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-transform active:scale-95 border border-amber-200"
            >
              <ShoppingCart className="w-5 h-5 text-[color:var(--c-ink)]" />
              <span>{c('buy.buyNow')}</span>
              <ArrowRight className="w-5 h-5 ml-1 text-[color:var(--c-ink)]" />
            </button>

            {/* Secondary WhatsApp Button */}
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-base py-4 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2.5 transition-transform active:scale-95 border border-emerald-500"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>{c('buy.whatsapp')}</span>
            </a>

          </div>
        </div>

        {/* Guarantees row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[color:var(--c-text)] pt-4 font-semibold">
          <span className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-[color:var(--c-primary)]" />
            <span>{c('buy.deliveryNote')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[color:var(--c-primary)]" />
            <span>{c('buy.secureNote')}</span>
          </span>
          {reviewStats && reviewStats.total > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[color:var(--c-accent)] fill-current" />
              <span>{reviewStats.total} {tx('t.BuyCtaSection.887689a9')} {reviewStats.average.toFixed(1)}/5</span>
            </span>
          )}
        </div>

      </div>
    </section>
  );
};
