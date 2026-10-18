import { useSiteContent } from '../lib/useSiteContent';
import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Search, RotateCcw, X, Grid, List } from 'lucide-react';
import { BookCard } from '../components/common/BookCard';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';
import { Book, BookFormat, BookLanguage } from '../types';

interface BooksPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectBook: (book: Book) => void;
  onQuickView: (book: Book) => void;
  initialCategorySlug?: string;
}

export const BooksPage: React.FC<BooksPageProps> = ({
  onNavigate,
  onSelectBook,
  onQuickView,
  initialCategorySlug = '',
}) => {
  const tx = useSiteContent();

  const c = useSiteContent();
  const { books, categories } = useBooks();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  // The price slider's ceiling follows the dearest book, so no book can ever be
  // hidden by the default filter (it used to be fixed at Rs 5000).
  const priceCeiling = useMemo(
    () => Math.max(5000, Math.ceil(Math.max(0, ...books.map(b => b.offerPrice || 0)) / 100) * 100),
    [books]
  );
  const [chosenMaxPrice, setChosenMaxPrice] = useState<number | null>(null);
  const maxPrice = chosenMaxPrice === null ? priceCeiling : Math.min(chosenMaxPrice, priceCeiling);
  const setMaxPrice = (v: number) => setChosenMaxPrice(v);
  const [sortBy, setSortBy] = useState<'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest'>('popularity');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMobileFilter, setShowMobileFilter] = useState<boolean>(false);

  // Filter logic
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (selectedCategory && b.categoryName.toLowerCase().replace(/\s+/g, '-') !== selectedCategory.toLowerCase()) {
        const cat = categories.find(c => c.slug === selectedCategory);
        if (cat && b.categoryId !== cat.id) return false;
      }
      if (selectedFormat && !b.formats.includes(selectedFormat as BookFormat)) return false;
      if (selectedLanguage && !b.languages.includes(selectedLanguage as BookLanguage)) return false;
      if (b.offerPrice > maxPrice) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.title.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          b.isbn.includes(q) ||
          (b.originalTitle && b.originalTitle.includes(q));
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.offerPrice - b.offerPrice;
      if (sortBy === 'price-high') return b.offerPrice - a.offerPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.reviewCount - a.reviewCount; // popularity
    });
  }, [books, categories, selectedCategory, selectedFormat, selectedLanguage, maxPrice, sortBy, searchQuery]);

  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedFormat('');
    setSelectedLanguage('');
    setChosenMaxPrice(null);
    setSearchQuery('');
    setSortBy('popularity');
  };

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: c('crumb.catalog'), onClick: () => onNavigate('books') },
            ...(selectedCategory ? [{ label: selectedCategory.replace(/-/g, ' ') }] : []),
          ]}
          onHomeClick={() => onNavigate('home')}
        />

        {/* Page Title */}
        <div className="my-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[color:var(--c-primary)] capitalize">
            {selectedCategory ? `${selectedCategory.replace(/-/g, ' ')} Scriptures` : 'Sacred Books Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-[color:var(--c-text-muted)] mt-1 font-medium">
            {tx('t.BooksPage.e22995fd')} {filteredBooks.length} {tx('t.BooksPage.0db06ea7')}
          </p>
        </div>

        {/* Control Bar: Search & Sort */}
        <div className="bg-[color:var(--c-surface)] p-4 rounded-2xl border border-[color:var(--c-accent)]/40 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={c('books.filter')}
              className="w-full pl-9 pr-4 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 rounded-xl text-xs text-[color:var(--c-text)] placeholder-[color:var(--c-text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
            />
            <Search className="w-4 h-4 text-[color:var(--c-primary)] absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[color:var(--c-accent)]/20 text-[color:var(--c-primary)] font-bold rounded-xl text-xs border border-[color:var(--c-accent)]/40"
            >
              <SlidersHorizontal className="w-4 h-4" /> {tx('t.BooksPage.78eea8d6')}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[color:var(--c-text-muted)] font-semibold hidden sm:inline">{c('books.sortBy')}</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
              >
                <option value="popularity">{c('books.sortPopular')}</option>
                <option value="price-low">{c('books.sortLow')}</option>
                <option value="price-high">{c('books.sortHigh')}</option>
                <option value="rating">{c('books.sortRated')}</option>
                <option value="newest">{c('books.sortNew')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className={`lg:block ${showMobileFilter ? 'block' : 'hidden'} space-y-6 bg-[color:var(--c-surface)] p-6 rounded-3xl border border-[color:var(--c-accent)]/40 shadow-sm h-fit`}>
            <div className="flex items-center justify-between pb-4 border-b border-[color:var(--c-accent)]/30">
              <h3 className="font-serif font-bold text-base text-[color:var(--c-primary)] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[color:var(--c-accent)]" /> {tx('t.BooksPage.0bf5db51')}
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs text-[color:var(--c-primary)] font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> {tx('t.BooksPage.ff65c6e6')}
              </button>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider mb-2">
                {c('books.fCategory')}
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    !selectedCategory ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text)] hover:bg-[color:var(--c-page)]'
                  }`}
                >
                  {tx('t.BooksPage.133178e9')}{books.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex justify-between ${
                      selectedCategory === cat.slug ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text)] hover:bg-[color:var(--c-page)]'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Filter */}
            <div className="pt-4 border-t border-[color:var(--c-accent)]/30">
              <label className="block text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider mb-2">
                {c('books.fFormat')}
              </label>
              <div className="space-y-1.5">
                {['', 'Hardcover', 'Paperback', 'PDF (E-Book)', 'Audiobook'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      selectedFormat === fmt ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text)] hover:bg-[color:var(--c-page)]'
                    }`}
                  >
                    {fmt || 'All Formats'}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="pt-4 border-t border-[color:var(--c-accent)]/30">
              <label className="block text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider mb-2">
                {c('books.fLanguage')}
              </label>
              <div className="space-y-1.5">
                {['', 'Sanskrit', 'Hindi', 'English'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      selectedLanguage === lang ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text)] hover:bg-[color:var(--c-page)]'
                    }`}
                  >
                    {lang || 'All Languages'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-[color:var(--c-accent)]/30">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[color:var(--c-primary)] uppercase tracking-wider">
                  {c('books.fPrice')}
                </label>
                <span className="text-xs font-extrabold text-[color:var(--c-primary)]">
                  ₹{maxPrice}
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={priceCeiling}
                step={100}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-[color:var(--c-page)] rounded-lg appearance-none cursor-pointer accent-[color:var(--c-primary)]"
              />
            </div>
          </aside>

          {/* Main Book Grid */}
          <main className="lg:col-span-3">
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onSelectBook={onSelectBook}
                    onQuickView={onQuickView}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-[color:var(--c-surface)] p-12 rounded-3xl text-center border border-[color:var(--c-accent)]/40 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-[color:var(--c-primary)]">
                  {c('books.noneTitle')}
                </h3>
                <p className="text-xs text-[color:var(--c-text-muted)] mt-1 mb-4">
                  {c('books.noneText')}
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] text-xs font-bold px-4 py-2 rounded-xl shadow border border-amber-200"
                >
                  {c('books.reset')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
