import React, { useState } from 'react';
import { Eye, Heart, ShoppingBag, BookOpen, Headphones, Share2 } from 'lucide-react';
import { Book } from '../../types';
import { RatingStars } from './RatingStars';
import { useCart } from '../../context/CartContext';
import { PdfPreviewModal } from './PdfPreviewModal';
import { AudioPlayerModal } from './AudioPlayerModal';
import { QrShareModal } from './QrShareModal';

interface BookCardProps {
  book: Book;
  onSelectBook?: (book: Book) => void;
  onQuickView?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelectBook, onQuickView }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const isWishlisted = isInWishlist(book.id);

  return (
    <>
      <div className="group relative bg-[#FFF8EE] border border-[#D4AF37]/35 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-sm hover:border-[#D4AF37]/70 transition-all duration-300">
        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          {book.discountPercent > 0 && (
            <span className="bg-[#8B1E3F] text-amber-100 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm border border-[#D4AF37]/30">
              {book.discountPercent}% OFF
            </span>
          )}
          {book.isBestSeller && (
            <span className="bg-[#D4AF37] text-[#3A1F0D] font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm border border-amber-200">
              ★ Best Seller
            </span>
          )}
          {book.isNewRelease && (
            <span className="bg-[#66122C] text-amber-100 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md shadow-sm border border-[#D4AF37]/30">
              New Release
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
            className={`p-2 rounded-full shadow-sm  transition-transform active:scale-95 border border-[#D4AF37]/30 ${
              isWishlisted
                ? 'bg-[#8B1E3F] text-[#F4E285]'
                : 'bg-[#FFF8EE] text-[#3A1F0D] hover:bg-[#D4AF37]/20 hover:text-[#8B1E3F]'
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
              className="p-2 rounded-full bg-[#FFF8EE] text-[#3A1F0D] hover:text-[#8B1E3F] hover:bg-[#D4AF37]/20 shadow-sm transition-transform active:scale-95 border border-[#D4AF37]/30"
              title="Quick View"
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
            className="p-2 rounded-full bg-[#FFF8EE] text-[#3A1F0D] hover:text-[#8B1E3F] hover:bg-[#D4AF37]/20 shadow-sm transition-transform active:scale-95 border border-[#D4AF37]/30"
            title="QR Code & WhatsApp Share"
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
          className="relative aspect-[3/4] bg-[#F8F4E8] overflow-hidden cursor-pointer flex items-center justify-center p-4 focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-t-2xl border-b border-[#D4AF37]/25"
        >
          <img
            src={book.coverImage}
            alt={`Cover photo of ${book.title} by ${book.authorName}`}
            className="h-full max-h-[220px] object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80';
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
                className="bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow border border-[#D4AF37]/40"
              >
                <BookOpen className="w-3 h-3 text-[#F4E285]" aria-hidden="true" />
                <span>Read Sample</span>
              </button>
            )}

            {book.sampleAudioUrl && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowAudioModal(true);
                }}
                aria-label={`Listen to audio sample of ${book.title}`}
                className="bg-[#3A1F0D] hover:bg-[#251307] text-[#F4E285] text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow border border-[#D4AF37]/40"
              >
                <Headphones className="w-3 h-3 text-[#D4AF37]" aria-hidden="true" />
                <span>Listen Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Details Content */}
        <div className="p-4 flex flex-col flex-1 bg-[#FFF8EE]">
          {/* Category & Language */}
          <div className="flex items-center justify-between text-[11px] text-[#8B1E3F] font-bold mb-1">
            <span>{book.categoryName}</span>
            <span className="text-[#6E4E37] font-normal">{book.primaryLanguage}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelectBook && onSelectBook(book)}
            className="font-serif font-bold text-sm sm:text-base text-[#3A1F0D] line-clamp-2 hover:text-[#8B1E3F] cursor-pointer transition-colors leading-snug mb-1"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-xs text-[#6E4E37] mb-2 truncate">
            By <span className="font-semibold text-[#3A1F0D]">{book.authorName}</span>
          </p>

          {/* Ratings */}
          <div className="mb-3">
            <RatingStars rating={book.rating} count={book.reviewCount} size="sm" />
          </div>

          <div className="mt-auto pt-3 border-t border-amber-200/60 flex items-center justify-between">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-[#8B1E3F]">
                  ₹{book.offerPrice}
                </span>
                {book.mrp > book.offerPrice && (
                  <span className="text-xs text-[#6E4E37] line-through">
                    ₹{book.mrp}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#6E4E37] block font-light">
                {book.primaryFormat}
              </span>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={() => addToCart(book)}
              className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] p-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all transform active:scale-95 border border-amber-200"
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#3A1F0D]" />
              <span className="hidden sm:inline">Add</span>
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
