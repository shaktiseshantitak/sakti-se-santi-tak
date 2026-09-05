import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Book, Category, Author, Review, BlogPost, VideoItem,
  GalleryItem, EventItem, FaqItem, Testimonial, Coupon,
  Order, SiteSettings, AuditLog
} from '../types';
import {
  INITIAL_BOOKS, INITIAL_CATEGORIES, INITIAL_AUTHORS,
  INITIAL_BLOGS, INITIAL_VIDEOS, INITIAL_GALLERY,
  INITIAL_EVENTS, INITIAL_FAQS, INITIAL_TESTIMONIALS,
  INITIAL_COUPONS, DEFAULT_SITE_SETTINGS
} from '../data/initialData';
import { getLocalData, setLocalData, supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { BookFormat, BookLanguage } from '../types';

function mapDbBookToBook(row: any): Book {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title || '',
    slug: row.id,
    authorId: row.author_name || '',
    authorName: row.author_name || '',
    categoryId: row.category_id || '',
    categoryName: row.category_name || '',
    formats: [row.format as BookFormat],
    primaryFormat: row.format as BookFormat,
    languages: [row.language as BookLanguage],
    primaryLanguage: row.language as BookLanguage,
    mrp: Number(row.price || 0),
    offerPrice: Number(row.offer_price || 0),
    discountPercent: Number(row.discount_percent || 0),
    rating: Number(row.rating || 5.0),
    reviewCount: 0,
    stock: Number(row.stock || 0),
    isBestSeller: Boolean(row.is_bestseller),
    coverImage: row.cover_image || '',
    additionalImages: [],
    description: row.description || '',
    longDescription: row.description || '',
    isbn: '978-81-900000-0-0',
    publisher: 'Shakti Se Shanti Sansthan',
    publicationYear: 2024,
    edition: 'First Edition',
    pages: 350,
    weightGrams: 500,
    tags: [],
    createdAt: row.created_at || new Date().toISOString(),
    trailerVideoUrl: row.trailer_video_url || undefined,
    trailerVideoIsYoutube: Boolean(row.trailer_video_is_youtube),
  };
}

function mapDbCategoryToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name_hi || row.name_en || row.id,
    slug: row.slug || row.id,
    description: row.description || '',
    iconName: row.icon_name || 'BookOpen',
    // FIXED: this always discarded the real image and hardcoded '', so even
    // after a category's image_url was correctly saved to the database (see
    // migration 006), it would appear blank again on every fresh page load.
    image: row.image_url || '',
    bookCount: 0,
  };
}

function mapDbAuthorToAuthor(row: any): Author {
  return {
    id: row.id,
    name: row.name_hi || row.name_en || row.id,
    title: 'Vedic Scholar',
    bio: row.bio || '',
    avatar: row.photo_url || '',
    booksPublished: 0,
    featured: true,
  };
}

function mapDbReviewToReview(row: any): Review {
  return {
    id: row.id,
    bookId: row.book_id || 'book-1',
    userId: row.user_id || undefined,
    userName: row.user_name || 'Anonymous',
    rating: Number(row.rating || 5),
    title: 'Verified Reader Review',
    comment: row.comment || '',
    date: (row.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
    verifiedPurchase: true,
    approved: Boolean(row.is_approved),
  };
}

function mapDbCouponToCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Number(row.discount_value || 0),
    minOrderValue: Number(row.min_order_amount || 0),
    expiryDate: row.expires_at ? row.expires_at.split('T')[0] : '2030-12-31',
    active: Boolean(row.is_active),
    usageCount: Number(row.times_used || 0),
    applicableBookId: row.applicable_book_id || undefined,
  };
}

function mapDbBlogToBlog(row: any): BlogPost {
  return {
    id: row.id,
    title: row.title || '',
    slug: row.slug || row.id,
    excerpt: row.excerpt || '',
    content: row.content || '',
    coverImage: row.cover_image || '',
    authorName: row.author_name || '',
    category: row.category || '',
    publishedAt: (row.published_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
    readTimeMinutes: Number(row.read_time_minutes || 5),
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

function mapDbOrderToOrder(row: any): Order {
  const shipping = typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : (row.shipping_address || {});
  const items = Array.isArray(row.order_items) ? row.order_items.map((item: any) => ({
    bookId: item.book_id || '',
    bookTitle: item.book_title || 'Sacred Scripture Book',
    coverImage: item.cover_image || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80',
    format: item.format || 'Hardcover',
    language: item.language || 'Hindi',
    unitPrice: Number(item.unit_price || 0),
    quantity: Number(item.quantity || 1),
    totalPrice: Number(item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 1))),
  })) : [];

  return {
    id: row.id,
    orderNumber: row.order_number || row.id,
    userId: row.user_id,
    items,
    shippingAddress: {
      fullName: shipping.fullName || shipping.full_name || 'Valued Customer',
      phone: shipping.phone || '',
      email: shipping.email || '',
      addressLine1: shipping.addressLine1 || shipping.address_line1 || '',
      addressLine2: shipping.addressLine2 || shipping.address_line2 || '',
      city: shipping.city || '',
      state: shipping.state || '',
      pincode: shipping.pincode || '',
      country: shipping.country || 'India',
    },
    subtotal: Number(row.subtotal || row.total_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    shippingCharge: Number(row.shipping_charge || 0),
    taxAmount: Number(row.tax_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    paymentMethod: row.payment_method || 'UPI',
    paymentStatus: row.payment_status || 'Pending',
    paymentTransactionId: row.payment_transaction_id || row.razorpay_order_id || '',
    orderStatus: row.order_status || 'Processing',
    courierName: row.courier_name || '',
    trackingNumber: row.tracking_number || '',
    estimatedDeliveryDate: row.estimated_delivery_date || '',
    trackingHistory: [
      { status: 'Processing', location: 'Varanasi Publishing Hub', timestamp: row.created_at || new Date().toISOString(), description: 'Order received & sacred packing initiated', completed: true },
      { status: 'Shipped', location: 'Courier Transit Hub', timestamp: row.order_status === 'Shipped' || row.order_status === 'Delivered' ? 'Completed' : 'Pending', description: 'Dispatched via Express Courier', completed: row.order_status === 'Shipped' || row.order_status === 'Delivered' },
      { status: 'Out for Delivery', location: 'Destination Branch', timestamp: row.order_status === 'Delivered' ? 'Completed' : 'Pending', description: 'Out for doorstep delivery', completed: row.order_status === 'Delivered' },
      { status: 'Delivered', location: 'Customer Doorstep', timestamp: row.order_status === 'Delivered' ? row.updated_at || 'Completed' : 'Pending', description: 'Handed to customer', completed: row.order_status === 'Delivered' },
    ],
    couponCodeUsed: row.coupon_code_used || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

interface BookContextType {
  books: Book[];
  categories: Category[];
  authors: Author[];
  reviews: Review[];
  blogs: BlogPost[];
  videos: VideoItem[];
  // FIXED (admin panel "UI-only, not real" bug report): every add/update/
  // delete below optimistically updates local React state immediately
  // (so the admin panel always LOOKS like it worked), then separately
  // fires off the actual Supabase write. If that write failed — wrong
  // foreign key, a UNIQUE constraint collision, a missing required
  // column, RLS denial, network error, anything — the failure used to go
  // only to console.warn, which no admin ever checks. The admin would see
  // their new book/coupon/article appear fine in their own browser, walk
  // away thinking it's live, and it would simply vanish on next reload
  // (or never have existed for any other visitor at all) with zero
  // explanation. lastSyncError carries the most recent such failure so
  // the UI can surface it as a visible toast instead of staying silent.
  gallery: GalleryItem[];
  events: EventItem[];
  faqs: FaqItem[];
  testimonials: Testimonial[];
  coupons: Coupon[];
  orders: Order[];
  // FIXED (2026-08-29 — "Get in Touch with Our Publishing Desk data is not
  // visible in the admin panel"): migration 008 created a real
  // contact_messages table with admin-only RLS, but nothing in the admin
  // UI ever queried or displayed it — submissions had nowhere to be read.
  contactMessages: { id: string; name: string; email: string; subject: string; message: string; isRead: boolean; createdAt: string }[];
  markContactMessageRead: (id: string) => void;
  deleteContactMessage: (id: string) => void;
  auditLogs: AuditLog[];
  siteSettings: SiteSettings;
  
  // Book Actions
  addBook: (book: Omit<Book, 'id' | 'createdAt'>) => void;
  updateBook: (id: string, updated: Partial<Book>, options?: { skipRemoteSync?: boolean }) => void;
  deleteBook: (id: string) => void;
  
  // Category Actions
  addCategory: (category: Omit<Category, 'id' | 'bookCount'>) => void;
  updateCategory: (id: string, updated: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Author Actions
  addAuthor: (author: Omit<Author, 'id' | 'booksPublished'>) => void;
  updateAuthor: (id: string, updated: Partial<Author>) => void;
  deleteAuthor: (id: string) => void;

  // Review Actions
  addReview: (review: Omit<Review, 'id' | 'date' | 'approved'>) => void;
  toggleReviewApproval: (id: string) => void;
  deleteReview: (id: string) => void;

  // Blog Actions
  addBlogPost: (blog: Omit<BlogPost, 'id' | 'publishedAt'>) => void;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;

  // FAQ Actions
  addFaq: (faq: Omit<FaqItem, 'id'>) => void;
  updateFaq: (id: string, updated: Partial<FaqItem>) => void;
  deleteFaq: (id: string) => void;

  // Testimonial Actions
  addTestimonial: (testimonial: Omit<Testimonial, 'id'>) => void;
  updateTestimonial: (id: string, updated: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;

  // Video Actions
  addVideo: (video: Omit<VideoItem, 'id'>) => void;
  deleteVideo: (id: string) => void;

  // Gallery Actions
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  deleteGalleryItem: (id: string) => void;

  // Coupon Actions
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  toggleCouponStatus: (id: string) => void;
  deleteCoupon: (id: string) => void;

  // Order Actions
  createOrder: (
    order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'trackingHistory'>,
    serverResult?: { orderId: string; orderNumber: string }
  ) => Order;
  updateOrderStatus: (id: string, status: Order['orderStatus']) => void;
  updateOrderDetails: (id: string, details: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  
  // Settings Actions
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;

  // Audit Log Action
  addAuditLog: (action: string, entity: string, details: string) => void;
  clearAuditLogs: () => void;

  // Reset demo state
  resetToInitialData: () => void;

  // Visible surface for the silent-Supabase-failure fix described above.
  lastSyncError: string | null;
  clearSyncError: () => void;
}

const INITIAL_SAMPLE_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    bookId: 'book-1',
    userName: 'Dr. Ananya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Pristine Sanskrit typography & authentic bhashya',
    comment: 'The paper quality, ribbon bookmark, and gold edge finishing are of imperial standards. The translation by Swami Gambhirananda leaves no room for confusion.',
    date: '2024-05-10',
    verifiedPurchase: true,
    approved: true,
  },
  {
    id: 'rev-2',
    bookId: 'book-1',
    userName: 'Prof. Varun Shastri',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Essential for every Serious Seeker',
    comment: 'The verse index at the back helps immensely during daily discourse preparation. Packaging was pristine.',
    date: '2024-06-01',
    verifiedPurchase: true,
    approved: true,
  },
  {
    id: 'rev-3',
    bookId: 'book-2',
    userName: 'Meera Deshmukh',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    title: 'Divine Awadhi text and clear Hindi commentary',
    comment: 'The 7 Kandas are formatted with high legibility. My grandparents read a chapter together every evening.',
    date: '2024-06-18',
    verifiedPurchase: true,
    approved: true,
  },
];

const INITIAL_SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'DH-2024-9841',
    items: [
      {
        bookId: 'book-1',
        bookTitle: 'Srimad Bhagavad Gita - Deluxe Sanskrit & English Commentary',
        coverImage: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80',
        format: 'Hardcover',
        language: 'Sanskrit',
        unitPrice: 899,
        quantity: 1,
        totalPrice: 899,
      },
      {
        bookId: 'book-4',
        bookTitle: 'Hanuman Chalisa Pocket Hardbound',
        coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        format: 'Hardcover',
        language: 'Hindi',
        unitPrice: 249,
        quantity: 1,
        totalPrice: 249,
      },
    ],
    shippingAddress: {
      fullName: 'Ramesh Sharma',
      phone: '+91 98765 12345',
      email: 'ramesh.sharma@example.com',
      addressLine1: 'Flat 402, Shivam Enclave',
      addressLine2: 'Near Sankat Mochan Temple, Assi Ghat Road',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      pincode: '221005',
      country: 'India',
    },
    subtotal: 1148,
    discountAmount: 108,
    shippingCharge: 0,
    taxAmount: 52,
    totalAmount: 1092,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    paymentTransactionId: 'UPI-TXN-984210948',
    orderStatus: 'Shipped',
    courierName: 'Delhivery',
    trackingNumber: 'DEL-IND-88410924',
    estimatedDeliveryDate: '2024-08-05',
    trackingHistory: [
      { status: 'Processing', location: 'Varanasi Central Press', timestamp: '2024-08-01 10:30 AM', description: 'Order confirmed and packed with sacred sealing', completed: true },
      { status: 'Shipped', location: 'Varanasi Hub', timestamp: '2024-08-01 04:15 PM', description: 'Dispatched via Delhivery Express Cargo', completed: true },
      { status: 'Out for Delivery', location: 'Destination City Hub', timestamp: 'Pending', description: 'Package assigned to delivery executive', completed: false },
      { status: 'Delivered', location: 'Customer Doorstep', timestamp: 'Pending', description: 'Package delivered successfully', completed: false },
    ],
    couponCodeUsed: 'RAMA108',
    createdAt: '2024-08-01T10:30:00Z',
    updatedAt: '2024-08-01T16:15:00Z',
  },
];

const BookContext = createContext<BookContextType | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FIXED (2026-08-29 — "customer cannot see their own orders"): the
  // Supabase fetch below used to run exactly once, on BookProvider's very
  // first mount, completely independent of auth state. Since it can fire
  // before Supabase has finished restoring/attaching the person's session,
  // the `orders` query could go out effectively unauthenticated — RLS then
  // correctly returns zero rows for an anonymous request (`orders` is
  // scoped to `user_id = auth.uid()`), that empty result was silently
  // ignored (`if (oData.length > 0)`), and — because the effect never
  // re-ran — the customer's real orders were never fetched again for the
  // rest of that browser tab's life, even after their session fully
  // loaded. Depending on `isAuthLoading`/`user?.id` makes this re-run
  // once the auth state is actually settled, and again any time the
  // logged-in user changes (login/logout/switch account).
  const { isAuthLoading, user, isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>(() => getLocalData('books', INITIAL_BOOKS));
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const clearSyncError = () => setLastSyncError(null);
  // Every "if (error) console.warn(...)" callback below also calls this,
  // so a failed save becomes a visible toast (see AdminPage.tsx) instead
  // of a silent no-op — see the interface comment above for why.
  const reportSyncError = (what: string, error: { message: string }) => {
    console.warn(`Supabase ${what} error:`, error.message);
    setLastSyncError(`Save failed (${what}): ${error.message}. This did NOT save to the live database — please retry.`);
  };
  const [categories, setCategories] = useState<Category[]>(() => getLocalData('categories', INITIAL_CATEGORIES));
  const [authors, setAuthors] = useState<Author[]>(() => getLocalData('authors', INITIAL_AUTHORS));
  const [reviews, setReviews] = useState<Review[]>(() => getLocalData('reviews', INITIAL_SAMPLE_REVIEWS));
  const [blogs, setBlogs] = useState<BlogPost[]>(() => getLocalData('blogs', INITIAL_BLOGS));
  const [videos, setVideos] = useState<VideoItem[]>(() => getLocalData('videos', INITIAL_VIDEOS));
  const [gallery, setGallery] = useState<GalleryItem[]>(() => getLocalData('gallery', INITIAL_GALLERY));
  const [events] = useState<EventItem[]>(INITIAL_EVENTS);
  const [faqs, setFaqs] = useState<FaqItem[]>(() => getLocalData('faqs', INITIAL_FAQS));
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => getLocalData('testimonials', INITIAL_TESTIMONIALS));
  const [coupons, setCoupons] = useState<Coupon[]>(() => getLocalData('coupons', INITIAL_COUPONS));
  const [orders, setOrders] = useState<Order[]>(() => getLocalData('orders', INITIAL_SAMPLE_ORDERS));
  const [contactMessages, setContactMessages] = useState<BookContextType['contactMessages']>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getLocalData('audit_logs', []));
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getLocalData('site_settings', DEFAULT_SITE_SETTINGS));

  // Load initial data from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    if (isAuthLoading) return; // wait for the real session to settle first

    let isMounted = true;

    async function loadSupabaseData() {
      try {
        // FIXED (2026-08-31 — "Admin panel 100% data nahi dikha raha,
        // khaas kar Books aur Orders ka data" — THE root cause): this used
        // Promise.all() across 9 unrelated queries (books, categories,
        // authors, reviews, coupons, orders, site_settings, audit_logs,
        // blogs). Promise.all() is all-or-nothing — the instant ANY ONE of
        // those 9 queries genuinely rejected (an RLS edge case, a join
        // hiccup on order_items, a transient network blip on just the
        // audit_logs or blogs call), the WHOLE batch rejected, the catch
        // block below fired, and NONE of the 9 datasets ever got applied
        // — not just the one that failed. Books and Orders could be 100%
        // fine on their own and still never show up, just because
        // something unrelated (like audit_logs) hiccuped. Promise.
        // allSettled() lets every query succeed or fail completely
        // independently — a single failing query now only affects that
        // one dataset, logged via reportSyncError, instead of silently
        // blanking the entire admin panel.
        const results = await Promise.allSettled([
          supabase!.from('books').select('*').order('created_at', { ascending: false }),
          supabase!.from('categories').select('*').order('sort_order', { ascending: true }),
          supabase!.from('authors').select('*').order('created_at', { ascending: false }),
          supabase!.from('reviews').select('*').order('created_at', { ascending: false }),
          supabase!.from('coupons').select('*').order('created_at', { ascending: false }),
          supabase!.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
          supabase!.from('site_settings').select('settings').eq('id', 'default').maybeSingle(),
          supabase!.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
          supabase!.from('blogs').select('*').order('published_at', { ascending: false }),
        ]);

        const labels = ['books', 'categories', 'authors', 'reviews', 'coupons', 'orders', 'site_settings', 'audit_logs', 'blogs'];
        const unwrap = (i: number) => {
          const r = results[i];
          if (r.status === 'fulfilled') {
            if (r.value.error) {
              reportSyncError(`${labels[i]} fetch`, r.value.error);
              return null;
            }
            return r.value.data;
          }
          reportSyncError(`${labels[i]} fetch`, { message: String(r.reason) });
          return null;
        };

        const bData = unwrap(0) as any[] | null;
        const cData = unwrap(1) as any[] | null;
        const aData = unwrap(2) as any[] | null;
        const rData = unwrap(3) as any[] | null;
        const cpData = unwrap(4) as any[] | null;
        const oData = unwrap(5) as any[] | null;
        const stData = unwrap(6) as { settings: any } | null;
        const lgData = unwrap(7) as any[] | null;
        const blData = unwrap(8) as any[] | null;

        if (!isMounted) return;

        if (bData && bData.length > 0) setBooks(bData.map(mapDbBookToBook));
        if (cData && cData.length > 0) setCategories(cData.map(mapDbCategoryToCategory));
        if (aData && aData.length > 0) setAuthors(aData.map(mapDbAuthorToAuthor));
        if (rData && rData.length > 0) setReviews(rData.map(mapDbReviewToReview));
        if (cpData && cpData.length > 0) setCoupons(cpData.map(mapDbCouponToCoupon));
        if (oData && oData.length > 0) setOrders(oData.map(mapDbOrderToOrder));
        if (stData?.settings) setSiteSettings(stData.settings as SiteSettings);

        // Admin-only — RLS restricts contact_messages SELECT to admins, so
        // this only fetches meaningful data when isAdmin is true; harmless
        // no-op (empty result) for anyone else.
        if (isAdmin) {
          const { data: cmData } = await supabase!.from('contact_messages').select('*').order('created_at', { ascending: false });
          if (isMounted && cmData) {
            setContactMessages(cmData.map((r: any) => ({
              id: r.id, name: r.name, email: r.email, subject: r.subject || '', message: r.message,
              isRead: Boolean(r.is_read), createdAt: r.created_at,
            })));
          }
        }
        if (blData && blData.length > 0) setBlogs(blData.map(mapDbBlogToBlog));
        if (lgData && lgData.length > 0) {
          setAuditLogs(lgData.map((l: any) => ({
            id: String(l.id),
            userEmail: l.user_id || 'system',
            action: l.action,
            entity: l.resource,
            details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || ''),
            timestamp: l.created_at
          })));
        }
      } catch (err) {
        console.warn('Error loading Supabase catalog data:', err);
      }
    }

    loadSupabaseData();

    // FIXED ("payment mode toggle must work in real-time"): admin toggles
    // for COD/UPI/online payment (site_settings) previously only reached
    // a customer already on the checkout page after a full page reload.
    // A live Supabase Realtime subscription pushes the change to anyone
    // already browsing the instant the admin saves it — no refresh needed.
    const settingsChannel = supabase
      .channel('site_settings_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.default' },
        (payload: any) => {
          if (payload.new?.settings) setSiteSettings(payload.new.settings as SiteSettings);
        })
      .subscribe();

    return () => {
      isMounted = false;
      supabase!.removeChannel(settingsChannel);
    };
  }, [isAuthLoading, user?.id]);

  const markContactMessageRead = (id: string) => {
    setContactMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    if (isSupabaseConfigured && supabase) {
      supabase.from('contact_messages').update({ is_read: true }).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('contact message mark-read', error);
      });
    }
  };

  // FIXED (2026-08-31 — "Publishing Desk Inquiries — delete option hona
  // chahiye taaki admin panel clean dikhe"): the DELETE RLS policy for
  // admins already existed in the database (migration 008), it just had
  // no frontend function/button wired to it — old inquiries had no way to
  // ever be cleared out.
  const deleteContactMessage = (id: string) => {
    setContactMessages(prev => prev.filter(m => m.id !== id));
    if (isSupabaseConfigured && supabase) {
      supabase.from('contact_messages').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('contact message delete', error);
      });
    }
  };

  // Sync to local storage when Supabase is not configured
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('books', books); }, [books]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('categories', categories); }, [categories]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('authors', authors); }, [authors]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('reviews', reviews); }, [reviews]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('blogs', blogs); }, [blogs]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('videos', videos); }, [videos]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('gallery', gallery); }, [gallery]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('faqs', faqs); }, [faqs]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('testimonials', testimonials); }, [testimonials]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('coupons', coupons); }, [coupons]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('orders', orders); }, [orders]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { if (!isSupabaseConfigured) setLocalData('site_settings', siteSettings); }, [siteSettings]);

  const addAuditLog = (action: string, entity: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      userEmail: 'admin@shaktiseshanti.com',
      action,
      entity,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').insert({
        action,
        resource: entity,
        details: { note: details }
      }).then(({ error }) => {
        if (error) reportSyncError('audit log insert', error);
      });
    }
  };

  const addBook = (newBookData: Omit<Book, 'id' | 'createdAt'>) => {
    const newId = 'book-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newBook: Book = {
      ...newBookData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setBooks(prev => [newBook, ...prev]);
    addAuditLog('CREATE', 'Book', `Added book "${newBook.title}"`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('books').insert({
        id: newId,
        title: newBook.title,
        original_title: newBook.originalTitle || null,
        author_name: newBook.authorName,
        category_id: newBook.categoryId || null,
        category_name: newBook.categoryName,
        price: newBook.mrp,
        offer_price: newBook.offerPrice,
        discount_percent: newBook.discountPercent,
        stock: newBook.stock,
        format: newBook.primaryFormat,
        language: newBook.primaryLanguage,
        cover_image: newBook.coverImage,
        description: newBook.description,
        is_bestseller: newBook.isBestSeller || false,
        rating: newBook.rating || 5.0,
        trailer_video_url: newBook.trailerVideoUrl || null,
        trailer_video_is_youtube: newBook.trailerVideoIsYoutube || false,
      }).then(({ error }) => {
        if (error) reportSyncError('book insert', error);
      });
    }
  };

  const updateBook = (id: string, updated: Partial<Book>, options?: { skipRemoteSync?: boolean }) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
    addAuditLog('UPDATE', 'Book', `Updated book ID ${id}`);

    if (!options?.skipRemoteSync && isSupabaseConfigured && supabase) {
      const updatePayload: Record<string, any> = {};
      if (updated.title !== undefined) updatePayload.title = updated.title;
      if (updated.authorName !== undefined) updatePayload.author_name = updated.authorName;
      if (updated.categoryName !== undefined) updatePayload.category_name = updated.categoryName;
      if (updated.mrp !== undefined) updatePayload.price = updated.mrp;
      if (updated.offerPrice !== undefined) updatePayload.offer_price = updated.offerPrice;
      if (updated.stock !== undefined) updatePayload.stock = updated.stock;
      if (updated.rating !== undefined) updatePayload.rating = updated.rating;
      if (updated.isBestSeller !== undefined) updatePayload.is_bestseller = updated.isBestSeller;
      if (updated.description !== undefined) updatePayload.description = updated.description;
      if (updated.coverImage !== undefined) updatePayload.cover_image = updated.coverImage;
      if (updated.trailerVideoUrl !== undefined) updatePayload.trailer_video_url = updated.trailerVideoUrl;
      if (updated.trailerVideoIsYoutube !== undefined) updatePayload.trailer_video_is_youtube = updated.trailerVideoIsYoutube;
      updatePayload.updated_at = new Date().toISOString();

      supabase.from('books').update(updatePayload).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('book update', error);
      });
    }
  };

  const deleteBook = (id: string) => {
    const b = books.find(x => x.id === id);
    setBooks(prev => prev.filter(x => x.id !== id));
    addAuditLog('DELETE', 'Book', `Deleted book ${b?.title || id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('books').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('book delete', error);
      });
    }
  };

  const addCategory = (catData: Omit<Category, 'id' | 'bookCount'>) => {
    const newId = 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newCat: Category = {
      ...catData,
      id: newId,
      bookCount: 0,
    };
    setCategories(prev => [...prev, newCat]);
    addAuditLog('CREATE', 'Category', `Added category "${newCat.name}"`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('categories').insert({
        id: newId,
        name_hi: newCat.name,
        name_en: newCat.name,
        slug: newCat.slug,
        description: newCat.description,
        icon_name: newCat.iconName,
        image_url: newCat.image,
      }).then(({ error }) => {
        if (error) reportSyncError('category insert', error);
      });
    }
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, any> = {};
      if (updated.name !== undefined) { payload.name_hi = updated.name; payload.name_en = updated.name; }
      if (updated.slug !== undefined) payload.slug = updated.slug;
      if (updated.description !== undefined) payload.description = updated.description;
      if (updated.iconName !== undefined) payload.icon_name = updated.iconName;
      if (updated.image !== undefined) payload.image_url = updated.image;

      supabase.from('categories').update(payload).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('category update', error);
      });
    }
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE', 'Category', `Deleted category ID ${id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('categories').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('category delete', error);
      });
    }
  };

  const addAuthor = (authorData: Omit<Author, 'id' | 'booksPublished'>) => {
    const newId = 'auth-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newAuthor: Author = {
      ...authorData,
      id: newId,
      booksPublished: 0,
    };
    setAuthors(prev => [...prev, newAuthor]);
    addAuditLog('CREATE', 'Author', `Added author "${newAuthor.name}"`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('authors').insert({
        id: newId,
        name_hi: newAuthor.name,
        name_en: newAuthor.name,
        bio: newAuthor.bio,
        photo_url: newAuthor.avatar,
      }).then(({ error }) => {
        if (error) reportSyncError('author insert', error);
      });
    }
  };

  const updateAuthor = (id: string, updated: Partial<Author>) => {
    setAuthors(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, any> = {};
      if (updated.name !== undefined) { payload.name_hi = updated.name; payload.name_en = updated.name; }
      if (updated.bio !== undefined) payload.bio = updated.bio;
      if (updated.avatar !== undefined) payload.photo_url = updated.avatar;

      supabase.from('authors').update(payload).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('author update', error);
      });
    }
  };

  const deleteAuthor = (id: string) => {
    setAuthors(prev => prev.filter(a => a.id !== id));
    addAuditLog('DELETE', 'Author', `Deleted author ID ${id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('authors').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('author delete', error);
      });
    }
  };

  const addReview = (revData: Omit<Review, 'id' | 'date' | 'approved'>) => {
    // NOTE: this previously never wrote to Supabase at all — every review
    // submitted on the live site (via BookDetailsPage) only existed in the
    // submitter's own browser state and vanished on refresh, never visible to
    // any other visitor. Also, the DB schema requires reviews.user_id (NOT
    // NULL, references auth.users) and defaults is_approved to FALSE pending
    // moderation — so the old local "approved: true, auto approve in demo"
    // behavior would have been misleading even once persistence was added; a
    // real review is only actually public once an admin approves it.
    const hasRealUser = Boolean(revData.userId);
    const newRev: Review = {
      ...revData,
      id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: new Date().toISOString().split('T')[0],
      // Only auto-mark approved in local-only/demo mode (no real backend, or no
      // logged-in user so it can never be saved anyway) — once it can genuinely
      // reach the database, respect the real moderation-pending default.
      approved: !isSupabaseConfigured || !hasRealUser,
    };
    setReviews(prev => [newRev, ...prev]);
    // update book rating
    const bookRevs = [...reviews.filter(r => r.bookId === revData.bookId), newRev];
    const avg = bookRevs.reduce((acc, r) => acc + r.rating, 0) / bookRevs.length;
    updateBook(revData.bookId, {
      rating: Number(avg.toFixed(1)),
      reviewCount: bookRevs.length,
    });

    if (isSupabaseConfigured && supabase && hasRealUser) {
      supabase.from('reviews').insert({
        book_id: newRev.bookId,
        user_id: newRev.userId,
        user_name: newRev.userName,
        rating: newRev.rating,
        comment: newRev.comment,
        is_approved: false,
      }).select('id').single().then(({ data, error }) => {
        if (error) {
          reportSyncError('review insert', error);
          return;
        }
        // reviews.id is a server-generated UUID (uuid_generate_v4()), not the
        // client-side 'rev-...' id minted above — reconcile local state to the
        // real id so a later approve/delete actually targets the right DB row
        // instead of silently matching nothing.
        if (data?.id) {
          setReviews(prev => prev.map(r => r.id === newRev.id ? { ...r, id: data.id } : r));
        }
      });
    }
  };

  const toggleReviewApproval = (id: string) => {
    const target = reviews.find(r => r.id === id);
    const nextApproved = !target?.approved;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, approved: nextApproved } : r));

    if (isSupabaseConfigured && supabase) {
      supabase.from('reviews').update({ is_approved: nextApproved }).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('review approval update', error);
      });
    }
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    addAuditLog('DELETE', 'Review', `Deleted review ID ${id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('reviews').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('review delete', error);
      });
    }
  };

  const addBlogPost = (blogData: Omit<BlogPost, 'id' | 'publishedAt'>) => {
    const newId = 'blog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newBlog: BlogPost = {
      ...blogData,
      id: newId,
      publishedAt: new Date().toISOString().split('T')[0],
    };
    setBlogs(prev => [newBlog, ...prev]);
    addAuditLog('CREATE', 'Blog', `Created article "${newBlog.title}"`);

    // NOTE: there was no `blogs` table in the database at all until this fix —
    // every blog post ever "published" only existed in the admin's own local
    // browser state, invisible to real site visitors. See migration
    // 007_blogs_table.sql.
    if (isSupabaseConfigured && supabase) {
      supabase.from('blogs').insert({
        id: newId,
        title: newBlog.title,
        slug: newBlog.slug,
        excerpt: newBlog.excerpt,
        content: newBlog.content,
        cover_image: newBlog.coverImage,
        author_name: newBlog.authorName,
        category: newBlog.category,
        read_time_minutes: newBlog.readTimeMinutes,
        tags: newBlog.tags,
      }).then(({ error }) => {
        if (error) reportSyncError('blog insert', error);
      });
    }
  };

  const updateBlogPost = (id: string, updated: Partial<BlogPost>) => {
    setBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
    addAuditLog('UPDATE', 'Blog', `Updated blog post ID ${id}`);

    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, any> = {};
      if (updated.title !== undefined) payload.title = updated.title;
      if (updated.slug !== undefined) payload.slug = updated.slug;
      if (updated.excerpt !== undefined) payload.excerpt = updated.excerpt;
      if (updated.content !== undefined) payload.content = updated.content;
      if (updated.coverImage !== undefined) payload.cover_image = updated.coverImage;
      if (updated.authorName !== undefined) payload.author_name = updated.authorName;
      if (updated.category !== undefined) payload.category = updated.category;
      if (updated.readTimeMinutes !== undefined) payload.read_time_minutes = updated.readTimeMinutes;
      if (updated.tags !== undefined) payload.tags = updated.tags;

      supabase.from('blogs').update(payload).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('blog update', error);
      });
    }
  };

  const deleteBlogPost = (id: string) => {
    setBlogs(prev => prev.filter(b => b.id !== id));
    addAuditLog('DELETE', 'Blog', `Deleted blog post ID ${id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('blogs').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('blog delete', error);
      });
    }
  };

  const addFaq = (faqData: Omit<FaqItem, 'id'>) => {
    const newFaq: FaqItem = {
      ...faqData,
      id: 'faq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setFaqs(prev => [...prev, newFaq]);
    addAuditLog('CREATE', 'FAQ', `Added FAQ "${newFaq.question}"`);
  };

  const updateFaq = (id: string, updated: Partial<FaqItem>) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
  };

  const deleteFaq = (id: string) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    addAuditLog('DELETE', 'FAQ', `Deleted FAQ ID ${id}`);
  };

  const addTestimonial = (tData: Omit<Testimonial, 'id'>) => {
    const newT: Testimonial = {
      ...tData,
      id: 'testi-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setTestimonials(prev => [newT, ...prev]);
    addAuditLog('CREATE', 'Testimonial', `Added testimonial from ${newT.name}`);
  };

  const updateTestimonial = (id: string, updated: Partial<Testimonial>) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const deleteTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
    addAuditLog('DELETE', 'Testimonial', `Deleted testimonial ID ${id}`);
  };

  const addVideo = (vData: Omit<VideoItem, 'id'>) => {
    const newVid: VideoItem = {
      ...vData,
      id: 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setVideos(prev => [newVid, ...prev]);
    addAuditLog('CREATE', 'Video', `Added video "${newVid.title}"`);
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    addAuditLog('DELETE', 'Video', `Deleted video ID ${id}`);
  };

  const addGalleryItem = (gData: Omit<GalleryItem, 'id'>) => {
    const newG: GalleryItem = {
      ...gData,
      id: 'gal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    };
    setGallery(prev => [newG, ...prev]);
    addAuditLog('CREATE', 'Gallery', `Added gallery image "${newG.title}"`);
  };

  const deleteGalleryItem = (id: string) => {
    setGallery(prev => prev.filter(g => g.id !== id));
    addAuditLog('DELETE', 'Gallery', `Deleted gallery item ID ${id}`);
  };

  const addCoupon = (coupData: Omit<Coupon, 'id' | 'usageCount'>) => {
    const newId = 'coup-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newCoup: Coupon = {
      ...coupData,
      id: newId,
      usageCount: 0,
    };
    setCoupons(prev => [...prev, newCoup]);
    addAuditLog('CREATE', 'Coupon', `Created coupon "${newCoup.code}"`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('coupons').insert({
        id: newId,
        code: newCoup.code,
        discount_type: newCoup.discountType,
        discount_value: newCoup.discountValue,
        min_order_amount: newCoup.minOrderValue,
        is_active: newCoup.active,
        expires_at: newCoup.expiryDate ? `${newCoup.expiryDate}T23:59:59Z` : null,
        applicable_book_id: newCoup.applicableBookId || null,
      }).then(({ error }) => {
        if (error) reportSyncError('coupon insert', error);
      });
    }
  };

  const toggleCouponStatus = (id: string) => {
    const target = coupons.find(c => c.id === id);
    const nextActive = !target?.active;
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: nextActive } : c));

    if (isSupabaseConfigured && supabase) {
      supabase.from('coupons').update({ is_active: nextActive }).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('coupon toggle', error);
      });
    }
  };

  const deleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE', 'Coupon', `Deleted coupon ID ${id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('coupons').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('coupon delete', error);
      });
    }
  };

  const createOrder = (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'trackingHistory'>,
    serverResult?: { orderId: string; orderNumber: string }
  ): Order => {
    // When this is called after a server-authoritative order was already created
    // (checkout via /api/orders/create — see CheckoutPage.tsx), reuse the real
    // order id/number instead of minting fake local ones. Previously this always
    // generated its own random id AND order number, so the number shown on the
    // confirmation screen didn't match the number actually recorded in the
    // database/payment records.
    const num = serverResult?.orderNumber || ('DH-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
    const newOrder: Order = {
      ...orderData,
      id: serverResult?.orderId || ('ord-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)),
      orderNumber: num,
      orderStatus: 'Processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackingHistory: [
        {
          status: 'Processing',
          location: 'Varanasi Publishing Hub',
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          description: 'Order confirmed and sacred packaging initiated',
          completed: true,
        },
        { status: 'Shipped', location: 'Transit Hub', timestamp: 'Pending', description: 'Handed to courier partner', completed: false },
        { status: 'Out for Delivery', location: 'Local Branch', timestamp: 'Pending', description: 'Out for doorstep delivery', completed: false },
        { status: 'Delivered', location: 'Customer Doorstep', timestamp: 'Pending', description: 'Package handed over', completed: false },
      ],
    };

    // Deduct stock LOCALLY (UI state only) for immediate feedback. When serverResult is
    // provided, the real atomic decrement already happened server-side via the
    // decrement_inventory() RPC inside /api/orders/create — do not also push this to
    // Supabase below, or an admin user's own checkout would double-decrement stock
    // (once correctly via the atomic RPC, once via this non-atomic client overwrite).
    orderData.items.forEach(item => {
      const b = books.find(x => x.id === item.bookId);
      if (b && b.stock >= item.quantity) {
        updateBook(b.id, { stock: b.stock - item.quantity }, { skipRemoteSync: Boolean(serverResult) });
      }
    });

    setOrders(prev => [newOrder, ...prev]);
    addAuditLog('CREATE', 'Order', `Placed order ${num} for ₹${newOrder.totalAmount}`);

    // Note: Official online/COD orders are created server-side via /api/orders/create with service_role.
    // If an admin manually adds an order via client, sync with Supabase if admin permissions exist.
    // Skip this entirely when serverResult is set — the order row (and its order_items) already
    // exist in the database, created authoritatively by the server; inserting again here would
    // create a duplicate order row (it would only succeed for admin users, since RLS blocks the
    // insert for regular customers — but for an admin checking out, it silently duplicated the order).
    if (!serverResult && isSupabaseConfigured && supabase && newOrder.userId) {
      supabase.from('orders').insert({
        order_number: newOrder.orderNumber,
        user_id: newOrder.userId,
        shipping_address: newOrder.shippingAddress,
        subtotal: newOrder.subtotal,
        discount_amount: newOrder.discountAmount,
        shipping_charge: newOrder.shippingCharge,
        tax_amount: newOrder.taxAmount,
        total_amount: newOrder.totalAmount,
        payment_method: newOrder.paymentMethod,
        payment_status: newOrder.paymentStatus,
        payment_transaction_id: newOrder.paymentTransactionId,
        order_status: newOrder.orderStatus,
        courier_name: newOrder.courierName,
        tracking_number: newOrder.trackingNumber,
        coupon_code_used: newOrder.couponCodeUsed,
      }).select('id').single().then(({ data: insertedOrder, error }) => {
        if (!error && insertedOrder?.id) {
          const itemRows = newOrder.items.map(item => ({
            order_id: insertedOrder.id,
            book_id: item.bookId,
            book_title: item.bookTitle,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            total_price: item.totalPrice,
            format: item.format,
            language: item.language
          }));
          supabase.from('order_items').insert(itemRows);
        }
      });
    }

    return newOrder;
  };

  // FIXED (2026-08-29 self-audit — redundant duplicate write): this used
  // to also fire its own `supabase.from('orders').update(...)` call. Its
  // only caller (Admin Orders tab) now goes through the secure
  // /api/admin/update-order-status server endpoint FIRST (which does the
  // real write, plus order_status_history + stock restore) and calls this
  // only afterward, purely to update local React state so the UI reflects
  // the change immediately. Keeping a second network write here was
  // genuinely pointless duplicate work, not just harmless — removed.
  const updateOrderStatus = (id: string, status: Order['orderStatus']) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== id) return ord;
      const history = [...ord.trackingHistory];
      const index = history.findIndex(h => h.status === status);
      if (index !== -1) {
        history[index] = {
          ...history[index],
          completed: true,
          timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        };
      }
      return {
        ...ord,
        orderStatus: status,
        updatedAt: new Date().toISOString(),
        trackingHistory: history,
      };
    }));
    addAuditLog('UPDATE', 'Order', `Updated Order ${id} status to ${status}`);
  };

  const updateOrderDetails = (id: string, details: Partial<Order>) => {
    setOrders(prev => prev.map(ord => ord.id === id ? { ...ord, ...details, updatedAt: new Date().toISOString() } : ord));
    addAuditLog('UPDATE', 'Order', `Updated Order ${id} logistics & tracking details`);

    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (details.courierName) payload.courier_name = details.courierName;
      if (details.trackingNumber) payload.tracking_number = details.trackingNumber;
      if (details.estimatedDeliveryDate) payload.estimated_delivery_date = details.estimatedDeliveryDate;
      if (details.orderStatus) payload.order_status = details.orderStatus;
      if (details.paymentStatus) payload.payment_status = details.paymentStatus;

      supabase.from('orders').update(payload).eq('id', id).then(({ error }) => {
        if (error) reportSyncError('order update', error);
      });
    }
  };

  const deleteOrder = (id: string) => {
    const target = orders.find(o => o.id === id);
    setOrders(prev => prev.filter(o => o.id !== id));
    addAuditLog('DELETE', 'Order', `Deleted order ${target?.orderNumber || id}`);

    if (isSupabaseConfigured && supabase) {
      supabase.from('orders').delete().eq('id', id).then(({ error }) => {
        if (error) reportSyncError('order delete', error);
      });
    }
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    setLocalData('audit_logs', []);
    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(({ error }) => {
        if (error) reportSyncError('audit log clear', error);
      });
    }
  };

  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const merged = { ...prev, ...newSettings };
      if (isSupabaseConfigured && supabase) {
        supabase.from('site_settings').upsert({
          id: 'default',
          settings: merged,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) reportSyncError('site_settings upsert', error);
        });
      }
      return merged;
    });
    addAuditLog('UPDATE', 'Settings', 'Updated store configuration');
  };

  const resetToInitialData = () => {
    setBooks(INITIAL_BOOKS);
    setCategories(INITIAL_CATEGORIES);
    setAuthors(INITIAL_AUTHORS);
    setReviews(INITIAL_SAMPLE_REVIEWS);
    setBlogs(INITIAL_BLOGS);
    setCoupons(INITIAL_COUPONS);
    setOrders(INITIAL_SAMPLE_ORDERS);
    setAuditLogs([]);
    setSiteSettings(DEFAULT_SITE_SETTINGS);
    localStorage.clear();
  };

  return (
    <BookContext.Provider
      value={{
        books,
        categories,
        authors,
        reviews,
        blogs,
        videos,
        gallery,
        events,
        faqs,
        testimonials,
        coupons,
        orders,
        contactMessages,
        markContactMessageRead,
        deleteContactMessage,
        auditLogs,
        siteSettings,
        addBook,
        updateBook,
        deleteBook,
        addCategory,
        updateCategory,
        deleteCategory,
        addAuthor,
        updateAuthor,
        deleteAuthor,
        addReview,
        toggleReviewApproval,
        deleteReview,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        addFaq,
        updateFaq,
        deleteFaq,
        addTestimonial,
        updateTestimonial,
        deleteTestimonial,
        addVideo,
        deleteVideo,
        addGalleryItem,
        deleteGalleryItem,
        addCoupon,
        toggleCouponStatus,
        deleteCoupon,
        createOrder,
        updateOrderStatus,
        updateOrderDetails,
        deleteOrder,
        updateSiteSettings,
        addAuditLog,
        clearAuditLogs,
        resetToInitialData,
        lastSyncError,
        clearSyncError,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};
