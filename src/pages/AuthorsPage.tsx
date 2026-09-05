import React from 'react';
import { User, BookOpen, MapPin, Award } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { ShaktiAuthorsSection } from '../components/home/ShaktiAuthorsSection';
import { useBooks } from '../context/BookContext';
import { useCart } from '../context/CartContext';
import { Book } from '../types';

interface AuthorsPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const AuthorsPage: React.FC<AuthorsPageProps> = ({ onNavigate }) => {
  const { authors, books } = useBooks();
  const { addToCart } = useCart();
  const shaktiBook = books.find(b => b.id === 'book-shakti') || books[0];

  const handleBuyNow = (bookToBuy?: Book) => {
    const targetBook = bookToBuy || shaktiBook;
    addToCart(targetBook, 'Hardcover', targetBook.languages[0] || 'Hindi', 1);
    onNavigate('checkout', { directBook: targetBook });
  };

  return (
    <div className="bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <ShaktiAuthorsSection onBuyNow={handleBuyNow} shaktiBook={shaktiBook} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs items={[{ label: 'Revered Authors & Translators' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#8B1E3F]">
            वैदिक आचार्य एवं धर्म मनीषी (All Revered Acharyas)
          </h1>
          <p className="text-xs sm:text-sm text-[#6E4E37] mt-1 font-medium">
            Meet the Sanskrit linguists, traditional commentators, and Vedantic acharyas behind our publications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {authors.map(author => {
            const authorBooks = books.filter(b => b.authorId === author.id);
            return (
              <div
                key={author.id}
                className="bg-[#FFF8EE] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/40 shadow-sm flex flex-col sm:flex-row gap-6"
              >
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-[#D4AF37] shrink-0"
                 loading="lazy" decoding="async" />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#8B1E3F]">
                      {author.role}
                    </span>
                    <h3 className="font-serif font-bold text-xl text-[#8B1E3F] mt-0.5">
                      {author.name}
                    </h3>
                    <p className="text-xs text-[#6E4E37] flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {author.location}
                    </p>
                    <p className="text-xs text-[#4A2C17] mt-3 line-clamp-3 leading-relaxed">
                      {author.bio}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D4AF37]/30 flex items-center justify-between text-xs font-bold text-[#8B1E3F]">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-[#D4AF37]" /> {authorBooks.length} Publications
                    </span>
                    <button
                      onClick={() => onNavigate('books')}
                      className="hover:underline"
                    >
                      View Catalog →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
