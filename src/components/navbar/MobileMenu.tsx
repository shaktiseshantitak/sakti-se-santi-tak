import { useSiteContent } from '../../lib/useSiteContent';
import React, { useState, useEffect, useRef } from 'react';
import { cleanContentMap, resolveContent } from '../../utils/siteContent';
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
  const tx = useSiteContent();

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
      aria-label={tx('t.MobileMenu.08238f84')}
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
        className="relative z-10 w-full max-w-sm sm:w-80 h-full bg-[color:var(--c-surface)] text-[color:var(--c-ink)] shadow-2xl flex flex-col border-l-2 border-[color:var(--c-accent)] transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header Bar */}
        <div className="bg-[color:var(--c-primary)] text-amber-100 p-4 flex items-center justify-between border-b border-[color:var(--c-accent)]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[color:var(--c-primary-deep)] text-[color:var(--c-accent-light)] flex items-center justify-center font-bold text-sm border border-[color:var(--c-accent)]/40 shadow-xs">
              {tx('t.MobileMenu.6d29ab46')}
            </span>
            <div>
              <h2 className="font-serif font-extrabold text-base text-[color:var(--c-accent-light)] leading-tight">
                {tx('t.MobileMenu.6dd74267')}
              </h2>
              <p className="text-[10px] text-amber-200/90 font-medium">
                {resolveContent(cleanContentMap(siteSettings?.contentText), 'menu.title')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={tx('t.MobileMenu.a57ef455')}
            className="p-2 rounded-xl bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] text-[color:var(--c-accent-light)] border border-[color:var(--c-accent)]/40 active:scale-95 transition-all shadow-xs flex items-center justify-center"
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
                placeholder={tx('t.MobileMenu.df126542')}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-[color:var(--c-accent)]/60 rounded-xl text-xs text-[color:var(--c-ink)] placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)] shadow-xs"
              />
              <Search className="w-4 h-4 text-[color:var(--c-primary)] absolute left-3 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-amber-900/60 hover:text-[color:var(--c-primary)] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {searchQuery.trim().length > 0 && searchResults.length > 0 && (
              <div className="bg-white border border-[color:var(--c-accent)]/50 rounded-xl shadow-lg p-2 max-h-56 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold text-[color:var(--c-primary)] px-2 py-0.5 border-b border-amber-100">
                  {tx('t.MobileMenu.700c93ee')}{searchResults.length})
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
                      <p className="text-xs font-bold text-[color:var(--c-ink)] truncate">{book.title}</p>
                      <p className="text-[10px] text-[color:var(--c-text-muted)] truncate">{book.authorName}</p>
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
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold shadow-sm border border-[color:var(--c-primary)]'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                <span>{tx('t.MobileMenu.14f44328')}</span>
              </span>
              {currentPage === 'home' && (
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] px-2 py-0.5 rounded font-black">{tx('t.MobileMenu.b31ca523')}</span>
              )}
            </button>

            {/* 2. About */}
            <button
              onClick={() => handleNav('about')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'about'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold shadow-sm border border-[color:var(--c-primary)]'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                <span>{tx('t.MobileMenu.c98a8454')}</span>
              </span>
              {currentPage === 'about' && (
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] px-2 py-0.5 rounded font-black">{tx('t.MobileMenu.b31ca523')}</span>
              )}
            </button>

            {/* 3. Books Submenu */}
            <div className="rounded-xl border border-amber-200/80 overflow-hidden bg-white">
              <button
                onClick={() => toggleSubmenu('books')}
                className={`w-full text-left py-2.5 px-3 flex items-center justify-between transition-all ${
                  currentPage === 'books' || currentPage === 'book-details'
                    ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold'
                    : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                  <span>{tx('t.MobileMenu.2aaf4c51')}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSubmenu === 'books' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSubmenu === 'books' && (
                <div className="bg-amber-50/90 p-2 space-y-1 border-t border-amber-200/60 divide-y divide-amber-200/40">
                  <button
                    onClick={() => {
                      const shaktiBook = books.find(b => b.id === 'book-shakti') || books[0];
                      handleNav('book-details', { bookSlug: shaktiBook.slug });
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-bold text-[color:var(--c-primary)] hover:bg-amber-100 flex items-center justify-between transition-colors"
                  >
                    <span>{tx('t.MobileMenu.d47e9b39')}</span>
                    {(books.find(b => b.id === 'book-shakti') || books[0])?.offerPrice ? <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black px-1.5 py-0.5 rounded">₹{(books.find(b => b.id === 'book-shakti') || books[0]).offerPrice}</span> : null}
                  </button>
                  <button
                    onClick={() => handleNav('books')}
                    className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-semibold text-[color:var(--c-ink)] hover:bg-amber-100 flex items-center justify-between transition-colors"
                  >
                    <span>{tx('t.MobileMenu.4218b855')}</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Categories Expandable Submenu */}
            <div className="rounded-xl border border-amber-200/80 overflow-hidden bg-white">
              <button
                onClick={() => toggleSubmenu('categories')}
                className="w-full text-left py-2.5 px-3 flex items-center justify-between bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                  <span>{tx('t.MobileMenu.d51d8dd5')}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSubmenu === 'categories' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSubmenu === 'categories' && (
                <div className="bg-amber-50/90 p-2 space-y-1 border-t border-amber-200/60">
                  <button
                    onClick={() => handleNav('books')}
                    className="w-full text-left py-2 px-3 rounded-lg text-[11px] font-bold text-[color:var(--c-primary)] hover:bg-amber-100 flex items-center justify-between"
                  >
                    <span>{tx('t.MobileMenu.8efc4d9e')}</span>
                    <span>→</span>
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleNav('books', { categorySlug: cat.slug })}
                      className="w-full text-left py-1.5 px-3 rounded-lg text-[11px] font-medium text-[color:var(--c-ink)] hover:bg-amber-100 flex items-center justify-between transition-colors"
                    >
                      <span>• {cat.nameHindi || cat.name}</span>
                      <span className="text-[10px] text-[color:var(--c-text-muted)] bg-amber-100 px-1.5 py-0.2 rounded font-mono">
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
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold shadow-sm border border-[color:var(--c-primary)]'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                <span>{tx('t.MobileMenu.62ee50a0')}</span>
              </span>
              {currentPage === 'curiosity' && (
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] px-2 py-0.5 rounded font-black">{tx('t.MobileMenu.b31ca523')}</span>
              )}
            </button>

            {/* 6. Gallery */}
            <button
              onClick={() => handleNav('gallery')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'gallery'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold shadow-sm border border-[color:var(--c-primary)]'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <GalleryIcon className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                <span>{tx('t.MobileMenu.46f2d66e')}</span>
              </span>
              {currentPage === 'gallery' && (
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] px-2 py-0.5 rounded font-black">{tx('t.MobileMenu.b31ca523')}</span>
              )}
            </button>

            {/* 7. Contact */}
            <button
              onClick={() => handleNav('contact')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'contact'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold shadow-sm border border-[color:var(--c-primary)]'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                <span>{tx('t.MobileMenu.1193ebaf')}</span>
              </span>
              {currentPage === 'contact' && (
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] px-2 py-0.5 rounded font-black">{tx('t.MobileMenu.b31ca523')}</span>
              )}
            </button>

            {/* 8. Login / User Dashboard */}
            <button
              onClick={() => handleNav(isAuthenticated ? 'customer-dashboard' : 'login')}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'login' || currentPage === 'customer-dashboard'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold shadow-sm border border-[color:var(--c-primary)]'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[color:var(--c-primary)] shrink-0" />
                <span>
                  {isAuthenticated
                    ? `माई अकाउंट (${user?.fullName?.split(' ')[0] || 'User'})`
                    : 'लॉगिन / रजिस्ट्रेशन (Login)'}
                </span>
              </span>
              <span className="text-[10px] bg-amber-100 text-[color:var(--c-primary)] px-1.5 py-0.5 rounded border border-[color:var(--c-accent)]/30 font-bold">
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </span>
            </button>
          </div>

          {/* Secondary & Devotional Pages Section */}
          <div className="pt-3 space-y-1.5 text-xs font-semibold">
            <p className="text-[10px] font-extrabold text-[color:var(--c-primary)] uppercase tracking-wider px-1">
              {tx('t.MobileMenu.db11ae35')}
            </p>

            <button
              onClick={() => handleNav('gayatri-secrets')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'gayatri-secrets'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2">{tx('t.MobileMenu.517c975f')}</span>
              <span className="text-[10px] bg-amber-100 text-[color:var(--c-primary)] px-1.5 py-0.5 rounded border border-[color:var(--c-accent)]/30">{tx('t.MobileMenu.ac8c3ac2')}</span>
            </button>

            <button
              onClick={() => handleNav('authors')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'authors'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2">{tx('t.MobileMenu.aca95721')}</span>
              <span>→</span>
            </button>

            <button
              onClick={() => handleNav('reviews')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'reviews'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold'
                  : 'bg-white hover:bg-amber-100/70 text-[color:var(--c-ink)] border border-amber-200/80'
              }`}
            >
              <span className="flex items-center gap-2">{tx('t.MobileMenu.8baaec9a')}</span>
              <span className="text-[10px] font-bold text-[color:var(--c-primary)]">★ 4.98</span>
            </button>

            <button
              onClick={() => handleNav('affiliate')}
              className={`w-full text-left py-2 px-3 rounded-xl flex items-center justify-between transition-all ${
                currentPage === 'affiliate'
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold'
                  : 'bg-[color:var(--c-accent)]/20 hover:bg-[color:var(--c-accent)]/30 text-[color:var(--c-ink)] border border-[color:var(--c-accent)]/50'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">{tx('t.MobileMenu.35a38a57')}</span>
              <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black px-1.5 py-0.5 rounded">{tx('t.MobileMenu.191e5e32')}</span>
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
                <span className="text-[10px] bg-white text-red-700 px-1.5 py-0.5 rounded font-black">{tx('t.MobileMenu.5fed95d5')}</span>
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
                  ? 'bg-[color:var(--c-primary)] text-amber-100 font-extrabold'
                  : 'bg-[color:var(--c-surface)] hover:bg-[color:var(--c-page)] text-[color:var(--c-text)] border border-[color:var(--c-accent)]/40'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                <Heart className="w-4 h-4 text-[color:var(--c-primary)]" /> {tx('t.MobileMenu.90303247')}
              </span>
              {wishlistCount > 0 && (
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black px-1.5 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* removed here and in Navbar.tsx.
                Language switcher kept (and made functional — see
                LanguageContext.tsx). */}
            <button
              onClick={toggleLanguage}
              className="w-full py-2.5 px-3 rounded-xl bg-[color:var(--c-surface)] hover:bg-[color:var(--c-page)] text-[color:var(--c-text)] border border-[color:var(--c-accent)]/40 font-bold flex items-center justify-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-[color:var(--c-primary)]" />
              {language === 'hi' ? 'हिंदी | EN' : 'EN | हिंदी'}
            </button>

            {/* Same as Navbar.tsx — only show this to an already-authenticated
                admin; the public "Admin Portal Login" entry was removed. */}
            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className="w-full text-left py-2.5 px-3 bg-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-deep)] text-amber-100 font-extrabold rounded-xl mt-2 flex items-center justify-between shadow-sm border border-[color:var(--c-accent)]/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[color:var(--c-accent)]" />
                  <span>{tx('t.MobileMenu.16a0481a')}</span>
                </span>
                <span className="text-[10px] bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black px-2 py-0.5 rounded">
                  {tx('t.MobileMenu.7cce63a0')}
                </span>
              </button>
            )}
          </div>

          {/* Quick Contact Helpline Footer */}
          {(siteSettings?.supportPhone || siteSettings?.contactPhone) && (
            <div className="pt-3 pb-2 text-center">
              <a
                href={`tel:${siteSettings?.supportPhone || siteSettings?.contactPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-[color:var(--c-primary)] text-xs font-bold border border-[color:var(--c-accent)]/40 hover:bg-amber-200 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[color:var(--c-primary)]" />
                <span>{tx('t.MobileMenu.f65f6eb6')} {siteSettings.supportPhone || siteSettings.contactPhone}</span>
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
