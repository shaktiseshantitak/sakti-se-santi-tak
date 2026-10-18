import { useSiteContent } from '../lib/useSiteContent';
import React, { useState, useEffect, useRef } from 'react';
import {
  Star, ThumbsUp, CheckCircle, Shield, Image as ImageIcon, Video,
  Filter, Search, ArrowLeft, ArrowRight, Play, X, Upload, HardDrive,
  Cpu, Zap, Sparkles, RefreshCw, MessageSquare, AlertCircle, Trash2, Check, ExternalLink, MapPin
} from 'lucide-react';
import { PageHeaderBanner } from '../components/common/PageHeaderBanner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBooks } from '../context/BookContext';
import { CustomerReview, Book } from '../types';
import {
  fetchCustomerReviewsApi,
  submitCustomerReviewApi,
  adminDeleteCustomerReviewApi,
  adminToggleVerifyCustomerReviewApi,
  adminApproveCustomerReviewApi,
  adminSetReviewApprovalVerifiedApi,
  adminDeleteReviewVerifiedApi,
  fetchReviewStatsApi,
  PaginatedReviewsResponse,
  ReviewStats
} from '../lib/reviewsApi';
import {
  validateMediaFile,
  compressImageToWebP,
  generateVideoThumbnailInBrowser
} from '../lib/mediaProcessor';
import { NO_IMAGE_PLACEHOLDER } from '../lib/placeholderImage';
import { getYoutubeEmbedUrl, extractYoutubeVideoId } from '../utils/youtube';

interface ReviewsPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ onNavigate }) => {
  const tx = useSiteContent();

  const { isAdmin } = useAuth();
  const { books, siteSettings } = useBooks();
  const banners = siteSettings.pageBanners || {};
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const { addToCart } = useCart();
  const shaktiBook = books.find(b => b.id === 'book-shakti') || books[0];

  // API State & Cache
  const [reviewsResponse, setReviewsResponse] = useState<PaginatedReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Pagination Parameters
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);

  // Modals state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; author: string } | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<{ videoUrl: string; author: string; text: string } | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);

  // Form submission state for "Write a Review"
  const [formName, setFormName] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formReviewText, setFormReviewText] = useState('');
  
  // Media Upload State (Browser Processed)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [processedPhotoDataUrl, setProcessedPhotoDataUrl] = useState<string | null>(null);
  const [processedVideoDataUrl, setProcessedVideoDataUrl] = useState<string | null>(null);
  const [processedThumbnailDataUrl, setProcessedThumbnailDataUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ origKb: number; compKb: number } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch Reviews with API query caching
  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await fetchCustomerReviewsApi({
        page,
        limit,
        ratingFilter,
        mediaFilter,
        searchQuery,
        sortBy,
        onlyVerified,
        includeUnapproved: isAdmin,
      });
      setReviewsResponse(res);
      fetchReviewStatsApi().then(setStats).catch(() => setStats(null));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, ratingFilter, mediaFilter, searchQuery, sortBy, onlyVerified, isAdmin]);

  // Handle File Selection with Browser Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setProcessedPhotoDataUrl(null);
    setProcessedVideoDataUrl(null);
    setProcessedThumbnailDataUrl(null);
    setCompressionStats(null);

    const val = validateMediaFile(file);
    if (!val.valid) {
      setFileError(val.error || 'अमान्य फाइल');
      return;
    }

    setSelectedFile(file);
    setIsProcessingMedia(true);

    try {
      if (val.fileType === 'image') {
        // Run Browser Canvas WebP Compression
        const compressed = await compressImageToWebP(file, 1200, 0.82);
        setProcessedPhotoDataUrl(compressed.dataUrl);
        setCompressionStats({
          origKb: compressed.originalSizeKb,
          compKb: compressed.compressedSizeKb
        });
      } else if (val.fileType === 'video') {
        // Extract frame 0 video thumbnail in browser
        const videoObjectUrl = URL.createObjectURL(file);
        setProcessedVideoDataUrl(videoObjectUrl);

        const thumb = await generateVideoThumbnailInBrowser(file);
        setProcessedThumbnailDataUrl(thumb.dataUrl);
      }
    } catch (err: any) {
      setFileError('मीडिया प्रोसेसिंग में समस्या आई: ' + err.message);
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCity.trim() || !formReviewText.trim()) {
      alert('कृपया अपना नाम, शहर और समीक्षा विवरण अवश्य भरें।');
      return;
    }

    setSubmitting(true);
    try {
      await submitCustomerReviewApi({
        customer_name: formName,
        business_name: formBusiness.trim() || undefined,
        city: formCity,
        rating: formRating,
        review_text: formReviewText,
        photo_url: processedPhotoDataUrl || undefined,
        video_url: processedVideoDataUrl || undefined,
        thumbnail_url: processedThumbnailDataUrl || undefined,
        is_verified: false
      }, shaktiBook?.id);

      setSubmitSuccess(true);
      setTimeout(() => {
        setIsWriteModalOpen(false);
        setSubmitSuccess(false);
        // Reset form
        setFormName('');
        setFormBusiness('');
        setFormCity('');
        setFormRating(5);
        setFormReviewText('');
        setSelectedFile(null);
        setProcessedPhotoDataUrl(null);
        setProcessedVideoDataUrl(null);
        setProcessedThumbnailDataUrl(null);
        setCompressionStats(null);
        loadReviews();
      }, 1500);
    } catch (err) {
      alert('समीक्षा सबमिट करने में विफल। पुनः प्रयास करें।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('क्या आप निश्चित रूप से इस समीक्षा को हटाना चाहते हैं?')) return;
    const res = await adminDeleteReviewVerifiedApi(id);
    if (res.ok !== true) { window.alert('❌ Review हटा नहीं: ' + (res as { ok: false; error: string }).error); return; }
    await adminDeleteCustomerReviewApi(id); // keeps the local demo copy in step
    loadReviews();
  };

  const handleToggleVerify = async (id: string) => {
    await adminToggleVerifyCustomerReviewApi(id);
    loadReviews();
  };

  const handleApproveReview = async (id: string, approved: boolean) => {
    const res = await adminSetReviewApprovalVerifiedApi(id, approved);
    if (res.ok !== true) { window.alert('❌ बदलाव database में नहीं हुआ: ' + (res as { ok: false; error: string }).error); return; }
    await adminApproveCustomerReviewApi(id, approved); // keeps the local demo copy in step
    loadReviews();
  };

  const handleBuyNow = () => {
    addToCart(shaktiBook, 'Hardcover', shaktiBook.languages[0] || 'Hindi', 1);
    onNavigate('checkout', { directBook: shaktiBook });
  };

  return (
    <div className="min-h-screen bg-[color:var(--c-page)] text-[color:var(--c-text)]">
      {/* Top Banner Header */}
      <PageHeaderBanner
        title={banners.reviewsTitle || "सत्यापित पाठकों एवं साधकों की समीक्षाएं"}
        subtitle={banners.reviewsSubtitle || "100% प्रामाणिक अनुभव — पुस्तक के सम्मानित पाठकों एवं साधकों के विचार व समीक्षाएं"}
        buyPrice={shaktiBook?.offerPrice}
        onNavigate={onNavigate}
        onBuyNow={handleBuyNow}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* 2. Top Summary & Rating Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Average Rating Score */}
          <div className="md:col-span-4 bg-[color:var(--c-surface)] rounded-3xl p-6 border border-[color:var(--c-accent)]/40 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--c-primary)]">{tx('t.ReviewsPage.4213cc1f')}</span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-serif text-5xl font-extrabold text-[color:var(--c-primary)]">{stats && stats.total > 0 ? stats.average.toFixed(1) : '—'}</span>
                <span className="text-sm text-[color:var(--c-text-muted)] font-bold">{stats && stats.total > 0 ? `/ 5.0 • ${stats.total} समीक्षाओं के आधार पर` : 'अभी कोई समीक्षा नहीं'}</span>
              </div>

              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`w-5 h-5 ${stats && stats.average >= star - 0.5 && stats.total > 0 ? 'fill-[color:var(--c-accent)] text-[color:var(--c-accent)]' : 'text-[color:var(--c-accent)]/40'}`} />
                ))}
              </div>

              <p className="text-xs text-[color:var(--c-text-muted)] font-medium">
                {tx('t.ReviewsPage.6cfd6449')}
              </p>
            </div>

            <div className="pt-4 border-t border-[color:var(--c-accent)]/20 flex items-center justify-between text-xs font-medium">
              <span className="text-[color:var(--c-text-muted)] flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>{tx('t.ReviewsPage.693d8960')}</span>
              </span>
              <span className="font-bold text-[color:var(--c-primary)]">{stats && stats.total > 0 ? `${stats.verifiedPct}%` : '—'}</span>
            </div>
          </div>

          {/* Rating Breakdown Bars */}
          <div className="md:col-span-5 bg-[color:var(--c-surface)] rounded-3xl p-6 border border-[color:var(--c-accent)]/40 shadow-sm space-y-2.5 flex flex-col justify-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--c-primary)] mb-1">{tx('t.ReviewsPage.3d4b4069')}</h4>
            
            {(stats?.distribution || [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, pct: 0 }))).map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-bold text-[color:var(--c-primary)] flex items-center gap-1">
                  {item.stars} <Star className="w-3 h-3 fill-[color:var(--c-accent)] text-[color:var(--c-accent)]" />
                </span>
                <div className="flex-1 h-2 bg-[color:var(--c-page)] rounded-full overflow-hidden border border-[color:var(--c-accent)]/20">
                  <div className="h-full bg-[color:var(--c-accent)] rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-[color:var(--c-text-muted)] font-bold text-[11px]">{item.pct}%</span>
              </div>
            ))}
          </div>

          {/* Action Card: Submit Review */}
          <div className="md:col-span-3 bg-[color:var(--c-primary)] text-amber-100 rounded-3xl p-6 border border-[color:var(--c-accent)]/40 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-lg text-amber-200">{tx('t.ReviewsPage.43f13a5b')}</h4>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                {tx('t.ReviewsPage.8abbcf7c')}
              </p>
            </div>

            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="w-full py-3 px-4 bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold rounded-2xl shadow transition-all flex items-center justify-center gap-2 text-xs border border-amber-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{tx('t.ReviewsPage.c357a0d1')}</span>
            </button>
          </div>
        </div>

        {/* 3. Search, Filters & Controls Bar */}
        <div className="bg-[color:var(--c-surface)] rounded-3xl p-4 sm:p-5 border border-[color:var(--c-accent)]/40 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[color:var(--c-primary)] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={tx('t.ReviewsPage.149a179a')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-[color:var(--c-page)] text-[color:var(--c-text)] placeholder-[color:var(--c-text-muted)]/60 text-xs rounded-xl border border-[color:var(--c-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
              />
            </div>

            {/* Rating Filter Dropdown */}
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setPage(1);
                }}
                className="w-full py-2 px-3 bg-[color:var(--c-page)] text-[color:var(--c-text)] text-xs font-bold rounded-xl border border-[color:var(--c-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
              >
                <option value="all">{tx('t.ReviewsPage.6d6be027')}</option>
                <option value="5">{tx('t.ReviewsPage.16cfc3b2')}</option>
                <option value="4">{tx('t.ReviewsPage.d3793312')}</option>
                <option value="3">{tx('t.ReviewsPage.b14647b1')}</option>
              </select>
            </div>

            {/* Media Filter Tabs */}
            <div className="flex bg-[color:var(--c-page)] p-1 rounded-xl border border-[color:var(--c-accent)]/40 text-xs font-bold">
              <button
                onClick={() => { setMediaFilter('all'); setPage(1); }}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${mediaFilter === 'all' ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'}`}
              >
                {tx('t.ReviewsPage.871b7f32')}{reviewsResponse?.total || 0})
              </button>
              <button
                onClick={() => { setMediaFilter('photo'); setPage(1); }}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${mediaFilter === 'photo' ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'}`}
              >
                <ImageIcon className="w-3 h-3" /> {tx('t.ReviewsPage.ef5c18df')}
              </button>
              <button
                onClick={() => { setMediaFilter('video'); setPage(1); }}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${mediaFilter === 'video' ? 'bg-[color:var(--c-primary)] text-amber-100 font-bold' : 'text-[color:var(--c-text-muted)] hover:text-[color:var(--c-primary)]'}`}
              >
                <Video className="w-3 h-3" /> {tx('t.ReviewsPage.16cc7897')}
              </button>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
                className="w-full py-2 px-3 bg-[color:var(--c-page)] text-[color:var(--c-text)] text-xs font-bold rounded-xl border border-[color:var(--c-accent)]/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
              >
                <option value="recent">{tx('t.ReviewsPage.8e6ef1c7')}</option>
                <option value="rating_high">{tx('t.ReviewsPage.481c07c9')}</option>
                <option value="rating_low">{tx('t.ReviewsPage.9ddb086d')}</option>
              </select>
            </div>
          </div>

          {/* Checkbox Filter */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[color:var(--c-accent)]/20">
            <label className="flex items-center gap-2 cursor-pointer text-[color:var(--c-text)] font-bold">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => {
                  setOnlyVerified(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-[color:var(--c-primary)] focus:ring-[color:var(--c-primary)] bg-[color:var(--c-page)] border-[color:var(--c-accent)]"
              />
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> {tx('t.ReviewsPage.17f9465d')}
              </span>
            </label>

            <span className="text-[11px] font-mono text-[color:var(--c-text-muted)] font-bold">
              {reviewsResponse ? `कुल ${reviewsResponse.total} समीक्षाएं मिलीं` : 'लोड हो रहा है...'}
            </span>
          </div>
        </div>

        {/* 4. Reviews List Grid (10 Reviews per Page Request) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[color:var(--c-surface)] rounded-3xl p-6 border border-[color:var(--c-accent)]/40 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[color:var(--c-page)]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-[color:var(--c-page)] rounded w-1/3" />
                    <div className="h-2 bg-[color:var(--c-page)] rounded w-1/4" />
                  </div>
                </div>
                <div className="h-16 bg-[color:var(--c-page)] rounded-xl" />
              </div>
            ))}
          </div>
        ) : reviewsResponse?.data.length === 0 ? (
          (() => {
            const noFiltersActive = !searchQuery && ratingFilter === 'all' && mediaFilter === 'all' && !onlyVerified;
            const genuinelyEmpty = noFiltersActive && (reviewsResponse?.total ?? 0) === 0;
            return (
              <div className="bg-[color:var(--c-surface)] rounded-3xl p-12 text-center border border-[color:var(--c-accent)]/40 space-y-3">
                <AlertCircle className="w-10 h-10 text-[color:var(--c-primary)] mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)]">
                  {genuinelyEmpty ? 'अभी तक कोई समीक्षा नहीं है' : 'कोई समीक्षा नहीं मिली'}
                </h3>
                <p className="text-xs text-[color:var(--c-text-muted)] font-medium">
                  {genuinelyEmpty
                    ? 'पहली समीक्षा लिखने वाले बनें — अपना अनुभव साझा करें!'
                    : 'कृपया अपने फ़िल्टर या खोज शब्दों में बदलाव करें।'}
                </p>
                {genuinelyEmpty ? (
                  <button
                    onClick={() => setIsWriteModalOpen(true)}
                    className="px-4 py-2 bg-[color:var(--c-primary)] hover:bg-[#561530] text-white text-xs font-bold rounded-xl"
                  >
                    {tx('t.ReviewsPage.accfc84f')}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setRatingFilter('all');
                      setMediaFilter('all');
                      setOnlyVerified(false);
                    }}
                    className="px-4 py-2 bg-[color:var(--c-page)] hover:bg-[color:var(--c-accent)]/20 text-[color:var(--c-primary)] text-xs font-bold rounded-xl border border-[color:var(--c-accent)]/40"
                  >
                    {tx('t.ReviewsPage.ad1a5404')}
                  </button>
                )}
              </div>
            );
          })()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewsResponse?.data.map((rev) => (
              <div
                key={rev.id}
                className="bg-[color:var(--c-surface)] rounded-3xl p-6 border border-[color:var(--c-accent)]/40 shadow-sm hover:border-[color:var(--c-accent)] transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* Admin Quick Action Bar. A review awaiting moderation
                    (is_approved === false) is invisible to every regular
                    visitor — only an admin (via includeUnapproved above)
                    sees it here, with a clear pending badge and a real
                    Approve/Reject action. There was previously no way at
                    all to approve a newly-submitted review; the toggle
                    button here only affected a cosmetic "verified" flag. */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    {rev.is_approved === false && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wide bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-400">
                        {tx('t.ReviewsPage.9e145fb7')}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      {rev.is_approved === false ? (
                        <button
                          onClick={() => handleApproveReview(rev.id, true)}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg border border-emerald-300 text-[10px]"
                          title={tx('t.ReviewsPage.6da6b748')}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApproveReview(rev.id, false)}
                          className="p-1.5 bg-[color:var(--c-page)] hover:bg-amber-100 text-[color:var(--c-text-muted)] rounded-lg border border-[color:var(--c-accent)]/40 text-[10px]"
                          title={tx('t.ReviewsPage.332f6700')}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleVerify(rev.id)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all ${rev.is_verified ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-[color:var(--c-page)] text-[color:var(--c-text-muted)] border-[color:var(--c-accent)]/40'}`}
                        title={tx('t.ReviewsPage.196d0ab4')}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg border border-rose-300 text-[10px]"
                        title={tx('t.ReviewsPage.d9bd372e')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[color:var(--c-primary)] text-amber-100 font-bold flex items-center justify-center text-sm shadow shrink-0 border border-[color:var(--c-accent)]/40">
                      {rev.customer_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-[color:var(--c-primary)] truncate">{rev.customer_name}</h4>
                        {rev.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-md border border-emerald-300">
                            <CheckCircle className="w-3 h-3" /> {tx('t.ReviewsPage.fcc7aab2')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[color:var(--c-text-muted)] font-medium mt-0.5">
                        {rev.business_name && (
                          <span className="text-[color:var(--c-primary)] font-bold truncate">{rev.business_name} • </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[color:var(--c-accent)]" /> {rev.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Date */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= rev.rating ? 'fill-[color:var(--c-accent)] text-[color:var(--c-accent)]' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-[color:var(--c-text-muted)] font-bold">
                      {new Date(rev.created_at).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Review Text Body */}
                  <p className="text-xs text-[color:var(--c-text)] leading-relaxed italic font-medium">
                    "{rev.review_text}"
                  </p>
                </div>

                {/* Media Section: Photos / Click-to-Play Videos */}
                {(rev.photo_url || rev.video_url) && (
                  <div className="pt-3 border-t border-[color:var(--c-accent)]/20 flex items-center gap-3">
                    {/* Photo Media Attachment */}
                    {rev.photo_url && (
                      <button
                        onClick={() => setLightboxImage({
                          url: rev.photo_url!,
                          title: rev.review_text,
                          author: rev.customer_name
                        })}
                        className="relative group/img overflow-hidden rounded-xl border border-[color:var(--c-accent)]/40 aspect-square w-20 shrink-0 bg-[color:var(--c-page)]"
                      >
                        <img
                          src={rev.photo_url}
                          alt={rev.customer_name}
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                         loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    )}

                    {/* Video Attachment with On-Demand Click-to-Play */}
                    {rev.video_url && (
                      <button
                        onClick={() => setActiveVideoModal({
                          videoUrl: rev.video_url!,
                          author: rev.customer_name,
                          text: rev.review_text
                        })}
                        className="relative group/vid overflow-hidden rounded-xl border border-[color:var(--c-accent)]/40 aspect-video h-20 bg-[color:var(--c-page)] flex-1 flex items-center justify-center"
                      >
                        <img
                          src={rev.thumbnail_url || NO_IMAGE_PLACEHOLDER}
                          alt="Video review thumbnail"
                          className="w-full h-full object-cover opacity-80 group-hover/vid:scale-105 transition-transform duration-300"
                         loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-[color:var(--c-accent)] text-[color:var(--c-ink)] flex items-center justify-center shadow-sm group-hover/vid:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-[color:var(--c-ink)] ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1.5 bg-[color:var(--c-primary)] text-amber-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {tx('t.ReviewsPage.50ffad40')}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 5. Pagination Controls */}
        {reviewsResponse && reviewsResponse.totalPages > 1 && (
          <div className="bg-[color:var(--c-surface)] rounded-2xl p-4 border border-[color:var(--c-accent)]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[color:var(--c-text-muted)] font-bold font-mono">
              {tx('t.ReviewsPage.5d894ad2')} {reviewsResponse.page} / {reviewsResponse.totalPages} {tx('t.ReviewsPage.63857653')}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-[color:var(--c-page)] hover:bg-[color:var(--c-accent)]/20 disabled:opacity-40 text-xs font-bold text-[color:var(--c-primary)] rounded-xl border border-[color:var(--c-accent)]/40 transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {tx('t.ReviewsPage.9943d724')}
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: reviewsResponse.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${p === page ? 'bg-[color:var(--c-primary)] text-amber-100 shadow border border-[color:var(--c-accent)]/40' : 'bg-[color:var(--c-page)] text-[color:var(--c-text)] hover:bg-[color:var(--c-accent)]/20'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                disabled={page === reviewsResponse.totalPages}
                onClick={() => setPage(prev => Math.min(reviewsResponse.totalPages, prev + 1))}
                className="px-3 py-1.5 bg-[color:var(--c-page)] hover:bg-[color:var(--c-accent)]/20 disabled:opacity-40 text-xs font-bold text-[color:var(--c-primary)] rounded-xl border border-[color:var(--c-accent)]/40 transition-all flex items-center gap-1"
              >
                {tx('t.ReviewsPage.471317b9')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX PHOTO MODAL */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[color:var(--c-surface)] rounded-3xl overflow-hidden border border-[color:var(--c-accent)]/40 shadow-sm flex flex-col">
            <div className="p-4 bg-[color:var(--c-primary)] text-amber-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-amber-100">{lightboxImage.author} {tx('t.ReviewsPage.0e927fca')}</h4>
                <p className="text-xs text-amber-200/80 truncate max-w-lg">"{lightboxImage.title}"</p>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-[color:var(--c-surface)]/20 hover:bg-[color:var(--c-surface)]/30 text-amber-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[color:var(--c-page)] flex items-center justify-center max-h-[75vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.author}
                className="max-h-[70vh] object-contain rounded-xl border border-[color:var(--c-accent)]/30 shadow-xs"
               loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      )}

      {/* CLICK-TO-PLAY VIDEO MODAL */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-[color:var(--c-surface)] rounded-3xl overflow-hidden border border-[color:var(--c-accent)]/40 shadow-sm">
            <div className="p-4 bg-[color:var(--c-primary)] text-amber-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-amber-200">{tx('t.ReviewsPage.5684b7c0')} {activeVideoModal.author}</h4>
                <p className="text-xs text-amber-100/80">{tx('t.ReviewsPage.1d5e49ca')}</p>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-2 bg-[color:var(--c-surface)]/20 hover:bg-[color:var(--c-surface)]/30 text-amber-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              {extractYoutubeVideoId(activeVideoModal.videoUrl) ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeVideoModal.videoUrl, { autoplay: true })}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideoModal.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-4 bg-[color:var(--c-surface)] border-t border-[color:var(--c-accent)]/30">
              <p className="text-xs text-[color:var(--c-text)] italic font-medium">"{activeVideoModal.text}"</p>
            </div>
          </div>
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-xl w-full bg-[color:var(--c-surface)] text-[color:var(--c-text)] rounded-3xl p-6 border border-[color:var(--c-accent)]/40 shadow-sm space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[color:var(--c-accent)]/30 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[color:var(--c-primary)]">{tx('t.ReviewsPage.dd46e278')}</h3>
                <p className="text-xs text-[color:var(--c-text-muted)] font-medium">{tx('t.ReviewsPage.d76f6506')}</p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 text-[color:var(--c-primary)] hover:bg-[color:var(--c-page)] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-700 mx-auto animate-bounce" />
                <h4 className="font-serif font-bold text-xl text-[color:var(--c-primary)]">{tx('t.ReviewsPage.b0fcfa0d')}</h4>
                <p className="text-xs text-[color:var(--c-text-muted)] font-medium">{tx('t.ReviewsPage.9b9abdc3')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {/* Customer Name */}
                <div>
                  <label className="block text-[color:var(--c-primary)] font-bold mb-1">{tx('t.ReviewsPage.dfd6ae58')}</label>
                  <input
                    type="text"
                    required
                    placeholder={tx('t.ReviewsPage.22c2f81d')}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Business / Profession Name */}
                  <div>
                    <label className="block text-[color:var(--c-primary)] font-bold mb-1">{tx('t.ReviewsPage.e957e32b')}</label>
                    <input
                      type="text"
                      placeholder={tx('t.ReviewsPage.72b1c2e0')}
                      value={formBusiness}
                      onChange={(e) => setFormBusiness(e.target.value)}
                      className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                    />
                  </div>

                  {/* City Name */}
                  <div>
                    <label className="block text-[color:var(--c-primary)] font-bold mb-1">{tx('t.ReviewsPage.873f5747')}</label>
                    <input
                      type="text"
                      required
                      placeholder={tx('t.ReviewsPage.f63656cc')}
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                    />
                  </div>
                </div>

                {/* Rating selection */}
                <div>
                  <label className="block text-[color:var(--c-primary)] font-bold mb-1">{tx('t.ReviewsPage.12dbe66d')}</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${star <= formRating ? 'fill-[color:var(--c-accent)] text-[color:var(--c-accent)]' : 'text-stone-300'}`} />
                      </button>
                    ))}
                    <span className="font-bold text-[color:var(--c-primary)] ml-2 font-mono">{formRating} / 5</span>
                  </div>
                </div>

                {/* Review comment text */}
                <div>
                  <label className="block text-[color:var(--c-primary)] font-bold mb-1">{tx('t.ReviewsPage.0aa83e13')}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={tx('t.ReviewsPage.a99602e7')}
                    value={formReviewText}
                    onChange={(e) => setFormReviewText(e.target.value)}
                    className="w-full px-3 py-2 bg-[color:var(--c-page)] border border-[color:var(--c-accent)]/40 text-[color:var(--c-text)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--c-primary)]"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block text-[color:var(--c-primary)] font-bold">
                    {tx('t.ReviewsPage.0b98ccab')}
                  </label>
                  <div className="border-2 border-dashed border-[color:var(--c-accent)]/40 hover:border-[color:var(--c-accent)] rounded-2xl p-4 text-center bg-[color:var(--c-page)]">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                      id="review-file-input"
                    />
                    <label htmlFor="review-file-input" className="cursor-pointer space-y-1 block">
                      <Upload className="w-6 h-6 text-[color:var(--c-primary)] mx-auto" />
                      <span className="text-xs font-bold text-[color:var(--c-primary)] block">{tx('t.ReviewsPage.a146a247')}</span>
                      <span className="text-[10px] text-[color:var(--c-text-muted)] block font-medium">
                        {tx('t.ReviewsPage.70ca81b9')}
                      </span>
                    </label>
                  </div>

                  {fileError && (
                    <p className="text-[11px] text-rose-800 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" /> {fileError}
                    </p>
                  )}

                  {isProcessingMedia && (
                    <div className="p-2 bg-[color:var(--c-accent)]/20 rounded-xl border border-[color:var(--c-accent)]/40 flex items-center justify-center gap-2 text-[color:var(--c-primary)] text-[11px] font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{tx('t.ReviewsPage.e7bf1699')}</span>
                    </div>
                  )}

                  {/* Compression feedback */}
                  {compressionStats && (
                    <div className="p-2.5 bg-emerald-100 rounded-xl border border-emerald-300 text-emerald-900 text-[11px] font-mono space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {tx('t.ReviewsPage.9f3723f3')}
                      </p>
                      <p className="text-[color:var(--c-text-muted)] font-medium">
                        {tx('t.ReviewsPage.8021a21b')} {compressionStats.origKb} {tx('t.ReviewsPage.a5f84878')} {compressionStats.compKb} {tx('t.ReviewsPage.3cea6c01')}
                        {Math.round((1 - compressionStats.compKb / compressionStats.origKb) * 100)}{tx('t.ReviewsPage.57e1ca0f')}
                      </p>
                    </div>
                  )}

                  {processedThumbnailDataUrl && (
                    <div className="flex items-center gap-2 p-2 bg-[color:var(--c-page)] rounded-xl border border-[color:var(--c-accent)]/40">
                      <img src={processedThumbnailDataUrl} alt="" className="w-12 h-12 object-cover rounded-lg"  loading="lazy" decoding="async" />
                      <div>
                        <span className="font-bold text-xs text-[color:var(--c-primary)] block">{tx('t.ReviewsPage.30ce98c2')}</span>
                        <span className="text-[10px] text-[color:var(--c-text-muted)] font-medium">{tx('t.ReviewsPage.819ec348')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || isProcessingMedia}
                  className="w-full py-3 px-4 bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-extrabold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs mt-2 border border-amber-200"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{tx('t.ReviewsPage.fe20f383')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{tx('t.ReviewsPage.7eede68b')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
