export type BookFormat = 'Hardcover' | 'Paperback' | 'PDF (E-Book)' | 'Audiobook';
export type BookLanguage = 'Sanskrit' | 'Hindi' | 'English' | 'Tamil' | 'Telugu' | 'Kannada' | 'Marathi' | 'Bengali' | 'Gujarati';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  image: string;
  bookCount: number;
}

export interface Author {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  booksPublished: number;
  featured: boolean;
  location?: string;
  website?: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId?: string; // real authenticated user id — required for the review to actually
                    // persist to the database (reviews.user_id is NOT NULL there).
                    // Without it, a submitted review only ever exists in the current
                    // browser's local state and is never saved or visible to anyone else.
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  approved: boolean;
  photoUrl?: string;
  videoUrl?: string;
}

export interface TableOfContentsItem {
  chapter: string;
  title: string;
  page: number;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  originalTitle?: string; // e.g. Sanskrit transliteration
  slug: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  categoryName: string;
  formats: BookFormat[];
  primaryFormat: BookFormat;
  languages: BookLanguage[];
  primaryLanguage: BookLanguage;
  mrp: number; // Maximum Retail Price in INR
  offerPrice: number; // Sale price in INR
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNewRelease?: boolean;
  isUpcoming?: boolean;
  coverImage: string;
  additionalImages: string[];
  description: string;
  longDescription: string;
  isbn: string;
  publisher: string;
  publicationYear: number;
  edition: string;
  pages: number;
  weightGrams: number;
  dimensionsCm?: string;
  samplePdfUrl?: string;
  sampleAudioUrl?: string;
  // FIXED (2026-08-29 — clarified: "Add Book" feature needed a video
  // upload option, YouTube link OR direct file upload, not an "ad
  // booking" system). Either a YouTube URL (embedded as a player) or a
  // direct-uploaded video file URL can be set — trailerVideoIsYoutube
  // tells the book-details page which kind it's rendering.
  trailerVideoUrl?: string;
  trailerVideoIsYoutube?: boolean;
  tableOfContents?: TableOfContentsItem[];
  frequentlyBoughtWithBookIds?: string[];
  tags: string[];
  createdAt: string;
  seo?: BookSeo;
  variants?: BookVariant[];
}

export interface BookVariant {
  id: string;
  variantName: string; // e.g. "Hardcover Collector Edition", "Paperback Pocket Edition", "Deluxe Leatherbound"
  format: BookFormat;
  language: BookLanguage;
  mrp: number;
  offerPrice: number;
  stock: number;
  isbn?: string;
  image?: string;
}

export interface BookSeo {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface CartItem {
  book: Book;
  selectedFormat: BookFormat;
  selectedLanguage: BookLanguage;
  selectedVariant?: BookVariant;
  quantity: number;
}

export type OrderStatus = 'Processing' | 'Confirmed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
export type PaymentMethod = 'UPI' | 'Paytm/PhonePe' | 'Card' | 'NetBanking' | 'Wallet' | 'COD' | 'Razorpay';
export type ShippingCourier = 'India Post' | 'Delhivery' | 'DTDC' | 'Blue Dart';

export interface OrderAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  bookId: string;
  bookTitle: string;
  coverImage: string;
  format: BookFormat;
  language: BookLanguage;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface TrackingStep {
  status: OrderStatus;
  location: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  orderStatus: OrderStatus;
  courierName: ShippingCourier;
  trackingNumber: string;
  estimatedDeliveryDate: string;
  trackingHistory: TrackingStep[];
  couponCodeUsed?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiryDate: string;
  active: boolean;
  usageCount: number;
  // Optional: restrict this coupon to a single book. Undefined/empty = applies
  // to the whole cart (previous behaviour, unchanged).
  applicableBookId?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  authorName: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  tags: string[];
}

export interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration: string;
  speaker: string;
  category: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  caption: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  isOnline: boolean;
  description: string;
  registrationUrl?: string;
  speaker: string;
  image: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  comment: string;
  rating: number;
  verified: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'customer' | 'admin' | 'editor';
  addresses: OrderAddress[];
  wishlistBookIds: string[];
  purchasedEBookIds: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
  twitterHandle: string;
  googleSiteVerification: string;
  robotsTxtRules: string;
  enableIndexing: boolean;
  authorOrPublisherName: string;
}

export interface ThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderRadiusPx?: number;
  customCss?: string;
  customJs?: string;
  analyticsId?: string;
  facebookPixelId?: string;
  googleMapsApiKey?: string;
  darkModeEnabled?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  page: string;
  url?: string;
  isExternal?: boolean;
  order: number;
  visible: boolean;
}

export interface HeaderSettings {
  logoUrl?: string;
  faviconUrl?: string;
  showAnnouncementBar?: boolean;
  stickyHeader?: boolean;
  navItems?: NavItem[];
}

export interface FooterLink {
  id: string;
  label: string;
  page: string;
  url?: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface HomepageSection {
  id: string;
  name: string;
  type: 'hero' | 'nav_grid' | 'trust' | 'about_book' | 'videos' | 'authors' | 'testimonials' | 'blogs' | 'faq' | 'buy_cta' | 'custom_banner';
  title?: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  content?: Record<string, any>;
}

export interface PopupItem {
  id: string;
  title: string;
  type: 'welcome' | 'offer' | 'exit' | 'newsletter';
  active: boolean;
  headline: string;
  bodyText: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
}

export interface MediaFile {
  id: string;
  fileName: string;
  url: string;
  fileType: 'image' | 'video' | 'pdf' | 'audio' | 'document';
  sizeKb: number;
  createdAt: string;
  folder?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  featuredHeroBookId?: string;
  supportEmail: string;
  supportPhone: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber: string;
  supportWhatsapp?: string;
  address: string;
  announcementText?: string;
  freeShippingMinAmount: number;
  freeShippingThreshold?: number;
  taxPercentage: number;
  enableCod: boolean;
  // FIXED (2026-08-29 — "payment mode toggle must work in real-time"):
  // enableCod existed and was saved from the admin panel, but nothing on
  // the checkout page ever read ANY of these — the payment method list
  // was a hardcoded array, so toggling COD (or UPI/online payment) in the
  // admin panel had zero effect on what a customer could actually select.
  enableUpi: boolean;
  enableOnlinePayment: boolean;

  // Hero Banner Overrides
  heroBannerOverrideTitle?: string;
  heroBannerOverrideSubtitle?: string;
  heroBannerOverrideTagline?: string;
  heroBannerOverrideRatingText?: string;
  heroBannerBadgeText?: string;
  heroBannerBgImage?: string;

  // About Section Overrides
  aboutSectionTitle?: string;
  aboutSectionSubtitle?: string;
  aboutSectionDescription?: string;

  // Buy CTA Section Overrides
  buyCtaHeadline?: string;
  buyCtaSubtitle?: string;

  // Footer Overrides
  footerCopyrightText?: string;
  footerAboutText?: string;

  // Expanded Enterprise CMS Config
  theme?: ThemeSettings;
  header?: HeaderSettings;
  footerColumns?: FooterColumn[];
  homepageSections?: HomepageSection[];
  popups?: PopupItem[];
  customPages?: CustomPage[];
  mediaLibrary?: MediaFile[];

  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
    twitter: string;
  };
  seo?: SeoSettings;
  // FIXED (2026-08-29 — "Control Panel is dummy"): this field didn't
  // exist on SiteSettings at all, even though the admin form built and
  // saved it (`analytics: { googleAnalyticsId, facebookPixelId,
  // googleMapsApiKey }`) — meaning a saved GA/Pixel ID had nowhere real to
  // live and nothing ever read it back to actually inject the tracking
  // scripts.
  analytics?: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    googleMapsApiKey?: string;
  };
  // The Media Library admin section actually reads/writes this key at
  // runtime (self-consistent, so functionally it already worked) — it
  // was just never declared here, so it wasn't properly typed.
  mediaFiles?: MediaFile[];
}

export type LiveStreamMode = 'video' | 'audio';
export type LiveStreamStatus = 'idle' | 'live' | 'ended';

export interface LiveStreamComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  isQuestion?: boolean;
  isAnswered?: boolean;
  isPinned?: boolean;
  isVIP?: boolean;
}

export interface LiveStream {
  id: string;
  title: string;
  speaker: string;
  description: string;
  mode: LiveStreamMode;
  status: LiveStreamStatus;
  startedAt: string;
  endedAt?: string;
  viewerCount: number;
  likesCount: number;
  coverImage?: string;
  customEmbedUrl?: string;
  recordingUrl?: string;
  category?: string;
}

export interface CustomerReview {
  id: string;
  customer_name: string;
  business_name?: string;
  city: string;
  rating: number; // 1-5
  review_text: string;
  photo_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  is_verified: boolean;
  is_approved?: boolean;
  created_at: string;
}

