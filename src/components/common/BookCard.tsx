import { useSiteContent } from '../../lib/useSiteContent';
import React, { useState } from 'react';
import { Eye, Heart, ShoppingBag, BookOpen, Headphones, Share2 } from 'lucide-react';
import { Book } from '../../types';
import { RatingStars } from './RatingStars';
import { useCart } from '../../context/CartContext';
import { PdfPreviewModal } from './PdfPreviewModal';
import { AudioPlayerModal } from './AudioPlayerModal';
import { QrShareModal } from './QrShareModal';
import { NO_IMAGE_PLACEHOLDER } from '../../lib/placeholderImage';

interface BookCardProps {
  book: Book;
  onSelectBook?: (book: Book) => void;
  onQuickView?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelectBook, onQuickView }) => {
  const tx = useSiteContent();

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const isWishlisted = isInWishlist(book.id);

  return (
    <>
      <div className="group relative bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/35 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-sm hover:border-[color:var(--c-accent)]/70 transition-all duration-300">
        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          {book.discountPercent > 0 && (
            <span className="bg-[color:var(--c-primary)] text-amber-100 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm border border-[color:var(--c-accent)]/30">
              {book.discountPercent}{tx('t.BookCard.28cc1693')}
            </span>
          )}
          {book.isBestSeller && (
            <span className="bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm border border-amber-200">
              {tx('t.BookCard.f285cf39')}
            </span>
          )}
          {book.isNewRelease && (
            <span className="bg-[color:var(--c-primary-deep)] text-amber-100 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm border border-[color:var(--c-accent)]/30">
              {tx('t.BookCard.78e0f6db')}
            </span>
          )}
        </div>

        {/* Wishlist & Share Action Buttons */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => {
              e.stopPropagation();
              toggleWishlist(book.id);
            }}
            className={`p-2 rounded-full shadow-sm  transition-transform active:scale-95 border border-[color:var(--c-accent)]/30 ${
              isWishlisted
                ? 'bg-[color:var(--c-primary)] text-[color:var(--c-accent-light)]'
                : 'bg-[color:var(--c-surface)] text-[color:var(--c-ink)] hover:bg-[color:var(--c-accent)]/20 hover:text-[color:var(--c-primary)]'
            }`}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label={isWishlisted ? `Remove ${book.title} from Wishlist` : `Add ${book.title} to Wishlist`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {onQuickView && (
            <button
              onClick={e => {
                e.stopPropagation();
                onQuickView(book);
              }}
              className="p-2 rounded-full bg-[color:var(--c-surface)] text-[color:var(--c-ink)] hover:text-[color:var(--c-primary)] hover:bg-[color:var(--c-accent)]/20 shadow-sm transition-transform active:scale-95 border border-[color:var(--c-accent)]/30"
              title={tx('t.BookCard.1e7c8792')}
              aria-label={`Quick View ${book.title}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              setShowQrModal(true);
            }}
            className="p-2 rounded-full bg-[color:var(--c-surface)] text-[color:var(--c-ink)] hover:text-[color:var(--c-primary)] hover:bg-[color:var(--c-accent)]/20 shadow-sm transition-transform active:scale-95 border border-[color:var(--c-accent)]/30"
            title={tx('t.BookCard.3657fe04')}
            aria-label={`Share ${book.title} via QR code or WhatsApp`}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Image Frame */}
        <div
          onClick={() => onSelectBook && onSelectBook(book)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && onSelectBook) {
              e.preventDefault();
              onSelectBook(book);
            }
          }}
          tabIndex={onSelectBook ? 0 : undefined}
          role={onSelectBook ? "button" : undefined}
          aria-label={onSelectBook ? `View details for ${book.title}` : undefined}
          className="relative aspect-[3/4] bg-[color:var(--c-page)] overflow-hidden cursor-pointer flex items-center justify-center p-4 focus-visible:ring-2 focus-visible:ring-[color:var(--c-accent)] rounded-t-2xl border-b border-[color:var(--c-accent)]/25"
        >
          <img
            src={book.coverImage}
            alt={`Cover photo of ${book.title} by ${book.authorName}`}
            className="h-full max-h-[220px] object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = NO_IMAGE_PLACEHOLDER;
            }}
          />

          {/* Media Format Floating Badges */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {book.samplePdfUrl && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowPdfModal(true);
                }}
                aria-label={`Read sample PDF of ${book.title}`}
                className="bg-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-deep)] text-amber-100 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow border border-[color:var(--c-accent)]/40"
              >
                <BookOpen className="w-3 h-3 text-[color:var(--c-accent-light)]" aria-hidden="true" />
                <span>{tx('t.BookCard.a9c42614')}</span>
              </button>
            )}

            {book.sampleAudioUrl && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowAudioModal(true);
                }}
                aria-label={`Listen to audio sample of ${book.title}`}
                className="bg-[color:var(--c-ink)] hover:bg-[#1E120D] text-[color:var(--c-accent-light)] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow border border-[color:var(--c-accent)]/40"
              >
                <Headphones className="w-3 h-3 text-[color:var(--c-accent)]" aria-hidden="true" />
                <span>{tx('t.BookCard.bbfae576')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Details Content */}
        <div className="p-4 flex flex-col flex-1 bg-[color:var(--c-surface)]">
          {/* Category & Language */}
          <div className="flex items-center justify-between text-[11px] text-[color:var(--c-primary)] font-bold mb-1">
            <span>{book.categoryName}</span>
            <span className="text-[color:var(--c-text-muted)] font-normal">{book.primaryLanguage}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelectBook && onSelectBook(book)}
            className="font-serif font-bold text-sm sm:text-base text-[color:var(--c-ink)] line-clamp-2 hover:text-[color:var(--c-primary)] cursor-pointer transition-colors leading-snug mb-1"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-[color:var(--c-text-muted)] mb-2 truncate">
            {tx('t.BookCard.920860e5')} <span className="font-semibold text-[color:var(--c-ink)]">{book.authorName}</span>
          </p>

          {/* Ratings */}
          <div className="mb-3">
            <RatingStars rating={book.rating} count={book.reviewCount} size="sm" />
          </div>

          <div className="mt-auto pt-3 border-t border-amber-200/60 flex items-center justify-between">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-[color:var(--c-primary)]">
                  ₹{book.offerPrice}
                </span>
                {book.mrp > book.offerPrice && (
                  <span className="text-xs text-[color:var(--c-text-muted)] line-through">
                    ₹{book.mrp}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[color:var(--c-text-muted)] block font-light">
                {book.primaryFormat}
              </span>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={() => addToCart(book)}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] p-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all transform active:scale-95 border border-amber-200"
              title={tx('t.BookCard.2492fb7b')}
            >
              <ShoppingBag className="w-4 h-4 text-[color:var(--c-ink)]" />
              <span className="hidden sm:inline">{tx('t.BookCard.9d15ddbf')}</span>
            </button>
          </div>
        </div>
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
    </>
  );
};
