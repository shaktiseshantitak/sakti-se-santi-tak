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
  PaginatedReviewsResponse
} from '../lib/reviewsApi';
import {
  validateMediaFile,
  compressImageToWebP,
  generateVideoThumbnailInBrowser
} from '../lib/mediaProcessor';

interface ReviewsPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ onNavigate }) => {
  const { isAdmin } = useAuth();
  const { books } = useBooks();
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
        onlyVerified
      });
      setReviewsResponse(res);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, ratingFilter, mediaFilter, searchQuery, sortBy, onlyVerified]);

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
        is_verified: true
      });

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
    await adminDeleteCustomerReviewApi(id);
    loadReviews();
  };

  const handleToggleVerify = async (id: string) => {
    await adminToggleVerifyCustomerReviewApi(id);
    loadReviews();
  };

  const handleBuyNow = () => {
    addToCart(shaktiBook, 'Hardcover', shaktiBook.languages[0] || 'Hindi', 1);
    onNavigate('checkout', { directBook: shaktiBook });
  };

  return (
    <div className="min-h-screen bg-[#F8F4E8] text-[#4A2C17]">
      {/* Top Banner Header */}
      <PageHeaderBanner
        title="सत्यापित पाठकों एवं साधकों की समीक्षाएं"
        subtitle="100% प्रामाणिक अनुभव — पुस्तक के सम्मानित पाठकों एवं साधकों के विचार व समीक्षाएं"
        onNavigate={onNavigate}
        onBuyNow={handleBuyNow}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* 2. Top Summary & Rating Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Average Rating Score */}
          <div className="md:col-span-4 bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B1E3F]">समग्र संतुष्टि (Overall Rating)</span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-serif text-5xl font-extrabold text-[#8B1E3F]">4.9</span>
                <span className="text-sm text-[#6E4E37] font-bold">/ 5.0 के आधार पर</span>
              </div>

              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>

              <p className="text-xs text-[#6E4E37] font-medium">
                100% सत्यापित पाठकों द्वारा दी गई उत्कृष्ट समीक्षाएं
              </p>
            </div>

            <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-medium">
              <span className="text-[#6E4E37] flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>सत्यापित ख़रीदार (Verified Buyers)</span>
              </span>
              <span className="font-bold text-[#8B1E3F]">98%</span>
            </div>
          </div>

          {/* Rating Breakdown Bars */}
          <div className="md:col-span-5 bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-2.5 flex flex-col justify-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B1E3F] mb-1">स्टार रेटिंग विभाजन</h4>
            
            {[
              { stars: 5, pct: 92, count: '428' },
              { stars: 4, pct: 6, count: '28' },
              { stars: 3, pct: 1, count: '5' },
              { stars: 2, pct: 1, count: '2' },
              { stars: 1, pct: 0, count: '0' }
            ].map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-bold text-[#8B1E3F] flex items-center gap-1">
                  {item.stars} <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                </span>
                <div className="flex-1 h-2 bg-[#F8F4E8] rounded-full overflow-hidden border border-[#D4AF37]/20">
                  <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-[#6E4E37] font-bold text-[11px]">{item.pct}%</span>
              </div>
            ))}
          </div>

          {/* Action Card: Submit Review */}
          <div className="md:col-span-3 bg-[#8B1E3F] text-amber-100 rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-lg text-amber-200">क्या आपने यह पुस्तक पढ़ी है?</h4>
              <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                अपना प्रामाणिक अनुभव और फोटो/वीडियो समीक्षा साझा करें।
              </p>
            </div>

            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold rounded-2xl shadow transition-all flex items-center justify-center gap-2 text-xs border border-amber-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>समीक्षा लिखें (Write Review)</span>
            </button>
          </div>
        </div>

        {/* 3. Search, Filters & Controls Bar */}
        <div className="bg-[#FFF8EE] rounded-3xl p-4 sm:p-5 border border-[#D4AF37]/40 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8B1E3F] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="नाम, शहर या समीक्षा खोजें..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#F8F4E8] text-[#4A2C17] placeholder-[#6E4E37]/60 text-xs rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
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
                className="w-full py-2 px-3 bg-[#F8F4E8] text-[#4A2C17] text-xs font-bold rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              >
                <option value="all">सभी स्टार रेटिंग्स (All Ratings)</option>
                <option value="5">केवल 5 स्टार (5 Stars)</option>
                <option value="4">केवल 4 स्टार (4 Stars)</option>
                <option value="3">3 स्टार एवं ऊपर (3+ Stars)</option>
              </select>
            </div>

            {/* Media Filter Tabs */}
            <div className="flex bg-[#F8F4E8] p-1 rounded-xl border border-[#D4AF37]/40 text-xs font-bold">
              <button
                onClick={() => { setMediaFilter('all'); setPage(1); }}
                className={`flex-1 py-1 px-2 rounded-lg transition-all ${mediaFilter === 'all' ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#6E4E37] hover:text-[#8B1E3F]'}`}
              >
                सभी ({reviewsResponse?.total || 0})
              </button>
              <button
                onClick={() => { setMediaFilter('photo'); setPage(1); }}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${mediaFilter === 'photo' ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#6E4E37] hover:text-[#8B1E3F]'}`}
              >
                <ImageIcon className="w-3 h-3" /> फोटो
              </button>
              <button
                onClick={() => { setMediaFilter('video'); setPage(1); }}
                className={`flex-1 py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${mediaFilter === 'video' ? 'bg-[#8B1E3F] text-amber-100 font-bold' : 'text-[#6E4E37] hover:text-[#8B1E3F]'}`}
              >
                <Video className="w-3 h-3" /> वीडियो
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
                className="w-full py-2 px-3 bg-[#F8F4E8] text-[#4A2C17] text-xs font-bold rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              >
                <option value="recent">नवीनतम प्रथम (Most Recent)</option>
                <option value="rating_high">उच्चतम रेटिंग (Highest Rated)</option>
                <option value="rating_low">निम्नतम रेटिंग (Lowest Rated)</option>
              </select>
            </div>
          </div>

          {/* Checkbox Filter */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#D4AF37]/20">
            <label className="flex items-center gap-2 cursor-pointer text-[#4A2C17] font-bold">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => {
                  setOnlyVerified(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-[#8B1E3F] focus:ring-[#8B1E3F] bg-[#F8F4E8] border-[#D4AF37]"
              />
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> केवल सत्यापित ख़रीदार (Only Verified Buyers)
              </span>
            </label>

            <span className="text-[11px] font-mono text-[#6E4E37] font-bold">
              {reviewsResponse ? `कुल ${reviewsResponse.total} समीक्षाएं मिलीं` : 'लोड हो रहा है...'}
            </span>
          </div>
        </div>

        {/* 4. Reviews List Grid (10 Reviews per Page Request) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F8F4E8]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-[#F8F4E8] rounded w-1/3" />
                    <div className="h-2 bg-[#F8F4E8] rounded w-1/4" />
                  </div>
                </div>
                <div className="h-16 bg-[#F8F4E8] rounded-xl" />
              </div>
            ))}
          </div>
        ) : reviewsResponse?.data.length === 0 ? (
          <div className="bg-[#FFF8EE] rounded-3xl p-12 text-center border border-[#D4AF37]/40 space-y-3">
            <AlertCircle className="w-10 h-10 text-[#8B1E3F] mx-auto" />
            <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">कोई समीक्षा नहीं मिली</h3>
            <p className="text-xs text-[#6E4E37] font-medium">
              कृपया अपने फ़िल्टर या खोज शब्दों में बदलाव करें।
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setRatingFilter('all');
                setMediaFilter('all');
                setOnlyVerified(false);
              }}
              className="px-4 py-2 bg-[#F8F4E8] hover:bg-[#D4AF37]/20 text-[#8B1E3F] text-xs font-bold rounded-xl border border-[#D4AF37]/40"
            >
              फ़िल्टर रीसेट करें
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewsResponse?.data.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm hover:border-[#D4AF37] transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* Admin Quick Action Bar */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleVerify(rev.id)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all ${rev.is_verified ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-[#F8F4E8] text-[#6E4E37] border-[#D4AF37]/40'}`}
                      title="Toggle Verified Badge"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg border border-rose-300 text-[10px]"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8B1E3F] text-amber-100 font-bold flex items-center justify-center text-sm shadow shrink-0 border border-[#D4AF37]/40">
                      {rev.customer_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-[#8B1E3F] truncate">{rev.customer_name}</h4>
                        {rev.is_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-md border border-emerald-300">
                            <CheckCircle className="w-3 h-3" /> ख़रीदार
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#6E4E37] font-medium mt-0.5">
                        {rev.business_name && (
                          <span className="text-[#8B1E3F] font-bold truncate">{rev.business_name} • </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#D4AF37]" /> {rev.city}
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
                          className={`w-4 h-4 ${star <= rev.rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-[#6E4E37] font-bold">
                      {new Date(rev.created_at).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Review Text Body */}
                  <p className="text-xs text-[#4A2C17] leading-relaxed italic font-medium">
                    "{rev.review_text}"
                  </p>
                </div>

                {/* Media Section: Photos / Click-to-Play Videos */}
                {(rev.photo_url || rev.video_url) && (
                  <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center gap-3">
                    {/* Photo Media Attachment */}
                    {rev.photo_url && (
                      <button
                        onClick={() => setLightboxImage({
                          url: rev.photo_url!,
                          title: rev.review_text,
                          author: rev.customer_name
                        })}
                        className="relative group/img overflow-hidden rounded-xl border border-[#D4AF37]/40 aspect-square w-20 shrink-0 bg-[#F8F4E8]"
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
                        className="relative group/vid overflow-hidden rounded-xl border border-[#D4AF37]/40 aspect-video h-20 bg-[#F8F4E8] flex-1 flex items-center justify-center"
                      >
                        <img
                          src={rev.thumbnail_url || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80'}
                          alt="Video review thumbnail"
                          className="w-full h-full object-cover opacity-80 group-hover/vid:scale-105 transition-transform duration-300"
                         loading="lazy" decoding="async" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#3A1F0D] flex items-center justify-center shadow-sm group-hover/vid:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-[#3A1F0D] ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1.5 bg-[#8B1E3F] text-amber-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          वीडियो रिव्यू ▶
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
          <div className="bg-[#FFF8EE] rounded-2xl p-4 border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#6E4E37] font-bold font-mono">
              पृष्ठ {reviewsResponse.page} / {reviewsResponse.totalPages} (प्रति अनुरोध 10 समीक्षाएं)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-[#F8F4E8] hover:bg-[#D4AF37]/20 disabled:opacity-40 text-xs font-bold text-[#8B1E3F] rounded-xl border border-[#D4AF37]/40 transition-all flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> पिछला (Prev)
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: reviewsResponse.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${p === page ? 'bg-[#8B1E3F] text-amber-100 shadow border border-[#D4AF37]/40' : 'bg-[#F8F4E8] text-[#4A2C17] hover:bg-[#D4AF37]/20'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                disabled={page === reviewsResponse.totalPages}
                onClick={() => setPage(prev => Math.min(reviewsResponse.totalPages, prev + 1))}
                className="px-3 py-1.5 bg-[#F8F4E8] hover:bg-[#D4AF37]/20 disabled:opacity-40 text-xs font-bold text-[#8B1E3F] rounded-xl border border-[#D4AF37]/40 transition-all flex items-center gap-1"
              >
                अगला (Next) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX PHOTO MODAL */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#FFF8EE] rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-sm flex flex-col">
            <div className="p-4 bg-[#8B1E3F] text-amber-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-amber-100">{lightboxImage.author} द्वारा फोटो</h4>
                <p className="text-xs text-amber-200/80 truncate max-w-lg">"{lightboxImage.title}"</p>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-2 bg-[#FFF8EE]/20 hover:bg-[#FFF8EE]/30 text-amber-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#F8F4E8] flex items-center justify-center max-h-[75vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.author}
                className="max-h-[70vh] object-contain rounded-xl border border-[#D4AF37]/30 shadow-xs"
               loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      )}

      {/* CLICK-TO-PLAY VIDEO MODAL */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-[#FFF8EE] rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-sm">
            <div className="p-4 bg-[#8B1E3F] text-amber-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-amber-200">वीडियो समीक्षा — {activeVideoModal.author}</h4>
                <p className="text-xs text-amber-100/80">लाइव वीडियो अनुभव</p>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-2 bg-[#FFF8EE]/20 hover:bg-[#FFF8EE]/30 text-amber-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-[#FFF8EE] border-t border-[#D4AF37]/30">
              <p className="text-xs text-[#4A2C17] italic font-medium">"{activeVideoModal.text}"</p>
            </div>
          </div>
        </div>
      )}

      {/* WRITE A REVIEW MODAL */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-xl w-full bg-[#FFF8EE] text-[#4A2C17] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#8B1E3F]">अपनी समीक्षा साझा करें</h3>
                <p className="text-xs text-[#6E4E37] font-medium">ब्राउज़र-साइड WebP प्रोसेसिंग के साथ तेज़ अपलोड</p>
              </div>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="p-1.5 text-[#8B1E3F] hover:bg-[#F8F4E8] rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-700 mx-auto animate-bounce" />
                <h4 className="font-serif font-bold text-xl text-[#8B1E3F]">धन्यवाद! समीक्षा सबमिट हो गई।</h4>
                <p className="text-xs text-[#6E4E37] font-medium">आपकी समीक्षा सफलता से लाइव समीक्षा सूची में जोड़ दी गई है।</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {/* Customer Name */}
                <div>
                  <label className="block text-[#8B1E3F] font-bold mb-1">आपका नाम (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. पं. शिवकुमार शास्त्री"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Business / Profession Name */}
                  <div>
                    <label className="block text-[#8B1E3F] font-bold mb-1">व्यवसाय / पद (वैकल्पिक)</label>
                    <input
                      type="text"
                      placeholder="उदा. प्रोफेसर / योग साधक"
                      value={formBusiness}
                      onChange={(e) => setFormBusiness(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>

                  {/* City Name */}
                  <div>
                    <label className="block text-[#8B1E3F] font-bold mb-1">शहर / राज्य *</label>
                    <input
                      type="text"
                      required
                      placeholder="उदा. वाराणसी, उत्तर प्रदेश"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>
                </div>

                {/* Rating selection */}
                <div>
                  <label className="block text-[#8B1E3F] font-bold mb-1">स्टार रेटिंग (Rating) *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${star <= formRating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-stone-300'}`} />
                      </button>
                    ))}
                    <span className="font-bold text-[#8B1E3F] ml-2 font-mono">{formRating} / 5</span>
                  </div>
                </div>

                {/* Review comment text */}
                <div>
                  <label className="block text-[#8B1E3F] font-bold mb-1">समीक्षा विवरण (Review Text) *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="ग्रंथ पढ़ने के बाद अपना अनुभव लिखें..."
                    value={formReviewText}
                    onChange={(e) => setFormReviewText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 text-[#4A2C17] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block text-[#8B1E3F] font-bold">
                    फोटो या वीडियो अपलोड करें (ब्राउज़र कम्प्रेशन सक्षम)
                  </label>
                  <div className="border-2 border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] rounded-2xl p-4 text-center bg-[#F8F4E8]">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      onChange={handleFileChange}
                      className="hidden"
                      id="review-file-input"
                    />
                    <label htmlFor="review-file-input" className="cursor-pointer space-y-1 block">
                      <Upload className="w-6 h-6 text-[#8B1E3F] mx-auto" />
                      <span className="text-xs font-bold text-[#8B1E3F] block">फ़ाइल चुनें (Max 5MB Image / 25MB Video)</span>
                      <span className="text-[10px] text-[#6E4E37] block font-medium">
                        क्लाइंट ब्राउज़र में स्वचालित रूप से WebP में कनवर्ट होगा
                      </span>
                    </label>
                  </div>

                  {fileError && (
                    <p className="text-[11px] text-rose-800 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" /> {fileError}
                    </p>
                  )}

                  {isProcessingMedia && (
                    <div className="p-2 bg-[#D4AF37]/20 rounded-xl border border-[#D4AF37]/40 flex items-center justify-center gap-2 text-[#8B1E3F] text-[11px] font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ब्राउज़र कैनवास में WebP इमेज प्रोसेस हो रही है...</span>
                    </div>
                  )}

                  {/* Compression feedback */}
                  {compressionStats && (
                    <div className="p-2.5 bg-emerald-100 rounded-xl border border-emerald-300 text-emerald-900 text-[11px] font-mono space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ब्राउज़र WebP कम्प्रेशन सफल!
                      </p>
                      <p className="text-[#6E4E37] font-medium">
                        मूल आकार: {compressionStats.origKb} KB ➔ कनवर्टेड WebP: {compressionStats.compKb} KB (
                        {Math.round((1 - compressionStats.compKb / compressionStats.origKb) * 100)}% सर्वर बैंडविड्थ बचत)
                      </p>
                    </div>
                  )}

                  {processedThumbnailDataUrl && (
                    <div className="flex items-center gap-2 p-2 bg-[#F8F4E8] rounded-xl border border-[#D4AF37]/40">
                      <img src={processedThumbnailDataUrl} alt="" className="w-12 h-12 object-cover rounded-lg"  loading="lazy" decoding="async" />
                      <div>
                        <span className="font-bold text-xs text-[#8B1E3F] block">वीडियो थंबनेल निकाला गया</span>
                        <span className="text-[10px] text-[#6E4E37] font-medium">शून्य सर्वर ट्रांसकोडिंग लागत</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting || isProcessingMedia}
                  className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-extrabold rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs mt-2 border border-amber-200"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>समीक्षा सबमिट हो रही है...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>समीक्षा प्रकाशित करें (Publish Review)</span>
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
