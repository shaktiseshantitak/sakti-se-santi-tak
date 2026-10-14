import React from 'react';
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Award, Star, Compass } from 'lucide-react';
import { Book } from '../../types';

interface HeroBannerProps {
  onExploreClick: () => void;
  onSelectBook: (book: Book) => void;
  featuredBook?: Book;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onSelectBook,
  featuredBook,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#6B1D3A] via-[#4F1229] to-[#3F0E21] text-amber-50 py-16 sm:py-24 border-b border-[#B8923A]/40">
      {/* Background Decorative Mandala Rings */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border-[16px] border-[#B8923A] flex items-center justify-center">
          <div className="w-[450px] h-[450px] rounded-full border-[8px] border-[#B8923A] flex items-center justify-center">
            <span className="text-9xl font-serif text-[#E3C77E]">ॐ</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8923A]/20 border border-[#B8923A]/50 text-[#E3C77E] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#E3C77E]" />
              <span>International Sacred Publishing House</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Preserving <span className="text-[#E3C77E] italic">Vedic Wisdom</span> for Seekers Worldwide
            </h1>

            <p className="text-sm sm:text-base text-amber-100/90 max-w-2xl leading-relaxed mx-auto lg:mx-0 font-light">
              Explore gold-embossed hardcover scriptures, Sanskrit transliterations, authentic commentaries, E-Books (PDFs), and chanted audio guides. Verified by traditional Vedantic scholars in Varanasi.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="bg-[#B8923A] hover:bg-amber-300 text-[#2B1B14] font-extrabold px-7 py-3.5 rounded-2xl text-sm flex items-center gap-2 shadow-sm shadow-[#B8923A]/20 transition-all transform hover:-translate-y-0.5 active:scale-95 border border-amber-200"
              >
                <BookOpen className="w-4 h-4 text-[#2B1B14]" />
                <span>Explore Sacred Books</span>
                <ArrowRight className="w-4 h-4 ml-1 text-[#2B1B14]" />
              </button>

              {featuredBook && (
                <button
                  onClick={() => onSelectBook(featuredBook)}
                  className="bg-[#3F0E21] hover:bg-[#4F1229] text-amber-200 font-semibold px-6 py-3.5 rounded-2xl text-sm border border-[#B8923A]/40 transition-all flex items-center gap-2"
                >
                  <Star className="w-4 h-4 text-[#E3C77E] fill-current" />
                  <span>Bhagavad Gita Deluxe Edition</span>
                </button>
              )}
            </div>

            {/* Micro value badges */}
            <div className="pt-6 border-t border-[#B8923A]/30 grid grid-cols-3 gap-4 text-xs text-amber-200">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <ShieldCheck className="w-4 h-4 text-[#E3C77E] shrink-0" />
                <span>Scholar Verified</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Award className="w-4 h-4 text-[#E3C77E] shrink-0" />
                <span>Gold Foil Bindings</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Compass className="w-4 h-4 text-[#E3C77E] shrink-0" />
                <span>80+ Countries Shipping</span>
              </div>
            </div>
          </div>

          {/* Hero Right Featured Book Showcase */}
          {featuredBook && (
            <div className="lg:col-span-5 flex justify-center">
              <div
                onClick={() => onSelectBook(featuredBook)}
                className="relative group cursor-pointer max-w-xs sm:max-w-sm w-full bg-[#4F1229] p-6 rounded-3xl border border-[#B8923A]/50 shadow-sm hover:border-[#B8923A] transition-all duration-300"
              >
                <div className="absolute -top-3 -right-3 z-20 bg-[#B8923A] text-[#2B1B14] font-black text-xs uppercase px-3 py-1 rounded-full shadow-xs flex items-center gap-1 border border-amber-200">
                  ★ Best Seller Edition
                </div>

                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm bg-[#3F0E21] flex items-center justify-center p-4 mb-4 border border-[#B8923A]/30">
                  <img
                    src={featuredBook.coverImage}
                    alt={featuredBook.title}
                    className="h-full object-contain group-hover:scale-105 transition-transform duration-300"
                   loading="lazy" decoding="async" />
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-bold text-[#E3C77E] uppercase tracking-widest block mb-1">
                    {featuredBook.categoryName}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-white line-clamp-1 group-hover:text-[#E3C77E] transition-colors">
                    {featuredBook.title}
                  </h3>
                  <p className="text-xs text-amber-200 mt-0.5">By {featuredBook.authorName}</p>

                  <div className="mt-3 flex items-center justify-center gap-3">
                    <span className="text-2xl font-bold text-white">₹{featuredBook.offerPrice}</span>
                    <span className="text-xs text-amber-200/70 line-through">₹{featuredBook.mrp}</span>
                    <span className="text-xs font-bold text-emerald-200 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-400/40">
                      Save {featuredBook.discountPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
