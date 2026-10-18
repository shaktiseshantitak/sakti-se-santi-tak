import { DEFAULT_SITE_SETTINGS } from '../../data/initialData';
import { useSiteContent } from '../../lib/useSiteContent';
import React, { useState, useRef, useEffect } from 'react';
import {
  Search, ShoppingBag, Heart, User, Sun, Moon, Menu, X,
  ShieldCheck, Sparkles, LogOut, ChevronDown, SlidersHorizontal, BookOpen, Layers, Radio, Video
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBooks } from '../../context/BookContext';
import { siteText } from '../../utils/siteText';
import { getSiteDomain, getBrandName } from '../../utils/siteDomain';
import { useLiveStream } from '../../context/LiveStreamContext';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';
import { Book } from '../../types';
import { MobileMenu } from './MobileMenu';

interface NavbarProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  currentPage: string;
  onOpenLiveStream?: () => void;
  onOpenLiveStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, onOpenLiveStream, onOpenLiveStudio }) => {
  const tx = useSiteContent();

  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart, wishlistBookIds, totalItemsCount, setIsCartOpen } = useCart();
  const { books, categories, siteSettings } = useBooks();
  const st = siteSettings?.siteTexts || {};
  const siteDomain = getSiteDomain(siteSettings);
  const brandName = getBrandName(siteSettings);
  const { isLive } = useLiveStream();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();


  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? books.filter(
        b =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (b.originalTitle && b.originalTitle.includes(searchQuery))
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleSelectSearchResult = (book: Book) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    handleNav('book-details', { bookSlug: book.slug });
  };

  const handleNav = (page: string, params?: Record<string, any>) => {
    setIsMobileMenuOpen(false);
    onNavigate(page, params);
  };

  const toggleSubmenu = (menuKey: string) => {
    setExpandedSubmenu(prev => (prev === menuKey ? null : menuKey));
  };

  return (
    <header className="sticky top-0 z-40 bg-[color:var(--c-header-bg)] text-[color:var(--c-header-text)] shadow-sm border-b border-[color:var(--c-accent)]/40 transition-colors duration-200">
      {/* Top Devotional Announcement Bar */}
      <div className="bg-[color:var(--c-strip-bg)] text-amber-100 px-2 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium overflow-hidden border-b border-[color:var(--c-accent)]/25">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
            {siteText(st.topBadge, 'Special') && (
              <span className="bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-black px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] uppercase shrink-0 shadow-xs">
                {siteText(st.topBadge, 'Special')}
              </span>
            )}
            <span className="truncate text-amber-100/95 font-medium">
              {siteSettings?.announcementText || `✨ Free Express Shipping on Sacred Scriptures above ₹${siteSettings?.freeShippingMinAmount || siteSettings?.freeShippingThreshold || 499} | 100% Verified Vedic Texts`}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[color:var(--c-accent-light)] shrink-0 text-xs font-medium">
            {(siteSettings?.supportPhone || siteSettings?.contactPhone) && (
              <span className="flex items-center gap-1 text-amber-200/90 text-[11px] font-semibold">
                📞 {siteText(st.helplineLabel, 'Helpline:')} {siteSettings.supportPhone || siteSettings.contactPhone}
              </span>
            )}
            <button
              onClick={() => onNavigate('track-order')}
              className="hover:text-white transition-colors"
            >
              {siteText(st.trackingLabel, 'Order Tracking')}
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-white transition-colors"
            >
              {siteText(st.helpLabel, 'Help & Support')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-4 w-full max-w-full overflow-hidden">
        {/* Mobile Menu Toggle Button — placed to the left, next to the
            brand logo, matching the requested reference layout (MLBD-style:
            hamburger + logo grouped on the left, cart/account on the right). */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls="mobile-navigation-drawer"
          className="md:hidden p-2 text-[color:var(--c-accent-light)] bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] rounded-xl border border-[color:var(--c-accent)]/40 flex items-center gap-1.5 font-bold text-xs shrink-0 active:scale-95 transition-all shadow-xs"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-[color:var(--c-accent-light)]" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5 text-[color:var(--c-accent-light)]" aria-hidden="true" />
          )}
        </button>

        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group shrink-0"
        >
          {/* admin's Logo
              URL upload (siteSettings.header.logoUrl) was saved but never
              read here — the ॐ symbol showed regardless of what the admin
              set. Now used when present, falling back to the original ॐ
              mark otherwise. */}
          {siteSettings.header?.logoUrl ? (
            <img
              src={siteSettings.header.logoUrl}
              alt={siteSettings.siteName || 'Logo'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform border border-amber-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[color:var(--c-accent)] text-[color:var(--c-primary-deep)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-amber-200 shrink-0">
              <span className="text-base sm:text-xl font-serif font-extrabold">{tx('t.Navbar.e53dd0fb')}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-serif font-bold text-sm sm:text-lg md:text-xl text-white tracking-tight whitespace-nowrap">
                {siteText(st.logoName, brandName)}
              </span>
              {siteText(st.logoChip, siteDomain) && (
                <span className="hidden xs:inline-block text-[color:var(--c-ink)] bg-[color:var(--c-accent-light)] text-[9px] sm:text-[10px] font-sans font-extrabold px-1.5 py-0.5 rounded border border-[color:var(--c-accent)] shrink-0">
                  {siteText(st.logoChip, siteDomain)}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-[color:var(--c-accent-light)] font-semibold block -mt-0.5 tracking-wider truncate max-w-[130px] sm:max-w-none">
              {siteText(st.logoSubtitle, (siteSettings?.siteTagline && siteSettings.siteTagline !== DEFAULT_SITE_SETTINGS.siteTagline) ? siteSettings.siteTagline : 'गायत्री एवं दुर्गा मंत्र का गुप्त रहस्य')}
            </span>
          </div>
        </div>

        {/* Live Search Bar (Desktop/Tablet) */}
        <div ref={searchRef} className="relative flex-1 max-w-lg hidden md:block" role="search">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder={siteText(st.searchPlaceholder, 'Search Bhagavad Gita, Ramayana, Upanishads, authors, ISBN...')}
              aria-label={tx('t.Navbar.7d13bbe8')}
              className="w-full pl-10 pr-4 py-2 bg-[color:var(--c-primary-deep)]/90 border border-[color:var(--c-accent)]/50 rounded-full text-sm text-white placeholder-amber-200/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-accent)] focus:bg-[color:var(--c-primary-darkest)] transition-all"
            />
            <Search className="w-4 h-4 text-[color:var(--c-accent-light)] absolute left-3.5 top-3" aria-hidden="true" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={tx('t.Navbar.d24fbfc4')}
                className="absolute right-3 top-2.5 text-amber-200 hover:text-white"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Autocomplete Overlay */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[color:var(--c-surface)] text-[color:var(--c-ink)] border border-[color:var(--c-accent)]/50 rounded-2xl shadow-sm overflow-hidden z-50 divide-y divide-amber-200/60">
              {searchResults.length > 0 ? (
                <>
                  <div className="p-2 text-xs font-semibold text-[color:var(--c-primary)] uppercase tracking-wider bg-amber-100/60 px-4">
                    {tx('t.Navbar.dc07eb37')}{searchResults.length})
                  </div>
                  {searchResults.map(b => (
                    <div
                      key={b.id}
                      onClick={() => handleSelectSearchResult(b)}
                      className="p-3 hover:bg-amber-100/80 cursor-pointer flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={b.coverImage}
                        alt={b.title}
                        className="w-9 h-12 object-cover rounded shadow-xs border border-[color:var(--c-accent)]/40"
                       loading="lazy" decoding="async" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-medium text-xs text-[color:var(--c-ink)] truncate">
                          {b.title}
                        </p>
                        <p className="text-[11px] text-[color:var(--c-text-muted)] truncate">
                          {tx('t.Navbar.47dfdb99')} {b.authorName} • {b.categoryName}
                        </p>
                      </div>
                      <span className="font-bold text-xs text-[color:var(--c-primary)] shrink-0">
                        ₹{b.offerPrice}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-6 text-center text-xs text-[color:var(--c-text-muted)]">
                  {tx('t.Navbar.c4d17912')}{searchQuery}{tx('t.Navbar.9f7b5f24')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Menu Items */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Live Stream / Satsang Button — hidden on the smallest screens;
              moved into the mobile hamburger menu instead (see
              MobileMenu.tsx). Previously this sat in the same row as 5 other
              buttons (language, theme, wishlist, cart, hamburger), which on
              a narrow phone screen left too little room for all of them —
              the hamburger menu (the most important one, since it's the
              only way to reach the rest of site navigation on mobile) would
              overflow or become hard to tap. Reference: competitor sites
              keep only 1-2 icons + the hamburger visible on mobile. */}
          {onOpenLiveStream && (
          <button
            onClick={onOpenLiveStream}
            className={`hidden md:flex p-1.5 sm:p-2 rounded-xl transition-all items-center gap-1 text-[11px] sm:text-xs font-bold shrink-0 ${
              isLive
                ? 'bg-amber-500 text-[color:var(--c-ink)] shadow-sm shadow-amber-500/30 animate-pulse'
                : 'text-amber-100 bg-[color:var(--c-primary-deep)] hover:bg-[color:var(--c-primary-darkest)] border border-[color:var(--c-accent)]/40'
            }`}
            title={tx('t.Navbar.de71f19b')}
            aria-label={tx('t.Navbar.de71f19b')}
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[color:var(--c-accent-light)]" aria-hidden="true" />
            <span className="hidden sm:inline">{isLive ? '🔴 LIVE' : 'सत्संग'}</span>
          </button>
          )}

          {/* Language Switcher — desktop only now, moved into mobile menu */}
          <button
            onClick={toggleLanguage}
            className="hidden md:flex px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold items-center gap-1 bg-[color:var(--c-accent)]/20 hover:bg-[color:var(--c-accent)]/30 text-[color:var(--c-accent-light)] border border-[color:var(--c-accent)]/40 transition-all active:scale-95 shrink-0"
            title={tx('t.Navbar.7bc77fcd')}
            aria-label={tx('t.Navbar.5c1c7ee2')}
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[color:var(--c-accent)] shrink-0" />
            <span>{language === 'hi' ? 'हिंदी|EN' : 'EN|हिंदी'}</span>
          </button>

          {/* Wishlist — desktop only now, moved into mobile menu */}
          <button
            onClick={() => onNavigate('wishlist')}
            className="hidden md:flex relative p-1.5 sm:p-2 rounded-xl text-amber-100 hover:bg-[color:var(--c-primary-deep)] transition-colors shrink-0"
            title={tx('t.Navbar.c4e4abc3')}
            aria-label={`Wishlist with ${wishlistBookIds.length} saved items`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            {wishlistBookIds.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[color:var(--c-accent)] text-[color:var(--c-ink)] font-extrabold text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow">
                {wishlistBookIds.length}
              </span>
            )}
          </button>

          {/* An "Open Admin" desktop-only shortcut button was
              shown to already-logged-in admins here. Removed per request — an
              admin can still reach the panel by navigating to /admin
              directly once authenticated. */}

          {/* Cart Drawer Trigger — always visible on mobile too, this is a
              standard expected e-commerce icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-1.5 sm:p-2 rounded-xl text-[color:var(--c-ink)] bg-[color:var(--c-accent)] hover:bg-amber-300 transition-colors flex items-center gap-1.5 shrink-0 font-bold shadow-sm"
            title={tx('t.Navbar.01b3fc2d')}
            aria-label={`Shopping cart with ${totalItemsCount} items`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[color:var(--c-ink)]" aria-hidden="true" />
            <span className="hidden sm:inline text-xs font-extrabold text-[color:var(--c-ink)]">
              {tx('t.Navbar.2cb4e07a')}
            </span>
            {totalItemsCount > 0 && (
              <span className="bg-[color:var(--c-primary)] text-amber-100 font-extrabold text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full shadow">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Bar (Desktop) */}
      <div className="hidden md:block bg-[color:var(--c-strip-bg)] border-t border-[color:var(--c-accent)]/30 py-2.5 text-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-x-auto text-xs font-semibold">
          <div className="flex items-center gap-5 overflow-x-auto shrink-0">
            <button
              onClick={() => handleNav('home')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'home' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              {tx('t.Navbar.ed065df5')}
            </button>

            <button
              onClick={() => handleNav('about')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'about' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              {tx('t.Navbar.b7370038')}
            </button>

            <button
              onClick={() => {
                const shaktiBook = books.find(b => b.id === 'book-shakti') || books[0];
                handleNav('book-details', { bookSlug: shaktiBook.slug });
              }}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'book-details' || currentPage === 'books' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              📖 {siteSettings.navLabels?.books || t('शक्ति से शांति (Books)', 'Shakti Se Shanti (Books)')}
            </button>

            <button
              onClick={() => handleNav('curiosity')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'curiosity' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              💡 {siteSettings.navLabels?.curiosity || t('जिज्ञासा व विज्ञान (Services)', 'Curiosity & Science (Services)')}
            </button>

            <button
              onClick={() => handleNav('gayatri-secrets')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'gayatri-secrets' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              🔮 {siteSettings.navLabels?.gayatriSecrets || t('गायत्री रहस्य (24 शक्तियां)', 'Gayatri Secrets (24 Powers)')}
            </button>

            <button
              onClick={() => handleNav('authors')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'authors' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              ✍️ {siteSettings.navLabels?.authors || t('लेखक परिचय', 'Meet the Authors')}
            </button>

            <button
              onClick={() => handleNav('gallery')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'gallery' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              🖼️ {siteSettings.navLabels?.gallery || t('गैलरी (Gallery)', 'Gallery')}
            </button>

            <button
              onClick={() => handleNav('reviews')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'reviews' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              💬 {siteSettings.navLabels?.reviews || t('पाठकों के अनुभव', "Readers' Experiences")}
            </button>

            <button
              onClick={() => handleNav('affiliate')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 font-bold ${
                currentPage === 'affiliate' ? 'text-[color:var(--c-accent-light)] underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : 'text-amber-200'
              }`}
            >
              {tx('t.Navbar.c2d5f11e')}
            </button>

            <button
              onClick={() => handleNav('contact')}
              className={`hover:text-[color:var(--c-accent-light)] transition-colors flex items-center gap-1 shrink-0 ${
                currentPage === 'contact' ? 'text-[color:var(--c-accent-light)] font-extrabold underline decoration-[color:var(--c-accent)] decoration-2 underline-offset-4' : ''
              }`}
            >
              {tx('t.Navbar.4b1f68a6')}
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold text-[color:var(--c-accent-light)]">
            <button
              onClick={() => handleNav(isAuthenticated ? 'customer-dashboard' : 'login')}
              className="px-2.5 py-1 bg-[color:var(--c-accent)]/20 hover:bg-[color:var(--c-accent)]/30 text-amber-200 rounded-lg border border-[color:var(--c-accent)]/40 font-bold transition-all flex items-center gap-1.5 text-[11px]"
            >
              <User className="w-3.5 h-3.5 text-[color:var(--c-accent)]" />
              <span>{isAuthenticated ? (user?.fullName || 'माई अकाउंट') : 'लॉगिन / रजिस्ट्रेशन'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Active Page Name Banner */}
      <div className="md:hidden bg-[color:var(--c-primary-darkest)] text-amber-200 px-4 py-1 text-[11px] font-bold flex items-center justify-between border-t border-[color:var(--c-accent)]/30">
        <span className="flex items-center gap-1">
          📍 {siteText(st.currentPageLabel, 'वर्तमान पेज:')} <span className="text-[color:var(--c-accent-light)] underline font-extrabold">{
            currentPage === 'home' ? 'मुख्य पृष्ठ (Home)' :
            currentPage === 'about' ? 'हमारे बारे में (About)' :
            currentPage === 'curiosity' ? 'जिज्ञासा एवं विज्ञान (Services)' :
            currentPage === 'gayatri-secrets' ? 'गायत्री रहस्य एवं 24 शक्तियां' :
            currentPage === 'authors' ? 'लेखक परिचय' :
            currentPage === 'reviews' ? 'पाठकों के अनुभव' :
            currentPage === 'gallery' ? 'गैलरी (Gallery)' :
            currentPage === 'books' ? 'ग्रंथ कैटलॉग (Books)' :
            currentPage === 'book-details' ? 'ग्रंथ विवरण (Book)' :
            currentPage === 'contact' ? 'संपर्क (Contact)' :
            currentPage === 'login' ? 'लॉगिन (Login)' :
            currentPage === 'customer-dashboard' ? 'माई अकाउंट' : currentPage
          }</span>
        </span>
        <span className="text-[10px] text-amber-300/80">{siteDomain}</span>
      </div>

      {/* Dedicated Mobile Menu Side Drawer Component */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={onNavigate}
        currentPage={currentPage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectSearchResult={handleSelectSearchResult}
        books={books}
        categories={categories}
        isAuthenticated={isAuthenticated}
        user={user}
        isAdmin={isAdmin}
        language={language}
        setLanguage={setLanguage}
        toggleLanguage={toggleLanguage}
        siteSettings={siteSettings}
        isLive={isLive}
        onOpenLiveStream={onOpenLiveStream}
        toggleTheme={toggleTheme}
        wishlistCount={wishlistBookIds.length}
      />
    </header>
  );
};
