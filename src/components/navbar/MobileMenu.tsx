import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ChevronDown,
  Home,
  Info,
  BookOpen,
  Layers,
  Sparkles,
  Image as GalleryIcon,
  PhoneCall,
  User,
  Globe,
  ShieldCheck,
  Award,
  MessageSquare,
  Users,
  Video,
  Radio,
  ExternalLink,
  Sun,
  Heart
} from 'lucide-react';
import { Book, Category } from '../../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  currentPage: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Book[];
  onSelectSearchResult: (book: Book) => void;
  books: Book[];
  categories: Category[];
  isAuthenticated: boolean;
  user: any;
  isAdmin: boolean;
  language: 'hi' | 'en';
  setLanguage: (lang: 'hi' | 'en') => void;
  toggleLanguage: () => void;
  siteSettings?: any;
  isLive?: boolean;
  onOpenLiveStream?: () => void;
  toggleTheme: () => void;
  wishlistCount: number;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentPage,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
  books,
  categories,
  isAuthenticated,
  user,
  isAdmin,
  language,
  setLanguage,
  toggleLanguage,
  siteSettings,
  isLive,
  onOpenLiveStream,
  toggleTheme,
  wishlistCount,
}) => {
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNav = (page: string, params?: Record<string, any>) => {
    onClose();
    onNavigate(page, params);
  };

  const toggleSubmenu = (menuKey: string) => {
    setExpandedSubmenu(prev => (prev === menuKey ? null : menuKey));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 md:hidden flex justify-end transition-opacity duration-300 ease-in-out"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      {/* Dark Blurred Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side-Drawer Menu Content (Slides in from the right) */}
      <div
        ref={drawerRef}
        id="mobile-navigation-drawer"
        className="relative z-10 w-full max-w-sm sm:w-80 h-full bg-[#FFF8EE] text-[#3A1F0D] shadow-2xl flex flex-col border-l-2 border-[#D4AF37] transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header Bar */}
        <div className="bg-[#8B1E3F] text-amber-100 p-4 flex items-center justify-between border-b border-[#D4AF37]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#66122C] text-[#F4E285] flex items-center justify-center font-bold text-sm border border-[#D4AF37]/40 shadow-xs">
              ॐ
            </span>
            <div>
              <h2 className="font-serif font-extrabold text-base text-[#F4E285] leading-tight">
                शक्ति से शांति
              </h2>
              <p className="text-[10px] text-amber-200/90 font-medium">
                मुख्य नेविगेशन मेन्यू (Navigation)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-xl bg-[#66122C] hover:bg-[#500D20] text-[#F4E285] border border-[#D4AF37]/40 active:scale-95 transition-all shadow-xs flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-amber-200/60">

          {/* Search Box inside Mobile Drawer */}
          <div className="space-y-2 pt-1">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="पुस्तकें, उपनिषद, लेखक खोजें..."
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-[#D4AF37]/60 rounded-xl text-xs text-[#3A1F0D] placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] shadow-xs"
              />
              <Search className="w-4 h-4 text-[#8B1E3F] absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-amber-900/60 hover:text-[#8B1E3F] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {searchQuery.trim().length > 0 && searchResults.length > 0 && (
              <div className="bg-white border border-[#D4AF37]/50 rounded-xl shadow-lg p-2 max-h-56 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold text-[#8B1E3F] px-2 py-0.5 border-b border-amber-100">
                  खोज के परिणाम ({searchResults.length})
                </p>
                {searchResults.map(book => (
                  <button
                    key={book.id}
                    onClick={() => {
                      onSelectSearchResult(book);
                      onClose();
                    }}
                    className="w-full text-left p-1.5 hover:bg-amber-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-8 h-10 object-cover rounded shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#3A1F0D] truncate">{book.title}</p>
                      <p className="text-[10px] text-[#6E4E37] truncate">{book.authorName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Navigation Links */}
          <div className="pt-3 space-y-1.5 text-xs font-semibold">
            {/* 1. Home */}
            <button
              onClick={() => handleNav('home')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'home'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold shadow-sm border border-[#8B1E3F]'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                <span>मुख्य पृष्ठ (Home)</span>
              </span>
              {currentPage === 'home' && (
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] px-2 py-0.5 rounded font-black">Active</span>
              )}
            </button>

            {/* 2. About */}
            <button
              onClick={() => handleNav('about')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'about'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold shadow-sm border border-[#8B1E3F]'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                <span>हमारे बारे में (About Us)</span>
              </span>
              {currentPage === 'about' && (
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] px-2 py-0.5 rounded font-black">Active</span>
              )}
            </button>

            {/* 3. Books Submenu */}
            <div className="rounded-xl border border-amber-200/80 overflow-hidden bg-white">
              <button
                onClick={() => toggleSubmenu('books')}
                className={`w-full text-left py-2.5 px-3 flex items-center justify-between transition-all ${
                  currentPage === 'books' || currentPage === 'book-details'
                    ? 'bg-[#8B1E3F] text-amber-100 font-extrabold'
                    : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                  <span>ग्रंथ एवं पुस्तकें (Books)</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSubmenu === 'books' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSubmenu === 'books' && (
                <div className="bg-amber-50/90 p-2 space-y-1 border-t border-amber-200/60 divide-y divide-amber-200/40">
                  <button
                    onClick={() => {
                      const shaktiBook = books.find(b => b.id === 'book-shakti') || books[0];
                      handleNav('book-details', { bookId: shaktiBook.id });
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-bold text-[#8B1E3F] hover:bg-amber-100 flex items-center justify-between transition-colors"
                  >
                    <span>✨ शक्ति से शांति (मुख्य ग्रंथ)</span>
                    <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] font-black px-1.5 py-0.5 rounded">₹499</span>
                  </button>
                  <button
                    onClick={() => handleNav('books')}
                    className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-semibold text-[#3A1F0D] hover:bg-amber-100 flex items-center justify-between transition-colors"
                  >
                    <span>📚 सभी ग्रंथ कैटलॉग (All Books)</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Categories Expandable Submenu */}
            <div className="rounded-xl border border-amber-200/80 overflow-hidden bg-white">
              <button
                onClick={() => toggleSubmenu('categories')}
                className="w-full text-left py-2.5 px-3 flex items-center justify-between bg-white hover:bg-amber-100/70 text-[#3A1F0D] transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                  <span>विषयानुसार श्रेणियाँ (Categories)</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSubmenu === 'categories' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSubmenu === 'categories' && (
                <div className="bg-amber-50/90 p-2 space-y-1 border-t border-amber-200/60">
                  <button
                    onClick={() => handleNav('books')}
                    className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-bold text-[#8B1E3F] hover:bg-amber-100 flex items-center justify-between"
                  >
                    <span>🌐 सभी श्रेणियां (All Categories)</span>
                    <span>→</span>
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleNav('books', { categorySlug: cat.slug })}
                      className="w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium text-[#3A1F0D] hover:bg-amber-100 flex items-center justify-between transition-colors"
                    >
                      <span>• {cat.nameHindi || cat.name}</span>
                      <span className="text-[10px] text-[#6E4E37] bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                        {cat.bookCount || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Services / Curiosity */}
            <button
              onClick={() => handleNav('curiosity')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'curiosity'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold shadow-sm border border-[#8B1E3F]'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                <span>जिज्ञासा एवं विज्ञान (Services)</span>
              </span>
              {currentPage === 'curiosity' && (
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] px-2 py-0.5 rounded font-black">Active</span>
              )}
            </button>

            {/* 6. Gallery */}
            <button
              onClick={() => handleNav('gallery')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'gallery'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold shadow-sm border border-[#8B1E3F]'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <GalleryIcon className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                <span>गैलरी एवं फोटोस (Gallery)</span>
              </span>
              {currentPage === 'gallery' && (
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] px-2 py-0.5 rounded font-black">Active</span>
              )}
            </button>

            {/* 7. Contact */}
            <button
              onClick={() => handleNav('contact')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'contact'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold shadow-sm border border-[#8B1E3F]'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                <span>सहायता एवं संपर्क (Contact)</span>
              </span>
              {currentPage === 'contact' && (
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] px-2 py-0.5 rounded font-black">Active</span>
              )}
            </button>

            {/* 8. Login / User Dashboard */}
            <button
              onClick={() => handleNav(isAuthenticated ? 'customer-dashboard' : 'login')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'login' || currentPage === 'customer-dashboard'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold shadow-sm border border-[#8B1E3F]'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#8B1E3F] shrink-0" />
                <span>
                  {isAuthenticated
                    ? `माई अकाउंट (${user?.fullName?.split(' ')[0] || 'User'})`
                    : 'लॉगिन / रजिस्ट्रेशन (Login)'}
                </span>
              </span>
              <span className="text-[10px] bg-amber-100 text-[#8B1E3F] px-1.5 py-0.5 rounded border border-[#D4AF37]/30 font-bold">
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </span>
            </button>
          </div>

          {/* Secondary & Devotional Pages Section */}
          <div className="pt-3 space-y-1.5 text-xs font-semibold">
            <p className="text-[10px] font-extrabold text-[#8B1E3F] uppercase tracking-wider px-1">
              विशेष देवस्थान व पठन सामग्री
            </p>

            <button
              onClick={() => handleNav('gayatri-secrets')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'gayatri-secrets'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2">🔮 गायत्री रहस्य (24 शक्तियां)</span>
              <span className="text-[10px] bg-amber-100 text-[#8B1E3F] px-1.5 py-0.5 rounded border border-[#D4AF37]/30">वीडियो</span>
            </button>

            <button
              onClick={() => handleNav('authors')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'authors'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2">✍️ लेखक परिचय (Authors)</span>
              <span>→</span>
            </button>

            <button
              onClick={() => handleNav('reviews')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'reviews'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold'
                  : 'bg-white hover:bg-amber-100/70 text-[#3A1F0D] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2">💬 पाठकों की समीक्षाएं</span>
              <span className="text-[10px] font-bold text-[#8B1E3F]">★ 4.98</span>
            </button>

            <button
              onClick={() => handleNav('affiliate')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'affiliate'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold'
                  : 'bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#3A1F0D] border border-[#D4AF37]/50'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">🤝 अफ़िलिएट पार्टनर प्रोग्राम</span>
              <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] font-black px-1.5 py-0.5 rounded">3-Tier</span>
            </button>

            {onOpenLiveStream && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveStream();
                }}
                className="w-full text-left py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold flex items-center justify-between shadow-xs transition-all"
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                  <span>{isLive ? '🔴 लाइव सत्संग प्रसारण देखें' : 'सत्संग लाइव रूम'}</span>
                </span>
                <span className="text-[10px] bg-white text-red-700 px-1.5 py-0.5 rounded font-black">JOIN</span>
              </button>
            )}

            {/* Wishlist, Language, and Theme — previously only in the desktop
                navbar; on mobile they used to compete for space with the
                hamburger button itself, sometimes pushing it off-screen.
                Moved here so they're still reachable on mobile, just one tap
                further in. */}
            <button
              onClick={() => handleNav('wishlist')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'wishlist'
                  ? 'bg-[#8B1E3F] text-amber-100 font-extrabold'
                  : 'bg-[#FFF8EE] hover:bg-[#F8F4E8] text-[#4A2C17] border border-[#D4AF37]/40'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                <Heart className="w-4 h-4 text-[#8B1E3F]" /> मेरी विशलिस्ट (Wishlist)
              </span>
              {wishlistCount > 0 && (
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] font-black px-1.5 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* FIXED (2026-08-29 — "remove day/night theme toggle button,
                it serves no purpose"): removed here and in Navbar.tsx.
                Language switcher kept (and made functional — see
                LanguageContext.tsx). */}
            <button
              onClick={toggleLanguage}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FFF8EE] hover:bg-[#F8F4E8] text-[#4A2C17] border border-[#D4AF37]/40 font-bold flex items-center justify-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-[#8B1E3F]" />
              {language === 'hi' ? 'हिंदी | EN' : 'EN | हिंदी'}
            </button>

            {/* Same as Navbar.tsx — only show this to an already-authenticated
                admin; the public "Admin Portal Login" entry was removed. */}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className="w-full text-left py-2.5 px-3 bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-extrabold rounded-xl mt-2 flex items-center justify-between shadow-sm border border-[#D4AF37]/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>एडमिन मैनेजमेंट (Active)</span>
                </span>
                <span className="text-[10px] bg-[#D4AF37] text-[#3A1F0D] font-black px-2 py-0.5 rounded">
                  Open →
                </span>
              </button>
            )}
          </div>

          {/* Quick Contact Helpline Footer */}
          {(siteSettings?.supportPhone || siteSettings?.contactPhone) && (
            <div className="pt-3 pb-2 text-center">
              <a
                href={`tel:${siteSettings?.supportPhone || siteSettings?.contactPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-[#8B1E3F] text-xs font-bold border border-[#D4AF37]/40 hover:bg-amber-200 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#8B1E3F]" />
                <span>हेल्पलाइन: {siteSettings.supportPhone || siteSettings.contactPhone}</span>
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
