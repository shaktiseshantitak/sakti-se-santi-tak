import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { BookCard } from '../components/common/BookCard';
import { useCart } from '../context/CartContext';
import { useBooks } from '../context/BookContext';
import { Book } from '../types';

interface WishlistPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectBook: (book: Book) => void;
  onQuickView: (book: Book) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onNavigate,
  onSelectBook,
  onQuickView,
}) => {
  // FIXED: this used to destructure `wishlistIds`, a property that does not
  // exist on CartContext (the real field is `wishlistBookIds`). That made
  // `wishlistIds` always `undefined`, and `wishlistIds.includes(b.id)` below
  // threw a TypeError on every render — crashing the whole page to a blank
  // white screen instead of ever reaching the "Your wishlist is empty"
  // state that was already written further down in this file.
  const { wishlistBookIds } = useCart();
  const { books } = useBooks();

  const wishlistedBooks = books.filter(b => wishlistBookIds.includes(b.id));

  return (
    <div className="py-8 bg-[#FAF7F2] text-[#33231B] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Saved Wishlist' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl font-bold text-[#6B1D3A]">
            Saved Sacred Wishlist ({wishlistedBooks.length})
          </h1>
          <p className="text-xs text-[#6B5748] font-medium mt-1">
            Books you have saved for future study or gifts.
          </p>
        </div>

        {wishlistedBooks.length === 0 ? (
          <div className="bg-[#FFFCF7] p-12 rounded-3xl border border-[#B8923A]/40 text-center max-w-md mx-auto my-12 shadow-sm">
            <Heart className="w-16 h-16 text-[#B8923A] mx-auto mb-4" />
            <h2 className="font-serif text-lg font-bold text-[#6B1D3A]">
              Your wishlist is empty
            </h2>
            <p className="text-xs text-[#6B5748] font-medium mt-1 mb-6">
              Click the heart icon on any book card to save it here.
            </p>
            <button
              onClick={() => onNavigate('books')}
              className="bg-[#B8923A] hover:bg-amber-400 text-[#2B1B14] font-bold text-xs px-6 py-3 rounded-xl shadow border border-amber-200 transition-colors"
            >
              Explore Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onSelectBook={onSelectBook}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
