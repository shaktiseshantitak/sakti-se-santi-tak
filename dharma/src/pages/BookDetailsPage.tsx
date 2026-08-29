import React, { useState, useEffect } from 'react';
import {
  Star, ShoppingBag, Heart, ShieldCheck, Truck, BookOpen, Headphones,
  Share2, Check, ArrowRight, Sparkles, AlertCircle, MessageSquare, Layers, CheckCircle2
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
  const { addToCart, toggleWishlist, isInWishlist, addRecentlyViewed, recentlyViewedBookIds } = useCart();
  const { books, reviews, addReview } = useBooks();
  const { user } = useAuth();

  const [selectedVariant, setSelectedVariant] = useState<BookVariant | null>(
    book.variants && book.variants.length > 0 ? book.variants[0] : null
  );
  const [selectedFormat, setSelectedFormat] = useState<BookFormat>(book.primaryFormat);
  const [selectedLanguage, setSelectedLanguage] = useState<BookLanguage>(book.primaryLanguage);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<string>(book.coverImage);
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
    setActiveImage(book.coverImage);
    if (book.variants && book.variants.length > 0) {
      const defaultVar = book.variants[0];
      setSelectedVariant(defaultVar);
      setSelectedFormat(defaultVar.format);
      setSelectedLanguage(defaultVar.language);
      if (defaultVar.image) setActiveImage(defaultVar.image);
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
    if (variant.image) setActiveImage(variant.image);
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
  const images = Array.from(new Set([book.coverImage, ...(book.additionalImages || []), ...variantImages]));

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Books Catalog', onClick: () => onNavigate('books') },
            { label: book.categoryName, onClick: () => onNavigate('books', { categorySlug: book.categoryName.toLowerCase().replace(/\s+/g, '-') }) },
            { label: book.title },
          ]}
          onHomeClick={() => onNavigate('home')}
        />

        {/* Top Book Hero Section */}
        <div className="bg-[#FFF8EE] rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/40 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10 my-6">
          {/* Gallery Image Left Column */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-sm bg-[#F8F4E8] flex items-center justify-center p-6 border border-[#D4AF37]/40">
              <img
                src={activeImage}
                alt={book.title}
                className="h-full object-contain transition-all duration-300"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80';
                }}
              />
              {book.discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-[#8B1E3F] text-amber-100 font-bold text-xs px-2.5 py-1 rounded-md shadow border border-[#D4AF37]">
                  {book.discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 mt-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#F8F4E8] ${
                      activeImage === img ? 'border-[#8B1E3F] shadow' : 'border-[#D4AF37]/40 opacity-60'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=300&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Free Samples Bar */}
            <div className="flex items-center gap-2 mt-6 w-full max-w-sm">
              {book.samplePdfUrl && (
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="flex-1 bg-[#F8F4E8] hover:bg-amber-100/50 text-[#8B1E3F] border border-[#D4AF37]/50 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-[#8B1E3F]" />
                  <span>Free PDF Sample</span>
                </button>
              )}

              {book.sampleAudioUrl && (
                <button
                  onClick={() => setShowAudioModal(true)}
                  className="flex-1 bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 border border-[#D4AF37]/50 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Headphones className="w-4 h-4 text-[#D4AF37]" />
                  <span>Chanted Audio</span>
                </button>
              )}
            </div>
          </div>

          {/* Details Right Column */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#8B1E3F]">
                  {book.categoryName} • ISBN: {book.isbn}
                </span>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="text-xs font-semibold text-[#6E4E37] hover:text-[#8B1E3F] flex items-center gap-1"
                >
                  <Share2 className="w-4 h-4" /> Share / QR
                </button>
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#8B1E3F] mt-1 leading-tight">
                {book.title}
              </h1>

              {book.originalTitle && (
                <p className="font-serif text-sm text-[#8B1E3F] mt-1 font-bold">
                  {book.originalTitle}
                </p>
              )}

              <p className="text-xs sm:text-sm text-[#6E4E37] mt-2">
                By <span className="font-bold text-[#4A2C17]">{book.authorName}</span> • Published by <span className="text-[#4A2C17] font-semibold">{book.publisher}</span>
              </p>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-3">
                <RatingStars rating={book.rating} count={book.reviewCount} size="md" />
                <span className="text-xs text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
                  ✓ Verified Edition
                </span>
              </div>

              {/* Price & Discounts */}
              <div className="mt-6 p-4 bg-[#F8F4E8] border border-[#D4AF37]/50 rounded-2xl flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-[#8B1E3F] font-serif">
                  ₹{activeOfferPrice}
                </span>
                {activeMrp > activeOfferPrice && (
                  <span className="text-base text-[#6E4E37] line-through">
                    ₹{activeMrp}
                  </span>
                )}
                {activeDiscount > 0 && (
                  <span className="text-xs font-bold text-[#8B1E3F] bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg">
                    You Save ₹{activeMrp - activeOfferPrice} ({activeDiscount}%)
                  </span>
                )}
                <span className="text-xs text-[#6E4E37] ml-auto font-medium">
                  Inclusive of all Taxes (GST 5%)
                </span>
              </div>

              {/* Multi-Variety / Edition Selection Block */}
              {book.variants && book.variants.length > 0 && (
                <div className="mt-6 p-4 bg-[#F8F4E8] border border-[#D4AF37]/50 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#8B1E3F] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#8B1E3F]" />
                      <span>Select Book Variety / Edition (उपलब्ध वैरायटी):</span>
                    </label>
                    <span className="text-[10px] text-[#8B1E3F] font-bold bg-[#D4AF37]/30 border border-[#D4AF37]/50 px-2 py-0.5 rounded-md">
                      {book.variants.length} Varieties Available
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
                              ? 'bg-[#FFF8EE] border-[#8B1E3F] shadow-sm ring-2 ring-[#8B1E3F]/20'
                              : 'bg-[#FFF8EE]/60 border-[#D4AF37]/30 hover:border-[#D4AF37]'
                          }`}
                        >
                          {v.image ? (
                            <img src={v.image} alt={v.variantName} className="w-10 h-12 object-cover rounded-md border border-[#D4AF37]/30 shrink-0"  loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-10 h-12 bg-[#F8F4E8] rounded-md flex items-center justify-center text-[10px] text-[#6E4E37] shrink-0">
                              Book
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-xs truncate ${isSelected ? 'text-[#8B1E3F]' : 'text-[#4A2C17]'}`}>
                              {v.variantName}
                            </p>
                            <p className="text-[10px] text-[#6E4E37] mt-0.5 font-mono">
                              {v.format} • {v.language}
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="font-bold text-[#8B1E3F] text-xs">₹{v.offerPrice}</span>
                              {v.mrp > v.offerPrice && (
                                <span className="text-[10px] text-[#6E4E37] line-through">₹{v.mrp}</span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formats */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-[#8B1E3F] uppercase tracking-wider mb-2">
                  Select Format:
                </label>
                <div className="flex flex-wrap gap-2">
                  {book.formats.map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedFormat === fmt
                          ? 'bg-[#8B1E3F] text-amber-100 border-[#8B1E3F] shadow-sm'
                          : 'bg-[#F8F4E8] border-[#D4AF37]/40 text-[#4A2C17] hover:border-[#D4AF37]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-[#8B1E3F] uppercase tracking-wider mb-2">
                  Select Language Script:
                </label>
                <div className="flex flex-wrap gap-2">
                  {book.languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedLanguage === lang
                          ? 'bg-[#8B1E3F] text-amber-100 border-[#8B1E3F] shadow-sm'
                          : 'bg-[#F8F4E8] border-[#D4AF37]/40 text-[#4A2C17] hover:border-[#D4AF37]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions & CTA */}
            <div className="mt-8 pt-6 border-t border-[#D4AF37]/30 space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-[#D4AF37]/50 rounded-2xl overflow-hidden bg-[#F8F4E8]">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3.5 py-3 text-[#8B1E3F] hover:bg-[#D4AF37]/20 text-sm font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-3 text-sm font-bold min-w-[36px] text-center text-[#8B1E3F]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-3.5 py-3 text-[#8B1E3F] hover:bg-[#D4AF37]/20 text-sm font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => addToCart(book, selectedFormat, selectedLanguage, quantity, selectedVariant || undefined)}
                  className="flex-1 bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95 border border-amber-200"
                >
                  <ShoppingBag className="w-5 h-5 text-[#3A1F0D]" />
                  <span>Add to Shopping Cart</span>
                </button>

                <button
                  onClick={() => toggleWishlist(book.id)}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isWishlisted
                      ? 'bg-rose-100 border-rose-300 text-rose-700'
                      : 'border-[#D4AF37]/50 text-[#8B1E3F] hover:bg-rose-50'
                  }`}
                  title={isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-[#6E4E37] pt-2 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>100% Sanskrit Text Accuracy Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8B1E3F]" />
                  <span>Dispatched within 24 Hours from Varanasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation Details Section */}
        <div className="bg-[#FFF8EE] rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/40 shadow-sm my-8">
          <div className="flex border-b border-[#D4AF37]/30 overflow-x-auto gap-6 pb-2 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 transition-all ${
                activeTab === 'description'
                  ? 'border-b-2 border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
                  : 'text-[#6E4E37] hover:text-[#8B1E3F]'
              }`}
            >
              Description & Commentary
            </button>
            {book.tableOfContents && (
              <button
                onClick={() => setActiveTab('toc')}
                className={`pb-3 transition-all ${
                  activeTab === 'toc'
                    ? 'border-b-2 border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
                    : 'text-[#6E4E37] hover:text-[#8B1E3F]'
                }`}
              >
                Table of Contents ({book.tableOfContents.length} Chapters)
              </button>
            )}
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 transition-all ${
                activeTab === 'specs'
                  ? 'border-b-2 border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
                  : 'text-[#6E4E37] hover:text-[#8B1E3F]'
              }`}
            >
              Specifications & ISBN
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 transition-all ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-[#8B1E3F] text-[#8B1E3F] font-extrabold'
                  : 'text-[#6E4E37] hover:text-[#8B1E3F]'
              }`}
            >
              Reader Reviews ({bookReviews.length})
            </button>
          </div>

          <div className="pt-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none text-xs sm:text-sm text-[#4A2C17] leading-relaxed whitespace-pre-line font-medium">
                {book.longDescription || book.description}
                {book.trailerVideoUrl && (
                  <div className="not-prose mt-5">
                    <h3 className="font-serif font-bold text-sm text-[#8B1E3F] mb-2">Book Trailer</h3>
                    {book.trailerVideoIsYoutube ? (
                      <div className="aspect-video rounded-2xl overflow-hidden border border-[#D4AF37]/40">
                        <iframe
                          src={book.trailerVideoUrl.replace('watch?v=', 'embed/')}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Book Trailer"
                        />
                      </div>
                    ) : (
                      <video src={book.trailerVideoUrl} controls className="w-full rounded-2xl border border-[#D4AF37]/40 bg-black" />
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'toc' && book.tableOfContents && (
              <div className="divide-y divide-[#D4AF37]/20 text-xs sm:text-sm">
                {book.tableOfContents.map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#8B1E3F] mr-3">
                        {item.chapter}
                      </span>
                      <span className="text-[#4A2C17] font-semibold">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-mono text-[#6E4E37] text-xs">
                      Page {item.page}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                  <span className="text-[#6E4E37]">ISBN Code:</span>
                  <span className="font-mono font-bold text-[#8B1E3F]">{book.isbn}</span>
                </div>
                <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                  <span className="text-[#6E4E37]">Publisher:</span>
                  <span className="font-bold text-[#4A2C17]">{book.publisher}</span>
                </div>
                <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                  <span className="text-[#6E4E37]">Publication Year:</span>
                  <span className="font-bold text-[#4A2C17]">{book.publicationYear}</span>
                </div>
                <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                  <span className="text-[#6E4E37]">Edition:</span>
                  <span className="font-bold text-[#4A2C17]">{book.edition}</span>
                </div>
                <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                  <span className="text-[#6E4E37]">Number of Pages:</span>
                  <span className="font-bold text-[#4A2C17]">{book.pages} Pages</span>
                </div>
                <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                  <span className="text-[#6E4E37]">Weight:</span>
                  <span className="font-bold text-[#4A2C17]">{book.weightGrams} grams</span>
                </div>
                {book.dimensionsCm && (
                  <div className="p-3 bg-[#F8F4E8] rounded-xl flex justify-between border border-[#D4AF37]/30">
                    <span className="text-[#6E4E37]">Dimensions:</span>
                    <span className="font-bold text-[#4A2C17]">{book.dimensionsCm}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8">
                {/* Submit review form */}
                <div className="bg-[#F8F4E8] p-6 rounded-2xl border border-[#D4AF37]/40">
                  <h4 className="font-serif font-bold text-base text-[#8B1E3F] mb-1">
                    Submit Your Reader Reflection
                  </h4>
                  <p className="text-xs text-[#6E4E37] mb-4">
                    Share your experience reading this sacred volume.
                  </p>
                  {!user && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                      You're not signed in — your review will show here for now, but won't be saved permanently or visible to other readers unless you're logged in.
                    </p>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#4A2C17] mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={e => setReviewName(e.target.value)}
                          placeholder="e.g. Ramesh Sharma"
                          className="w-full px-3 py-2 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-xl text-xs text-[#4A2C17]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#4A2C17] mb-1">
                          Rating Score *
                        </label>
                        <select
                          value={reviewRating}
                          onChange={e => setReviewRating(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-xl text-xs font-semibold text-[#4A2C17]"
                        >
                          <option value={5}>★★★★★ (5/5) Supreme Excellent</option>
                          <option value={4}>★★★★☆ (4/5) Very Good Edition</option>
                          <option value={3}>★★★☆☆ (3/5) Average</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A2C17] mb-1">
                        Review Title
                      </label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                        placeholder="e.g. Pristine Sanskrit & Clear Commentary"
                        className="w-full px-3 py-2 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-xl text-xs text-[#4A2C17]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#4A2C17] mb-1">
                        Detailed Reflection *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Write your reflection on the print quality, commentary, or binding..."
                        className="w-full px-3 py-2 bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-xl text-xs text-[#4A2C17]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors border border-amber-200"
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
                      className="p-5 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
                           loading="lazy" decoding="async" />
                          <div>
                            <h5 className="font-bold text-xs text-[#8B1E3F]">
                              {rev.userName}
                            </h5>
                            <span className="text-[10px] text-[#6E4E37]">{rev.date}</span>
                          </div>
                        </div>
                        <RatingStars rating={rev.rating} size="sm" />
                      </div>

                      <h4 className="font-bold text-xs text-[#4A2C17] mt-2">
                        {rev.title}
                      </h4>
                      <p className="text-xs text-[#4A2C17] mt-1 leading-relaxed">
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
            <h3 className="font-serif font-bold text-xl text-[#8B1E3F] mb-6">
              Related Sacred Scripture Publications
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
