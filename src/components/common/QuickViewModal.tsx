import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, Check, BookOpen, ShieldCheck, Truck } from 'lucide-react';
import { Book, BookFormat, BookLanguage } from '../../types';
import { useCart } from '../../context/CartContext';
import { RatingStars } from './RatingStars';

interface QuickViewModalProps {
  book: Book;
  onClose: () => void;
  onViewFullDetails: (book: Book) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  book,
  onClose,
  onViewFullDetails,
}) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [selectedFormat, setSelectedFormat] = useState<BookFormat>(book.primaryFormat);
  const [selectedLanguage, setSelectedLanguage] = useState<BookLanguage>(book.primaryLanguage);
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);

  const isWishlisted = isInWishlist(book.id);

  const handleAddToCart = () => {
    addToCart(book, selectedFormat, selectedLanguage, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
    >
      <div className="glass-panel text-zinc-900 dark:text-zinc-100 w-full max-w-3xl rounded-3xl shadow-sm overflow-hidden relative my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Close Quick View Modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Book Image Cover */}
          <div className="bg-zinc-50 dark:bg-zinc-800/40 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
            <div className="relative max-w-[220px] aspect-[3/4] rounded-xl overflow-hidden shadow-sm">
              <img
                src={book.coverImage}
                alt={`Cover photo of ${book.title}`}
                className="w-full h-full object-cover"
               loading="lazy" decoding="async" />
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" /> 100% Authentic Text
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4 text-amber-600" aria-hidden="true" /> Fast Shipping
              </span>
            </div>
          </div>

          {/* Details & Selectors */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                {book.categoryName}
              </span>

              <h2 id="quickview-title" className="font-serif text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-1 leading-snug">
                {book.title}
              </h2>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                By <span className="text-zinc-800 dark:text-zinc-200 font-medium">{book.authorName}</span>
              </p>

              <div className="mt-2 flex items-center gap-2">
                <RatingStars rating={book.rating} count={book.reviewCount} />
                <span className="text-xs text-zinc-400">• ISBN: {book.isbn}</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-900 dark:text-amber-400">
                  ₹{book.offerPrice}
                </span>
                {book.mrp > book.offerPrice && (
                  <span className="text-sm text-zinc-400 line-through">
                    ₹{book.mrp}
                  </span>
                )}
                {book.discountPercent > 0 && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                    Save {book.discountPercent}%
                  </span>
                )}
              </div>

              {/* Formats Selector */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select Edition Format:
                </label>
                <div className="flex flex-wrap gap-2">
                  {book.formats.map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedFormat === fmt
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-amber-400'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select Language Script:
                </label>
                <div className="flex flex-wrap gap-2">
                  {book.languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedLanguage === lang
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-amber-400'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short description */}
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-4 line-clamp-3 leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-semibold min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95"
              >
                {added ? <Check className="w-4 h-4 text-white" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{added ? 'Added to Cart!' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(book.id)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/60'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  onClose();
                  onViewFullDetails(book);
                }}
                className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> View Full Specifications, Reviews & Table of Contents →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
