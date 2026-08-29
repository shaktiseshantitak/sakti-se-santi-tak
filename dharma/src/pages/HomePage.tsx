import React from 'react';
import { ShaktiHeroBanner } from '../components/home/ShaktiHeroBanner';
import { TrustSection } from '../components/home/TrustSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { SacredStats } from '../components/home/SacredStats';
import { BuyCtaSection } from '../components/home/BuyCtaSection';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useCart } from '../context/CartContext';
import { Book } from '../types';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectBook: (book: Book) => void;
  onQuickView?: (book: Book) => void;
  onSelectBlog?: (blog: any) => void;
  onOpenLiveStream?: () => void;
}

// NOTE: this page used to have 9 stacked sections (Hero, Trust, Featured
// Spotlight, Testimonials+Stats, a 9-card navigation grid duplicating the
// main nav, an Authors block, a Blog preview grid, a full FAQ section, and
// the Buy CTA) — reported as "too big / slow / boring." Trimmed to the 5
// sections that actually drive trust and purchase decisions; the removed
// ones (site-wide navigation cards, Authors, Blog preview, FAQ) are all
// still one tap away via the main nav/footer at their own dedicated pages
// (/authors, /blogs, /faq) — nothing was deleted, just no longer duplicated
// on the home page itself.
export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
}) => {
  const { books, testimonials, siteSettings } = useBooks();
  const { addToCart } = useCart();

  const heroBookId = siteSettings?.featuredHeroBookId || 'book-shakti';
  const shaktiBook = books.find(b => b.id === heroBookId) || books.find(b => b.isFeatured) || books[0];

  const handleBuyNow = (bookToBuy?: Book) => {
    const targetBook = bookToBuy || shaktiBook;
    addToCart(targetBook, 'Hardcover', targetBook.languages[0] || 'Hindi', 1);
    onNavigate('checkout', { directBook: targetBook });
  };

  // FEATURE (2026-08-29 — admin-controlled section visibility/order): each
  // of the 5 sections below is now keyed so siteSettings.homepageSections
  // (edited in Admin -> Settings -> Homepage) can toggle it on/off and
  // reorder it, without changing what each section actually renders.
  const DEFAULT_SECTION_ORDER = ['hero', 'trust', 'featured', 'testimonials', 'buy_cta'];
  const sectionOrder = siteSettings?.homepageSections && siteSettings.homepageSections.length > 0
    ? [...siteSettings.homepageSections].sort((a, b) => a.order - b.order)
    : DEFAULT_SECTION_ORDER.map((id, i) => ({ id, enabled: true, order: i } as any));

  const sectionRenderers: Record<string, React.ReactNode> = {
    hero: (
      <ShaktiHeroBanner
        shaktiBook={shaktiBook}
        onBuyNow={handleBuyNow}
        onAuthorsClick={() => onNavigate('authors')}
      />
    ),
    trust: <TrustSection />,
    featured: (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#8B1E3F] to-[#5C142B] text-amber-100 rounded-3xl p-6 sm:p-10 shadow-xl border border-amber-400/30 flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              100% प्रामाणिक वैदिक ग्रंथ • हार्डकवर संस्करण
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-extrabold leading-tight text-white">
              {shaktiBook?.title || 'शक्ति से शांति तक'}
            </h3>
            <p className="text-xs sm:text-base text-amber-200/90 leading-relaxed">
              {shaktiBook?.description || 'गायत्री महामंत्र एवं दुर्गा मंत्र की अंतर्यात्रा रहस्य तथा अंतर्मन की 24 देवशक्तियों को उजागर करने वाला प्रामाणिक ग्रंथ।'}
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => handleBuyNow(shaktiBook)}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#3A1F0D] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-transform active:scale-95"
              >
                ₹{shaktiBook?.offerPrice || 499} में आर्डर करें (Buy Now)
              </button>
              <button
                onClick={() => onNavigate('book-details', { bookId: shaktiBook.id })}
                className="bg-white/10 hover:bg-white/20 text-amber-100 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl border border-amber-300/30 transition-colors inline-flex items-center gap-1.5"
              >
                <span>पूरा विवरण एवं विषय-सूची पढ़ें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="shrink-0 w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 transform hover:scale-105 transition-transform duration-300">
            <OptimizedImage
              src={shaktiBook?.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80'}
              alt={shaktiBook?.title || 'Shakti Se Shanti'}
              targetWidth={500}
              priority={false}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>
    ),
    testimonials: (
      <>
        {testimonials && testimonials.length > 0 && (
          <TestimonialsSection testimonials={testimonials} />
        )}
        <SacredStats />
      </>
    ),
    buy_cta: (
      <BuyCtaSection
        shaktiBook={shaktiBook}
        onBuyNow={handleBuyNow}
      />
    ),
  };

  return (
    <div className="bg-[#F8F4E8] text-[#4A2C17] pb-16 space-y-12">
      {sectionOrder
        .filter((sec: any) => sec.enabled)
        .map((sec: any) => <React.Fragment key={sec.id}>{sectionRenderers[sec.id]}</React.Fragment>)}
    </div>
  );
};


