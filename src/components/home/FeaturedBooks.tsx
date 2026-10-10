import React, { useState } from 'react';
import { BookCard } from '../common/BookCard';
import { Book } from '../../types';
import { ArrowRight, Sparkles, Award, Star } from 'lucide-react';

interface FeaturedBooksProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onQuickView: (book: Book) => void;
  onViewAllClick: () => void;
}

export const FeaturedBooks: React.FC<FeaturedBooksProps> = ({
  books,
  onSelectBook,
  onQuickView,
  onViewAllClick,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bestsellers' | 'new' | 'featured'>('bestsellers');

  const filteredBooks = books.filter(b => {
    if (activeTab === 'bestsellers') return b.isBestSeller;
    if (activeTab === 'new') return b.isNewRelease;
    if (activeTab === 'featured') return b.isFeatured;
    return true;
  }).slice(0, 8);

  return (
    <section className="py-16 bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest block mb-1">
              Curated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Featured Sacred Publications
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'bestsellers'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-amber-600'
              }`}
            >
              ★ Best Sellers
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'new'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-amber-600'
              }`}
            >
              New Releases
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'featured'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-amber-600'
              }`}
            >
              Collector Gold Editions
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-amber-600'
              }`}
            >
              All Titles
            </button>
          </div>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onSelectBook={onSelectBook}
              onQuickView={onQuickView}
            />
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={onViewAllClick}
            className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-amber-600 hover:bg-zinc-800 dark:hover:bg-amber-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            <span>Explore Complete Scripture Catalog ({books.length} Titles)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
