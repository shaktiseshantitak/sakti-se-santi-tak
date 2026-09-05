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
  const { books, categories } = useBooks();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
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
    setMaxPrice(5000);
    setSearchQuery('');
    setSortBy('popularity');
  };

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Books Catalog', onClick: () => onNavigate('books') },
            ...(selectedCategory ? [{ label: selectedCategory.replace(/-/g, ' ') }] : []),
          ]}
          onHomeClick={() => onNavigate('home')}
        />

        {/* Page Title */}
        <div className="my-6">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F] capitalize">
            {selectedCategory ? `${selectedCategory.replace(/-/g, ' ')} Scriptures` : 'Sacred Books Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6E4E37] mt-1 font-medium">
            Browse {filteredBooks.length} authentic scripture editions with word-by-word meanings and commentaries.
          </p>
        </div>

        {/* Control Bar: Search & Sort */}
        <div className="bg-[#FFF8EE] p-4 rounded-2xl border border-[#D4AF37]/40 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by title, author, or verse..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-xs text-[#4A2C17] placeholder-[#6E4E37]/60 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
            />
            <Search className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#D4AF37]/20 text-[#8B1E3F] font-bold rounded-xl text-xs border border-[#D4AF37]/40"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#6E4E37] font-semibold hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              >
                <option value="popularity">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className={`lg:block ${showMobileFilter ? 'block' : 'hidden'} space-y-6 bg-[#FFF8EE] p-6 rounded-3xl border border-[#D4AF37]/40 shadow-sm h-fit`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30">
              <h3 className="font-serif font-bold text-base text-[#8B1E3F] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#D4AF37]" /> Filter Scriptures
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs text-[#8B1E3F] font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold text-[#8B1E3F] uppercase tracking-wider mb-2">
                Category
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    !selectedCategory ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#4A2C17] hover:bg-[#F8F4E8]'
                  }`}
                >
                  All Categories ({books.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex justify-between ${
                      selectedCategory === cat.slug ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#4A2C17] hover:bg-[#F8F4E8]'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Filter */}
            <div className="pt-4 border-t border-[#D4AF37]/30">
              <label className="block text-xs font-bold text-[#8B1E3F] uppercase tracking-wider mb-2">
                Format
              </label>
              <div className="space-y-1.5">
                {['', 'Hardcover', 'Paperback', 'PDF (E-Book)', 'Audiobook'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      selectedFormat === fmt ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#4A2C17] hover:bg-[#F8F4E8]'
                    }`}
                  >
                    {fmt || 'All Formats'}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Filter */}
            <div className="pt-4 border-t border-[#D4AF37]/30">
              <label className="block text-xs font-bold text-[#8B1E3F] uppercase tracking-wider mb-2">
                Language
              </label>
              <div className="space-y-1.5">
                {['', 'Sanskrit', 'Hindi', 'English'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                      selectedLanguage === lang ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#4A2C17] hover:bg-[#F8F4E8]'
                    }`}
                  >
                    {lang || 'All Languages'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-4 border-t border-[#D4AF37]/30">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#8B1E3F] uppercase tracking-wider">
                  Max Price
                </label>
                <span className="text-xs font-extrabold text-[#8B1E3F]">
                  ₹{maxPrice}
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={5000}
                step={100}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-[#F8F4E8] rounded-lg appearance-none cursor-pointer accent-[#8B1E3F]"
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
              <div className="bg-[#FFF8EE] p-12 rounded-3xl text-center border border-[#D4AF37]/40 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-[#8B1E3F]">
                  No books match your current filters
                </h3>
                <p className="text-xs text-[#6E4E37] mt-1 mb-4">
                  Try adjusting your price slider or resetting category filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] text-xs font-bold px-4 py-2 rounded-xl shadow border border-amber-200"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
