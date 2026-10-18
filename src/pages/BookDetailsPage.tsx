import React, { useState, useEffect } from 'react';
import {
  Star, ShoppingBag, Heart, ShieldCheck, Truck, BookOpen, Headphones,
  Share2, Check, ArrowRight, Sparkles, AlertCircle, MessageSquare, Layers, CheckCircle2, PlayCircle
} from 'lucide-react';
import { Book, BookFormat, BookLanguage, Review, BookVariant } from '../types';
import { RatingStars } from '../components/common/RatingStars';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BookCard } from '../components/common/BookCard';
import { PdfPreviewModal } from '../components/common/PdfPreviewModal';
import { AudioPlayerModal } from '../components/common/AudioPlayerModal';
import { QrShareModal } from '../components/common/QrShareModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { useSiteContent } from '../lib/useSiteContent';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholderImage';
import { getYoutubeEmbedUrl, extractYoutubeVideoId } from '../utils/youtube';

interface BookDetailsPageProps {
  book: Book;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectBook: (book: Book) => void;
  onQuickView: (book: Book) => void;
}

export const BookDetailsPage: React.FC<BookDetailsPageProps> = ({
  book,
  onNavigate,
  onSelectBook,
  onQuickView,
}) => {
  const tx = useSiteContent();

  const { addToCart, toggleWishlist, isInWishlist, addRecentlyViewed, recentlyViewedBookIds } = useCart();
  const { books, reviews, addReview } = useBooks();
  const c = useSiteContent();
  const { user } = useAuth();

  const [selectedVariant, setSelectedVariant] = useState<BookVariant | null>(
    book.variants && book.variants.length > 0 ? book.variants[0] : null
  );
  const [selectedFormat, setSelectedFormat] = useState<BookFormat>(book.primaryFormat);
  const [selectedLanguage, setSelectedLanguage] = useState<BookLanguage>(book.primaryLanguage);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeMediaIdx, setActiveMediaIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'description' | 'toc' | 'specs' | 'reviews'>('description');

  // Modals
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // New review state
  const [reviewName, setReviewName] = useState<string>('');
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setActiveMediaIdx(0);
    if (book.variants && book.variants.length > 0) {
      const defaultVar = book.variants[0];
      setSelectedVariant(defaultVar);
      setSelectedFormat(defaultVar.format);
      setSelectedLanguage(defaultVar.language);
      // Variant images are appended after the base gallery below, so
      // there's no single fixed index to jump to here — leaving the
      // gallery on its first slide (the cover) is the safe default.
    } else {
      setSelectedVariant(null);
      setSelectedFormat(book.primaryFormat);
      setSelectedLanguage(book.primaryLanguage);
    }
    addRecentlyViewed(book.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [book.id]);

  const handleSelectVariant = (variant: BookVariant) => {
    setSelectedVariant(variant);
    setSelectedFormat(variant.format);
    setSelectedLanguage(variant.language);
    if (variant.image) {
      const idx = images.findIndex(g => g.type === 'image' && g.url === variant.image);
      if (idx !== -1) setActiveMediaIdx(idx);
    }
  };

  const activeOfferPrice = selectedVariant ? selectedVariant.offerPrice : book.offerPrice;
  const activeMrp = selectedVariant ? selectedVariant.mrp : book.mrp;
  const activeDiscount = activeMrp > activeOfferPrice ? Math.round(((activeMrp - activeOfferPrice) / activeMrp) * 100) : 0;

  const isWishlisted = isInWishlist(book.id);
  const bookReviews = reviews.filter(r => r.bookId === book.id && r.approved);
  const relatedBooks = books.filter(b => b.categoryId === book.categoryId && b.id !== book.id).slice(0, 4);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    addReview({
      bookId: book.id,
      userId: user?.id, // when signed in, this is what lets the review actually be
                         // saved to the database — see addReview in BookContext for why.
      userName: reviewName,
      rating: reviewRating,
      title: reviewTitle || 'Profound Spiritual Book',
      comment: reviewComment,
      verifiedPurchase: true,
    });
    setReviewSubmitted(true);
    setReviewName('');
    setReviewTitle('');
    setReviewComment('');
    setTimeout(() => setReviewSubmitted(false), 3000);
  };

  const variantImages = (book.variants || []).map(v => v.image).filter((img): img is string => !!img);
  const imageUrls = Array.from(new Set([book.coverImage, ...(book.additionalImages || []), ...variantImages]));
  // The trailer
  // video used to only appear in the Description tab, separate from the
  // main image gallery. It's now one of the slidable gallery items
  // itself — added last so the photos still lead. Rendering logic for
  // the video (YouTube vs direct file) is unchanged from what the
  // Description tab already used; only where it appears has moved.
  type GalleryItem = { type: 'image'; url: string } | { type: 'video'; url: string; isYoutube: boolean };
  const images: GalleryItem[] = [
    ...imageUrls.map((url): GalleryItem => ({ type: 'image', url })),
    ...(book.trailerVideoUrl
      ? [{ type: 'video', url: book.trailerVideoUrl, isYoutube: Boolean(book.trailerVideoIsYoutube) || Boolean(extractYoutubeVideoId(book.trailerVideoUrl)) } as GalleryItem]
      : []),
  ];
  const activeMedia = images[activeMediaIdx] || images[0];

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: c('crumb.catalog'), onClick: () => onNavigate('books') },
            { label: book.categoryName, onClick: () => onNavigate('books', { categorySlug: book.categoryName.toLowerCase().replace(/\s+/g, '-') }) },
            { label: book.title },
          ]}
          onHomeClick={() => onNavigate('home')}
        />

        {/* Top Book Hero Section */}
        <div className="bg-[color:var(--c-surface)] rounded-3xl p-6 sm:p-10 border border-[color:var(--c-accent)]/40 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 my-6">
          {/* Gallery Image Left Column */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-sm bg-[color:var(--c-page)] flex items-center justify-center p-6 border border-[color:var(--c-accent)]/40">
              {activeMedia?.type === 'video' ? (
                activeMedia.isYoutube ? (
                  <iframe
                    src={getYoutubeEmbedUrl(activeMedia.url)}
                    className="w-full aspect-video rounded-xl bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={tx('t.BookDetailsPage.858d6d8e')}
                  />
                ) : (
                  <video src={activeMedia.url} controls playsInline className="w-full max-h-full object-contain rounded-xl bg-black" />
                )
              ) : (
                <img
                  src={activeMedia?.url || book.coverImage}
                  alt={book.title}
                  className="h-full object-contain transition-all duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = NO_IMAGE_PLACEHOLDER;
                  }}
                />
              )}
              {book.discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-[color:var(--c-primary)] text-amber-100 font-bold text-xs px-2.5 py-1 rounded-md shadow border border-[color:var(--c-accent)]">
                  {book.discountPercent}{tx('t.BookDetailsPage.24286279')}
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 mt-4">
                {images.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIdx(idx)}
                    className={`relative w-14 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[color:var(--c-page)] ${
                      activeMediaIdx === idx ? 'border-[color:var(--c-primary)] shadow' : 'border-[color:var(--c-accent)]/40 opacity-60'
                    }`}
                  >
                    <img
                      src={item.type === 'video' ? book.coverImage : item.url}
                      alt=""
                      className="w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = NO_IMAGE_PLACEHOLDER;
                      }}
                    />
                    {item.type === 'video' && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <PlayCircle className="w-6 h-6 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Free Samples Bar */}
            <div className="flex items-center gap-2 mt-6 w-full max-w-sm">
              {book.samplePdfUrl && (
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="flex-1 bg-[color:var(--c-page)] hover:bg-amber-100/50 text-[color:var(--c-primary)] border border-[color:var(--c-accent)]/50 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-[color:var(--c-primary)]" />
                  <span>{c('book.freeSample')}</span>
                </button>
              )}

              {book.sampleAudioUrl && (
                <button
                  onClick={() => setShowAudioModal(true)}
                  className="flex-1 bg-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-deep)] text-amber-100 border border-[color:var(--c-accent)]/50 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Headphones className="w-4 h-4 text-[color:var(--c-accent)]" />
                  <span>{c('book.audio')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Details Right Column */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--c-primary)]">
                  {book.categoryName} {tx('t.BookDetailsPage.729bf5dc')} {book.isbn}
                </span>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="text-xs font-semibold text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)] flex items-center gap-1"
                >
                  <Share2 className="w-4 h-4" /> {tx('t.BookDetailsPage.d3bb456e')}
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[color:var(--c-primary)] mt-1 leading-tight">
                {book.title}
              </h1>

              {book.originalTitle && (
                <p className="font-serif text-sm text-[color:var(--c-primary)] mt-1 font-bold">
                  {book.originalTitle}
                </p>
              )}

              <p className="text-xs sm:text-sm text-[color:var(--c-text-muted)] mt-2">
                {tx('t.BookDetailsPage.9973e8c9')} <span className="font-bold text-[color:var(--c-text)]">{book.authorName}</span> {c('book.publishedBy')} <span className="text-[color:var(--c-text)] font-semibold">{book.publisher}</span>
              </p>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-3">
                <RatingStars rating={book.rating} count={book.reviewCount} size="md" />
                <span className="text-xs text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
                  {c('book.verified')}
                </span>
              </div>

              {/* Price & Discounts */}
              <div className="mt-6 p-4 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/50 rounded-2xl flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-[color:var(--c-primary)] font-serif">
                  ₹{activeOfferPrice}
                </span>
                {activeMrp > activeOfferPrice && (
                  <span className="text-base text-[color:var(--c-text-muted)] line-through">
                    ₹{activeMrp}
                  </span>
                )}
                {activeDiscount > 0 && (
                  <span className="text-xs font-bold text-[color:var(--c-primary)] bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg">
                    {tx('t.BookDetailsPage.731b2211')}{activeMrp - activeOfferPrice} ({activeDiscount}%)
                  </span>
                )}
                <span className="text-xs text-[color:var(--c-text-muted)] ml-auto font-medium">
                  {tx('t.BookDetailsPage.62425cbd')}
                </span>
              </div>

              {/* Multi-Variety / Edition Selection Block */}
              {book.variants && book.variants.length > 0 && (
                <div className="mt-6 p-4 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/50 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[color:var(--c-primary)]" />
                      <span>{tx('t.BookDetailsPage.32f827cd')}</span>
                    </label>
                    <span className="text-[10px] text-[color:var(--c-primary)] font-bold bg-[color:var(--c-accent)]/30 border border-[color:var(--c-accent)]/50 px-2 py-0.5 rounded-md">
                      {book.variants.length} {tx('t.BookDetailsPage.dc7e120c')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {book.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVariant(v)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-[color:var(--c-surface)] border-[color:var(--c-primary)] shadow-sm ring-2 ring-[color:var(--c-primary)]/20'
                              : 'bg-[color:var(--c-surface)]/60 border-[color:var(--c-accent)]/30 hover:border-[color:var(--c-accent)]'
                          }`}
                        >
                          {v.image ? (
                            <img src={v.image} alt={v.variantName} className="w-10 h-12 object-cover rounded-md border border-[color:var(--c-accent)]/30 shrink-0"  loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-10 h-12 bg-[color:var(--c-page)] rounded-md flex items-center justify-center text-[10px] text-[color:var(--c-text-muted)] shrink-0">
                              {tx('t.BookDetailsPage.76ebc7f2')}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-xs truncate ${isSelected ? 'text-[color:var(--c-primary)]' : 'text-[color:var(--c-text)]'}`}>
                              {v.variantName}
                            </p>
                            <p className="text-[10px] text-[color:var(--c-text-muted)] mt-0.5 font-mono">
                              {v.format} • {v.language}
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="font-bold text-[color:var(--c-primary)] text-xs">₹{v.offerPrice}</span>
                              {v.mrp > v.offerPrice && (
                                <span className="text-[10px] text-[color:var(--c-text-muted)] line-through">₹{v.mrp}</span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formats */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider mb-2">
                  {c('book.formatLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {book.formats.map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedFormat === fmt
                          ? 'bg-[color:var(--c-primary)] text-amber-100 border-[color:var(--c-primary)] shadow-sm'
                          : 'bg-[color:var(--c-page)] border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] hover:border-[color:var(--c-accent)]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider mb-2">
                  {c('book.langLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {book.languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedLanguage === lang
                          ? 'bg-[color:var(--c-primary)] text-amber-100 border-[color:var(--c-primary)] shadow-sm'
                          : 'bg-[color:var(--c-page)] border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] hover:border-[color:var(--c-accent)]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions & CTA */}
            <div className="mt-8 pt-6 border-t border-[color:var(--c-accent)]/30 space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-[color:var(--c-accent)]/50 rounded-2xl overflow-hidden bg-[color:var(--c-page)]">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3.5 py-3 text-[color:var(--c-primary)] hover:bg-[color:var(--c-accent)]/20 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-sm font-bold min-w-[36px] text-center text-[color:var(--c-primary)]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3.5 py-3 text-[color:var(--c-primary)] hover:bg-[color:var(--c-accent)]/20 text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(book, selectedFormat, selectedLanguage, quantity, selectedVariant || undefined)}
                  className="flex-1 bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95 border border-amber-200"
                >
                  <ShoppingBag className="w-5 h-5 text-[color:var(--c-ink)]" />
                  <span>{c('book.addToCart')}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(book.id)}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isWishlisted
                      ? 'bg-rose-100 border-rose-300 text-rose-700'
                      : 'border-[color:var(--c-accent)]/50 text-[color:var(--c-primary)] hover:bg-rose-50'
                  }`}
                  title={isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-[color:var(--c-text-muted)] pt-2 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{c('book.guarantee')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[color:var(--c-primary)]" />
                  <span>{c('book.dispatch')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation Details Section */}
        <div className="bg-[color:var(--c-surface)] rounded-3xl p-6 sm:p-10 border border-[color:var(--c-accent)]/40 shadow-sm my-8">
          <div className="flex border-b border-[color:var(--c-accent)]/30 overflow-x-auto gap-6 pb-2 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 transition-all ${
                activeTab === 'description'
                  ? 'border-b-2 border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
                  : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
              }`}
            >
              {c('book.tabDesc')}
            </button>
            {book.tableOfContents && (
              <button
                onClick={() => setActiveTab('toc')}
                className={`pb-3 transition-all ${
                  activeTab === 'toc'
                    ? 'border-b-2 border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
                    : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
                }`}
              >
                {tx('t.BookDetailsPage.0cee8ca1')}{book.tableOfContents.length} {tx('t.BookDetailsPage.0d1a701c')}
              </button>
            )}
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 transition-all ${
                activeTab === 'specs'
                  ? 'border-b-2 border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
                  : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
              }`}
            >
              {c('book.tabSpecs')}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 transition-all ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-[color:var(--c-primary)] text-[color:var(--c-primary)] font-extrabold'
                  : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'
              }`}
            >
              {tx('t.BookDetailsPage.15e63815')}{bookReviews.length})
            </button>
          </div>

          <div className="pt-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-xs sm:text-sm text-[color:var(--c-text)] leading-relaxed whitespace-pre-line font-medium">
                {book.longDescription || book.description}
              </div>
            )}

            {activeTab === 'toc' && book.tableOfContents && (
              <div className="divide-y divide-[color:var(--c-accent)]/20 text-xs sm:text-sm">
                {book.tableOfContents.map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[color:var(--c-primary)] mr-3">
                        {item.chapter}
                      </span>
                      <span className="text-[color:var(--c-text)] font-semibold">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-mono text-[color:var(--c-text-muted)] text-xs">
                      {tx('t.BookDetailsPage.37b19706')} {item.page}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                  <span className="text-[color:var(--c-text-muted)]">{c('book.specIsbn')}</span>
                  <span className="font-mono font-bold text-[color:var(--c-primary)]">{book.isbn}</span>
                </div>
                <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                  <span className="text-[color:var(--c-text-muted)]">{c('book.specPublisher')}</span>
                  <span className="font-bold text-[color:var(--c-text)]">{book.publisher}</span>
                </div>
                <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                  <span className="text-[color:var(--c-text-muted)]">{c('book.specYear')}</span>
                  <span className="font-bold text-[color:var(--c-text)]">{book.publicationYear}</span>
                </div>
                <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                  <span className="text-[color:var(--c-text-muted)]">{c('book.specEdition')}</span>
                  <span className="font-bold text-[color:var(--c-text)]">{book.edition}</span>
                </div>
                <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                  <span className="text-[color:var(--c-text-muted)]">{c('book.specPages')}</span>
                  <span className="font-bold text-[color:var(--c-text)]">{book.pages} {tx('t.BookDetailsPage.8cbccba6')}</span>
                </div>
                <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                  <span className="text-[color:var(--c-text-muted)]">{c('book.specWeight')}</span>
                  <span className="font-bold text-[color:var(--c-text)]">{book.weightGrams} {tx('t.BookDetailsPage.89593413')}</span>
                </div>
                {book.dimensionsCm && (
                  <div className="p-3 bg-[color:var(--c-page)] rounded-xl flex justify-between border border-[color:var(--c-accent)]/30">
                    <span className="text-[color:var(--c-text-muted)]">{c('book.specDimensions')}</span>
                    <span className="font-bold text-[color:var(--c-text)]">{book.dimensionsCm}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Submit review form */}
                <div className="bg-[color:var(--c-page)] p-6 rounded-2xl border border-[color:var(--c-accent)]/40">
                  <h4 className="font-serif font-bold text-base text-[color:var(--c-primary)] mb-1">
                    {c('book.reviewTitle')}
                  </h4>
                  <p className="text-xs text-[color:var(--c-text-muted)] mb-4">
                    {c('book.reviewSub')}
                  </p>
                  {!user && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                      {tx('t.BookDetailsPage.99c18afe')}
                    </p>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[color:var(--c-text)] mb-1">
                          {tx('t.BookDetailsPage.82c3c22d')}
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={e => setReviewName(e.target.value)}
                          placeholder={tx('t.BookDetailsPage.4a892db8')}
                          className="w-full px-3 py-2 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs text-[color:var(--c-text)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[color:var(--c-text)] mb-1">
                          {tx('t.BookDetailsPage.a5baa1dd')}
                        </label>
                        <select
                          value={reviewRating}
                          onChange={e => setReviewRating(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs font-semibold text-[color:var(--c-text)]"
                        >
                          <option value={5}>{tx('t.BookDetailsPage.562e71e3')}</option>
                          <option value={4}>{tx('t.BookDetailsPage.27e401e3')}</option>
                          <option value={3}>{tx('t.BookDetailsPage.dfc4e6c6')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--c-text)] mb-1">
                        {tx('t.BookDetailsPage.4ddccea9')}
                      </label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                        placeholder={tx('t.BookDetailsPage.fa1be545')}
                        className="w-full px-3 py-2 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs text-[color:var(--c-text)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[color:var(--c-text)] mb-1">
                        {tx('t.BookDetailsPage.75e74304')}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder={tx('t.BookDetailsPage.ab590183')}
                        className="w-full px-3 py-2 bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs text-[color:var(--c-text)]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors border border-amber-200"
                    >
                      {reviewSubmitted ? '✓ Reflection Submitted!' : 'Post Review'}
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {bookReviews.map(rev => (
                    <div
                      key={rev.id}
                      className="p-5 bg-[color:var(--c-page)] rounded-2xl border border-[color:var(--c-accent)]/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-[color:var(--c-accent)]"
                           loading="lazy" decoding="async" />
                          <div>
                            <h5 className="font-bold text-xs text-[color:var(--c-primary)]">
                              {rev.userName}
                            </h5>
                            <span className="text-[10px] text-[color:var(--c-text-muted)]">{rev.date}</span>
                          </div>
                        </div>
                        <RatingStars rating={rev.rating} size="sm" />
                      </div>

                      <h4 className="font-bold text-xs text-[color:var(--c-text)] mt-2">
                        {rev.title}
                      </h4>
                      <p className="text-xs text-[color:var(--c-text)] mt-1 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Books Carousel */}
        {relatedBooks.length > 0 && (
          <div className="my-12">
            <h3 className="font-serif font-bold text-xl text-[color:var(--c-primary)] mb-6">
              {c('book.related')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedBooks.map(rel => (
                <BookCard
                  key={rel.id}
                  book={rel}
                  onSelectBook={onSelectBook}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPdfModal && (
        <PdfPreviewModal
          book={book}
          onClose={() => setShowPdfModal(false)}
          onBuyClick={() => {
            setShowPdfModal(false);
            addToCart(book, 'PDF (E-Book)');
          }}
        />
      )}

      {showAudioModal && (
        <AudioPlayerModal
          book={book}
          onClose={() => setShowAudioModal(false)}
        />
      )}

      {showQrModal && (
        <QrShareModal
          book={book}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};
