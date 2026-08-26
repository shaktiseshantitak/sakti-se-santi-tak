import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
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

const PageFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#F8F4E8] text-[#8B1E3F]">
    <div className="w-10 h-10 border-3 border-[#D4AF37]/30 border-t-[#8B1E3F] rounded-full animate-spin mb-4" />
    <span className="font-serif font-bold text-sm tracking-widest text-[#4A2C17]">सामग्री लोड हो रही है...</span>
  </div>
);

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
  useEffect(() => {
    const initialPath = window.location.pathname;
    const mappedPage = PATH_TO_PAGE[initialPath];
    if (mappedPage) {
      setCurrentPage(mappedPage);
    }

    const handlePopState = () => {
      const page = PATH_TO_PAGE[window.location.pathname] || 'home';
      setCurrentPage(page);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    const path = PAGE_TO_PATH[page];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    handleNavigate('book-details');
  };

  const handleSelectBlog = (blog: BlogPost) => {
    setSelectedBlog(blog);
    handleNavigate('blog-post');
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
      {/* Inbuilt SEO & Head Manager */}
      <SeoHead
        currentPage={currentPage}
        currentBook={currentPage === 'book-details' ? (selectedBook || books[0]) : null}
        currentBlog={currentPage === 'blog-post' ? (selectedBlog || blogs[0]) : null}
      />

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

          {currentPage === 'admin' && <AdminPage onNavigate={handleNavigate} onOpenLiveStudio={handleOpenLiveStudio} />}
          {currentPage === 'admin-login' && <AdminLoginPage onNavigate={handleNavigate} />}
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

