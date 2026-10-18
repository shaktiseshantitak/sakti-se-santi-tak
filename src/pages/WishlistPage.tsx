import { useSiteContent } from '../lib/useSiteContent';
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
  const c = useSiteContent();
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
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: c('wishlist.breadcrumb') }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl font-bold text-[color:var(--c-primary)]">
            {c('wishlist.title')} ({wishlistedBooks.length})
          </h1>
          <p className="text-xs text-[color:var(--c-text-muted)] font-medium mt-1">
            {c('wishlist.subtitle')}
          </p>
        </div>

        {wishlistedBooks.length === 0 ? (
          <div className="bg-[color:var(--c-surface)] p-12 rounded-3xl border border-[color:var(--c-accent)]/40 text-center max-w-md mx-auto my-12 shadow-sm">
            <Heart className="w-16 h-16 text-[color:var(--c-accent)] mx-auto mb-4" />
            <h2 className="font-serif text-lg font-bold text-[color:var(--c-primary)]">
              {c('wishlist.emptyTitle')}
            </h2>
            <p className="text-xs text-[color:var(--c-text-muted)] font-medium mt-1 mb-6">
              {c('wishlist.emptyText')}
            </p>
            <button
              onClick={() => onNavigate('books')}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold text-xs px-6 py-3 rounded-xl shadow border border-amber-200 transition-colors"
            >
              {c('wishlist.explore')}
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
