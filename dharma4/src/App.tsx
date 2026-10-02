import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookProvider, useBooks } from './context/BookContext';
import { CartProvider, useCart } from './context/CartContext';
import { LiveStreamProvider, useLiveStream } from './context/LiveStreamContext';
import { LanguageProvider } from './context/LanguageContext';
import { AffiliateProvider } from './context/AffiliateContext';
import { Navbar } from './components/navbar/Navbar';
import { Footer } from './components/footer/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickViewModal } from './components/common/QuickViewModal';
import { LiveStreamBanner } from './components/livestream/LiveStreamBanner';
import { LiveStreamPlayerModal } from './components/livestream/LiveStreamPlayerModal';
import { LiveStreamStudioModal } from './components/livestream/LiveStreamStudioModal';
import { SeoHead } from './components/common/SeoHead';
import { TopProgressBar, OmMandalaLoader } from './components/common/PageTransitionLoader';

// Eager HomePage import for fast first paint
import { HomePage } from './pages/HomePage';

// Lazy loaded page components for optimal bundle splitting
const CuriosityPage = lazy(() => import('./pages/CuriosityPage').then(m => ({ default: m.CuriosityPage })));
const GayatriSecretsPage = lazy(() => import('./pages/GayatriSecretsPage').then(m => ({ default: m.GayatriSecretsPage })));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const BooksPage = lazy(() => import('./pages/BooksPage').then(m => ({ default: m.BooksPage })));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage').then(m => ({ default: m.BookDetailsPage })));
const AuthorsPage = lazy(() => import('./pages/AuthorsPage').then(m => ({ default: m.AuthorsPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const FaqPage = lazy(() => import('./pages/FaqPage').then(m => ({ default: m.FaqPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const CustomerDashboardPage = lazy(() => import('./pages/CustomerDashboardPage').then(m => ({ default: m.CustomerDashboardPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const EmailConfirmedPage = lazy(() => import('./pages/EmailConfirmedPage').then(m => ({ default: m.EmailConfirmedPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage').then(m => ({ default: m.PoliciesPage })));
const SitemapPage = lazy(() => import('./pages/SitemapPage').then(m => ({ default: m.SitemapPage })));
const CustomPageViewer = lazy(() => import('./pages/CustomPageViewer').then(m => ({ default: m.CustomPageViewer })));
const EnterpriseCmsInjector = lazy(() => import('./components/common/EnterpriseCmsInjector').then(m => ({ default: m.EnterpriseCmsInjector })));

import { Book, BlogPost, LiveStream } from './types';

const PageFallback = () => <OmMandalaLoader />;

// Real URL path <-> in-app page-name mapping, kept at module scope since it's
// static (doesn't depend on any component state/props). See the note in
// MainAppContent for why this exists.
const PATH_TO_PAGE: Record<string, string> = {
  '/': 'home',
  '/books': 'books',
  '/authors': 'authors',
  '/blog': 'blog',
  '/gallery': 'gallery',
  '/faq': 'faq',
  '/about': 'about',
  '/contact': 'contact',
  '/wishlist': 'wishlist',
  '/cart': 'cart',
  '/checkout': 'checkout',
  '/track-order': 'track-order',
  '/login': 'login',
  '/signup': 'signup',
  '/register': 'register',
  '/dashboard': 'dashboard',
  '/affiliate': 'affiliate',
  '/affiliates': 'affiliates',
  '/reset-password': 'reset-password',
  '/email-confirmed': 'email-confirmed',
  '/reviews': 'reviews',
  '/curiosity': 'curiosity',
  '/gayatri-secrets': 'gayatri-secrets',
  '/sitemap': 'sitemap',
  '/privacy-policy': 'privacy-policy',
  '/terms': 'terms',
  '/shipping-policy': 'shipping-policy',
  '/return-policy': 'return-policy',
  '/admin': 'admin',
  // A deliberately unlisted, non-obvious path — not linked from anywhere in
  // the public UI (see Navbar/MobileMenu/Footer changes) — replacing the
  // old publicly-visible "Admin" nav link.
  '/admin/login-user/gaytri': 'admin-login',
};
const PAGE_TO_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(PATH_TO_PAGE).map(([path, page]) => [page, path])
);

const MainAppContent: React.FC = () => {
  const { books, blogs } = useBooks();
  const { sessionTimedOut, clearSessionTimedOut, isAdmin, isAuthLoading } = useAuth();
  // NOTE: referral-click tracking is already handled inside AffiliateContext's own
  // useEffect (it reads ?ref=/?aff= itself via AffiliateService.handleReferralClick).
  // This component used to also destructure `recordReferralClick` from useAffiliate()
  // and call it here — but no such function was ever exported from AffiliateContext,
  // so this was `undefined(refCode)`, throwing a TypeError inside useEffect for every
  // single visitor who arrived via an affiliate referral link (`?ref=CODE`) — i.e. a
  // guaranteed runtime crash on the exact entry point the whole affiliate program
  // depends on. Removed the dead, broken duplicate call.

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [quickViewBook, setQuickViewBook] = useState<Book | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);

  // Live Stream Modals State
  const [isLivePlayerOpen, setIsLivePlayerOpen] = useState<boolean>(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState<boolean>(false);
  const [selectedStreamForPlayer, setSelectedStreamForPlayer] = useState<LiveStream | null>(null);
  const [showIdleLogoutBanner, setShowIdleLogoutBanner] = useState<boolean>(false);
  // isPageTransitioning flips true the instant handleNavigate() runs and
  // false a short beat after the destination page has mounted, driving
  // TopProgressBar below. Suspense's fallback only covers the case where a
  // lazy page's JS chunk is still downloading; this covers every single
  // navigation, including ones where the chunk is already cached and
  // Suspense never engages at all — which was the majority of clicks.
  const [isPageTransitioning, setIsPageTransitioning] = useState<boolean>(false);

  // NOTE: this app previously had NO real URL routing at all — `currentPage`
  // was pure in-memory React state, always starting at 'home' regardless of
  // what was typed in the browser's address bar. That meant a URL like
  // /admin-login or /track-order (referenced elsewhere, including in earlier
  // deployment docs) never actually worked by itself — visiting it directly
  // just loaded the home page. It also meant Supabase's password-reset email
  // link (which redirects to a real URL) had nowhere real to land, and there
  // was no way to give the admin login page its own private, unlisted URL
  // (a real bug report: admin login was publicly linked in the navbar/footer
  // for anyone to find). This syncs page state with the browser's address
  // bar and back/forward buttons, using the path map defined above.
  // FIXED (2026-09-26 — "SEO dummy hai"): 'book-details' and 'blog-post'
  // were never in PATH_TO_PAGE, so handleNavigate's `PAGE_TO_PATH[page]`
  // lookup came back undefined for every book/blog and pushState never ran
  // — every book/blog silently shared whatever URL was already in the
  // address bar. That meant no book/blog page could ever be bookmarked,
  // refreshed, shared, or crawled on its own URL, which is the real root
  // cause behind the site's meta tags/canonical/sitemap entries (all of
  // which reference /book/:slug and /blog/:slug) never actually working.
  // resolvePath below is the single source of truth for turning a path
  // into {page, params} — used on first load and on back/forward so the
  // two can't drift out of sync with each other.
  const resolvePath = (path: string): { page: string; params: Record<string, any> } => {
    if (path.startsWith('/book/')) {
      return { page: 'book-details', params: { bookSlug: decodeURIComponent(path.slice('/book/'.length)) } };
    }
    if (path.startsWith('/blog/')) {
      return { page: 'blog-post', params: { blogSlug: decodeURIComponent(path.slice('/blog/'.length)) } };
    }
    if (path.startsWith('/pages/')) {
      // custom-page slugs (e.g. 'page-diwali-offer-abc123') were
      // never part of the static PATH_TO_PAGE map, so pushState never ran
      // for them — the content changed but the URL never did, and a
      // custom page's own URL never worked on refresh/share/back-button.
      return { page: path.replace('/pages/', ''), params: {} };
    }
    return { page: PATH_TO_PAGE[path] || 'home', params: {} };
  };

  useEffect(() => {
    const initial = resolvePath(window.location.pathname);
    setCurrentPage(initial.page);
    setPageParams(initial.params);

    const handlePopState = () => {
      const resolved = resolvePath(window.location.pathname);
      setCurrentPage(resolved.page);
      setPageParams(resolved.params);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Resolves selectedBook/selectedBlog from a /book/:slug or /blog/:slug
  // URL (direct visit, refresh, or back/forward) once the catalog has
  // loaded from Supabase — pageParams.bookSlug/blogSlug is set by
  // resolvePath above before `books`/`blogs` are necessarily populated yet.
  useEffect(() => {
    if (pageParams.bookSlug && books.length > 0) {
      const match = books.find(b => b.slug === pageParams.bookSlug);
      if (match) setSelectedBook(match);
    }
  }, [pageParams.bookSlug, books]);

  useEffect(() => {
    if (pageParams.blogSlug && blogs.length > 0) {
      const match = blogs.find(b => b.slug === pageParams.blogSlug);
      if (match) setSelectedBlog(match);
    }
  }, [pageParams.blogSlug, blogs]);

  // AuthContext's idle timer signs the
  // person out after 15 minutes of no activity, but silently landing on a
  // login form with zero explanation is confusing — they'd assume
  // something broke. This sends them to /login with a clear "you were
  // logged out due to inactivity" banner instead.
  useEffect(() => {
    if (sessionTimedOut) {
      handleNavigate('login');
      clearSessionTimedOut();
      setShowIdleLogoutBanner(true);
      window.setTimeout(() => setShowIdleLogoutBanner(false), 8000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTimedOut]);

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    if (page !== currentPage) {
      setIsPageTransitioning(true);
    }
    setCurrentPage(page);
    setPageParams(params);
    const path = page.startsWith('page-')
      ? `/pages/${page}`
      : page === 'book-details' && params.bookSlug
        ? `/book/${encodeURIComponent(params.bookSlug)}`
        : page === 'blog-post' && params.blogSlug
          ? `/blog/${encodeURIComponent(params.blogSlug)}`
          : PAGE_TO_PATH[page];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clears the transitioning flag a short beat after the target page has
  // mounted — long enough to read as a deliberate, on-brand transition
  // rather than a flicker, short enough not to feel like a fake delay.
  useEffect(() => {
    const t = window.setTimeout(() => setIsPageTransitioning(false), 450);
    return () => window.clearTimeout(t);
  }, [currentPage]);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    // book.slug passed straight through (not read back off state) since
    // setSelectedBook above hasn't committed yet in this same handler —
    // reading `selectedBook` here would still see the previous value.
    handleNavigate('book-details', { bookSlug: book.slug });
  };

  const handleSelectBlog = (blog: BlogPost) => {
    setSelectedBlog(blog);
    handleNavigate('blog-post', { blogSlug: blog.slug });
  };

  const handleOpenLivePlayer = (stream?: LiveStream) => {
    if (stream) setSelectedStreamForPlayer(stream);
    else setSelectedStreamForPlayer(null);
    setIsLivePlayerOpen(true);
  };

  const handleOpenLiveStudio = () => {
    setIsLiveStudioOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500 selection:text-white transition-colors">
      {/* Instant feedback on every navigation click — see isPageTransitioning */}
      <TopProgressBar active={isPageTransitioning} />

      {/* Inbuilt SEO & Head Manager */}
      <SeoHead
        currentPage={currentPage}
        currentBook={currentPage === 'book-details' ? (selectedBook || books[0]) : null}
        currentBlog={currentPage === 'blog-post' ? (selectedBlog || blogs[0]) : null}
      />

      {/* Idle-timeout auto-logout notice */}
      {showIdleLogoutBanner && (
        <div className="bg-[#8B1E3F] text-white text-xs sm:text-sm font-medium text-center py-2.5 px-4">
          You were logged out due to 15 minutes of inactivity, for your account's security. Please log in again.
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onNavigate={handleNavigate}
        onOpenLiveStream={() => handleOpenLivePlayer()}
        onOpenLiveStudio={handleOpenLiveStudio}
      />

      {/* Persistent Live Stream Top Banner */}
      <LiveStreamBanner onWatchLive={() => handleOpenLivePlayer()} />

      {/* Main Page Routing */}
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onQuickView={book => setQuickViewBook(book)}
              onSelectBlog={handleSelectBlog}
              onOpenLiveStream={handleOpenLivePlayer}
            />
          )}

          {currentPage === 'curiosity' && (
            <CuriosityPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'gayatri-secrets' && (
            <GayatriSecretsPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'reviews' && (
            <ReviewsPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'books' && (
            <BooksPage
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onQuickView={book => setQuickViewBook(book)}
              initialCategorySlug={pageParams.categorySlug || ''}
            />
          )}

          {currentPage === 'book-details' && (selectedBook || books[0]) && (
            <BookDetailsPage
              book={selectedBook || books[0]}
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onQuickView={book => setQuickViewBook(book)}
            />
          )}

          {currentPage === 'authors' && <AuthorsPage onNavigate={handleNavigate} />}

          {currentPage === 'blog' && (
            <BlogPage onNavigate={handleNavigate} onSelectBlog={handleSelectBlog} />
          )}

          {currentPage === 'blog-post' && (selectedBlog || blogs[0]) && (
            <BlogPostPage blog={selectedBlog || blogs[0]} onNavigate={handleNavigate} />
          )}

          {currentPage === 'gallery' && <GalleryPage onNavigate={handleNavigate} />}

          {currentPage === 'faq' && <FaqPage onNavigate={handleNavigate} />}

          {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}

          {currentPage === 'contact' && <ContactPage onNavigate={handleNavigate} />}

          {currentPage === 'wishlist' && (
            <WishlistPage
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onQuickView={book => setQuickViewBook(book)}
            />
          )}

          {currentPage === 'cart' && <CartPage onNavigate={handleNavigate} />}

          {currentPage === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}

          {currentPage === 'order-success' && (
            <OrderSuccessPage orderId={pageParams.orderId || ''} onNavigate={handleNavigate} />
          )}

          {currentPage === 'track-order' && (
            <OrderTrackingPage
              initialTrackingNumber={pageParams.trackingNumber || ''}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'dashboard' && <CustomerDashboardPage onNavigate={handleNavigate} initialTab={pageParams.tab || 'orders'} />}
          {(currentPage === 'affiliate' || currentPage === 'affiliates') && <CustomerDashboardPage onNavigate={handleNavigate} initialTab="affiliate" />}

          {/* 'admin-login' used to
              redirect (pushState) to 'admin' the moment OTP succeeded —
              meaning the URL bar visibly changed from the secret path to
              the guessable /admin the instant login finished. Now both
              render at the exact same secret URL, with no navigation
              between them at all: AdminLoginPage shows while !isAdmin,
              AdminPage takes over the instant isAdmin flips true — same
              URL throughout, refresh included. The public /admin path
              still exists as a fallback (AdminPage's own guard silently
              sends a non-admin visitor home from there, unchanged), but
              the real flow never needs to visit it. */}
          {currentPage === 'admin' && <AdminPage onNavigate={handleNavigate} onOpenLiveStudio={handleOpenLiveStudio} />}
          {/* on every refresh at the secret admin-login URL,
              `isAdmin` STARTS false (the real Supabase session hasn't
              been re-verified yet — that's async) and only flips true a
              moment later once it resolves. This branch used to decide
              AdminPage-vs-AdminLoginPage on that still-loading `isAdmin`
              value with no gate at all, so an already-logged-in admin
              saw a real flash of the login form (looked like "logged
              out") immediately replaced by the admin panel the instant
              the session check finished (looked like "auto login") —
              on every single refresh. AdminPage.tsx already had this
              exact isAuthLoading gate (see its own 2026-08-30 fix note)
              for the public /admin path; this route just never got the
              same treatment. Now shows a brief spinner instead of ever
              rendering the wrong screen. */}
          {currentPage === 'admin-login' && (
            isAuthLoading
              ? (
                <div className="py-24 flex items-center justify-center bg-[#F8F4E8] min-h-screen">
                  <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                </div>
              )
              : isAdmin
                ? <AdminPage onNavigate={handleNavigate} onOpenLiveStudio={handleOpenLiveStudio} />
                : <AdminLoginPage onNavigate={handleNavigate} />
          )}
          {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
          {currentPage === 'reset-password' && <ResetPasswordPage onNavigate={handleNavigate} />}
          {currentPage === 'email-confirmed' && <EmailConfirmedPage onNavigate={handleNavigate} />}
          {(currentPage === 'signup' || currentPage === 'register') && <SignUpPage onNavigate={handleNavigate} />}

          {currentPage === 'privacy-policy' && <PoliciesPage type="privacy" onNavigate={handleNavigate} />}
          {currentPage === 'terms' && <PoliciesPage type="terms" onNavigate={handleNavigate} />}
          {currentPage === 'shipping-policy' && <PoliciesPage type="shipping" onNavigate={handleNavigate} />}
          {currentPage === 'return-policy' && <PoliciesPage type="return" onNavigate={handleNavigate} />}

          {currentPage === 'sitemap' && <SitemapPage onNavigate={handleNavigate} />}
          {currentPage.startsWith('page-') && <CustomPageViewer pageSlug={currentPage} onNavigate={handleNavigate} />}
        </Suspense>
      </main>

      {/* Enterprise Dynamic CMS Theme, CSS, JS & Popups Injector */}
      <Suspense fallback={null}>
        <EnterpriseCmsInjector onNavigate={handleNavigate} />
      </Suspense>

      {/* Global Slide-Over Cart Drawer */}
      <CartDrawer onProceedToCheckout={() => handleNavigate('checkout')} />

      {/* Quick View Modal */}
      {quickViewBook && (
        <QuickViewModal
          book={quickViewBook}
          onClose={() => setQuickViewBook(null)}
          onViewFullDetails={book => {
            setQuickViewBook(null);
            handleSelectBook(book);
          }}
        />
      )}

      {/* Live Stream Player Modal */}
      {isLivePlayerOpen && (
        <LiveStreamPlayerModal
          onClose={() => setIsLivePlayerOpen(false)}
          selectedStream={selectedStreamForPlayer}
        />
      )}

      {/* Admin Live Studio Modal */}
      {isLiveStudioOpen && (
        <LiveStreamStudioModal
          onClose={() => setIsLiveStudioOpen(false)}
        />
      )}

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AffiliateProvider>
            <BookProvider>
              <CartProvider>
                <LiveStreamProvider>
                  <MainAppContent />
                </LiveStreamProvider>
              </CartProvider>
            </BookProvider>
          </AffiliateProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

