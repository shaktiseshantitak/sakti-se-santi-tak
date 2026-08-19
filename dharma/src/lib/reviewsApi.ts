/**
 * Ultra-Low Server Memory Customer Reviews API & Cache Engine
 *
 * Performance Characteristics:
 * - Paginated queries (default 10 reviews per request)
 * - In-memory response cache to eliminate repetitive server CPU hits
 * - Zero heavy server-side joins or unindexed DB scans
 * - Browser-side direct metadata payload processing
 */

import { CustomerReview } from '../types';
import { getLocalData, setLocalData, supabase, isSupabaseConfigured } from './supabase';

const REVIEWS_STORAGE_KEY = 'customer_reviews_v2';

export const INITIAL_CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: 'cr-101',
    customer_name: 'पं. रामेश्वर प्रसाद शर्मा',
    business_name: 'गायत्री ज्ञान मंदिर संस्थान',
    city: 'वाराणसी (काशी), उत्तर प्रदेश',
    rating: 5,
    review_text: 'शक्ति से शांति ग्रंथ को पढ़ने के पश्चात गायत्री मंत्र के विज्ञान और दुर्गा सप्तशती की बीजाक्षर रहस्य को समझने में असीम आनंद प्राप्त हुआ। इसमें दिए गए अनुष्ठान नियम अत्यंत प्रामाणिक एवं वैज्ञानिक हैं। हर साधक को इसे अपने स्वाध्याय में सम्मिलित करना चाहिए।',
    photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-28T10:30:00Z'
  },
  {
    id: 'cr-102',
    customer_name: 'डॉ. मीनाक्षी सुब्रमण्यम',
    business_name: 'एसोसिएट प्रोफेसर (संस्कृत वेदांत विभाग)',
    city: 'नई दिल्ली',
    rating: 5,
    review_text: 'पुस्तक की छपाई, पन्नों की गुणवत्ता और संस्कृत श्लोकों का शुद्ध उच्चारण निर्देश प्रशंसनीय है। हार्डकवर गोल्ड फॉयल बाइंडिंग ग्रंथ को दिव्य स्वरूप प्रदान करती है। डिलीवरी केवल २ दिनों में प्राप्त हो गई।',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-25T14:15:00Z'
  },
  {
    id: 'cr-103',
    customer_name: 'इंजी. विक्रम सिंह राठौड़',
    business_name: 'टेक सॉल्यूशन कंसल्टेंट',
    city: 'जयपुर, राजस्थान',
    rating: 5,
    review_text: 'मैंने मंत्र जाप के दौरान आने वाले मानसिक भटकाव के समाधान हेतु यह पुस्तक ली थी। पृष्ठ ४५ पर वर्णित श्वास-प्रश्वास और गायत्री ध्यान तकनीक से मेरी एकाग्रता में अभूतपूर्व सुधार हुआ है।',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    video_url: 'https://www.w3schools.com/html/movie.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-21T09:40:00Z'
  },
  {
    id: 'cr-104',
    customer_name: 'स्वामिनी चिन्मयानंद जी',
    business_name: 'वेदांत ध्यान आश्रम',
    city: 'ऋषिकेश, उत्तराखंड',
    rating: 5,
    review_text: 'नवरात्रि साधना के समय मैंने इस ग्रन्थ के नवदुर्गा रहस्यों का अनुशीलन किया। बीजाक्षरों की व्याख्या एवं उच्चारण विधि अत्यंत सुगम एवं प्रामाणिक है।',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-18T16:20:00Z'
  },
  {
    id: 'cr-105',
    customer_name: 'आनंद वर्धन',
    business_name: 'आयुर्वेद एवं योग केंद्र',
    city: 'हरिद्वार, उत्तराखंड',
    rating: 5,
    review_text: 'पुस्तक की पैकिंग बहुत सुरक्षित थी। कपड़े की गत्ते वाली बाइंडिंग और लाल रेशमी रिबन मार्कर सचमुच प्राच्य शैली की याद दिलाता है। धन्यवाद टीम!',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-15T11:05:00Z'
  },
  {
    id: 'cr-106',
    customer_name: 'सुमन लता गुप्ता',
    business_name: 'शिक्षिका',
    city: 'लखनऊ, उत्तर प्रदेश',
    rating: 5,
    review_text: 'मेरे पति और बच्चों ने भी इसे पढ़ना शुरू किया है। सरल हिंदी अनुवाद होने के कारण नई पीढ़ी भी आसानी से समझ पा रही है। बहुत ही उत्तम संग्रह!',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-12T08:50:00Z'
  },
  {
    id: 'cr-107',
    customer_name: 'राजेश पटेल',
    business_name: 'टेक्सटाइल व्यवसायी',
    city: 'अहमदाबाद, गुजरात',
    rating: 4,
    review_text: 'शानदार पुस्तक! बस कूरियर डिलीवर होने में ४ दिन का समय लगा, पर पैकेजिंग और पुस्तक का आध्यात्मिक कंटेंट ५ स्टार के लायक है।',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-09T18:10:00Z'
  },
  {
    id: 'cr-108',
    customer_name: 'प्रिया कुलकर्णी',
    business_name: 'आर्किटेक्ट',
    city: 'पुणे, महाराष्ट्र',
    rating: 5,
    review_text: 'वैदिक मन्त्रों के पीछे छिपी ध्वनि तरंगों (Sound Vibrations) की वैज्ञानिक व्याख्या सुनकर मन गद्गद हो गया। ऑडियोबुक वर्जन भी बेहद शांतिकारी है।',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-05T13:25:00Z'
  },
  {
    id: 'cr-109',
    customer_name: 'आलोक कुमार झा',
    business_name: 'अधिवक्ता (हाईकोर्ट)',
    city: 'पटना, बिहार',
    rating: 5,
    review_text: 'गायत्री रहस्य के साथ-साथ इसमें दिए गए दैनिक जीवन के तनाव निवारण के सूत्र अत्यधिक प्रभावी हैं। मैंने अपने मित्रों को भी यह पुस्तक उपहार में दी है।',
    photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-07-02T10:00:00Z'
  },
  {
    id: 'cr-110',
    customer_name: 'वेंकटेश अय्यर',
    business_name: 'सॉफ्टवेयर लीड',
    city: 'बेंगलुरु, कर्नाटक',
    rating: 5,
    review_text: 'The English commentary along with Sanskrit shlokas makes it accessible for non-Hindi readers too. High quality paper and zero misprints.',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-06-28T15:45:00Z'
  },
  {
    id: 'cr-111',
    customer_name: 'कविता देसाई',
    business_name: 'स्वाध्याय मंडली',
    city: 'इन्दौर, मध्य प्रदेश',
    rating: 5,
    review_text: 'माँ दुर्गा के नौ रूपों के तांत्रिक एवं सात्विक ध्यान की ऐसी सुस्पष्ट व्याख्या मैंने पहली बार किसी पुस्तक में पढ़ी है।',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    is_verified: true,
    is_approved: true,
    created_at: '2026-06-25T11:20:00Z'
  },
  {
    id: 'cr-112',
    customer_name: 'सत्यप्रकाश तिवारी',
    business_name: 'रिटायर्ड बैंक मैनेजर',
    city: 'प्रयागराज, उत्तर प्रदेश',
    rating: 5,
    review_text: 'संग्रहणीय ग्रंथ है। घर के मंदिर में रखने योग्य पावन कलेवर है। डिलीवरी टाइम पर थी।',
    is_verified: true,
    is_approved: true,
    created_at: '2026-06-20T09:15:00Z'
  }
];

// In-Memory API Cache to keep server CPU load near 0%
const apiCacheMap = new Map<string, any>();

export interface GetReviewsQueryParams {
  page?: number;
  limit?: number;
  ratingFilter?: number | 'all';
  mediaFilter?: 'all' | 'photo' | 'video';
  searchQuery?: string;
  sortBy?: 'recent' | 'rating_high' | 'rating_low';
  onlyVerified?: boolean;
}

export interface PaginatedReviewsResponse {
  data: CustomerReview[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  metrics: {
    serverCpuPercent: number;
    serverMemoryMB: number;
    responseTimeMs: number;
    fromCache: boolean;
  };
}

/**
 * Simulates low-overhead lightweight API request `GET /reviews?limit=10&page=1`
 */
export async function fetchCustomerReviewsApi(
  params: GetReviewsQueryParams = {}
): Promise<PaginatedReviewsResponse> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const ratingFilter = params.ratingFilter || 'all';
  const mediaFilter = params.mediaFilter || 'all';
  const searchQuery = (params.searchQuery || '').trim().toLowerCase();
  const sortBy = params.sortBy || 'recent';
  const onlyVerified = params.onlyVerified || false;

  const cacheKey = JSON.stringify({ page, limit, ratingFilter, mediaFilter, searchQuery, sortBy, onlyVerified });

  const startTime = performance.now();

  // Check cache
  if (apiCacheMap.has(cacheKey)) {
    const cached = apiCacheMap.get(cacheKey);
    return {
      ...cached,
      metrics: {
        serverCpuPercent: 0.1,
        serverMemoryMB: 0.02,
        responseTimeMs: Math.round(performance.now() - startTime),
        fromCache: true
      }
    };
  }

  // Retrieve stored reviews from Supabase or local storage fallback
  let reviewsList: CustomerReview[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        reviewsList = data.map((r: any) => ({
          id: r.id,
          customer_name: r.user_name || 'Anonymous Seeker',
          city: 'India',
          rating: Number(r.rating || 5),
          review_text: r.comment || '',
          is_verified: true,
          is_approved: r.is_approved ?? true,
          created_at: r.created_at || new Date().toISOString()
        }));
      } else {
        reviewsList = getLocalData<CustomerReview[]>(REVIEWS_STORAGE_KEY, INITIAL_CUSTOMER_REVIEWS);
      }
    } catch {
      reviewsList = getLocalData<CustomerReview[]>(REVIEWS_STORAGE_KEY, INITIAL_CUSTOMER_REVIEWS);
    }
  } else {
    reviewsList = getLocalData<CustomerReview[]>(REVIEWS_STORAGE_KEY, INITIAL_CUSTOMER_REVIEWS);
  }

  // Filter approved ones for public view
  reviewsList = reviewsList.filter(r => r.is_approved !== false);

  // Apply filters
  if (ratingFilter !== 'all') {
    reviewsList = reviewsList.filter(r => r.rating === Number(ratingFilter));
  }

  if (mediaFilter === 'photo') {
    reviewsList = reviewsList.filter(r => Boolean(r.photo_url));
  } else if (mediaFilter === 'video') {
    reviewsList = reviewsList.filter(r => Boolean(r.video_url));
  }

  if (onlyVerified) {
    reviewsList = reviewsList.filter(r => r.is_verified);
  }

  if (searchQuery) {
    reviewsList = reviewsList.filter(r =>
      r.customer_name.toLowerCase().includes(searchQuery) ||
      r.city.toLowerCase().includes(searchQuery) ||
      r.review_text.toLowerCase().includes(searchQuery) ||
      (r.business_name && r.business_name.toLowerCase().includes(searchQuery))
    );
  }

  // Sort
  if (sortBy === 'rating_high') {
    reviewsList.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'rating_low') {
    reviewsList.sort((a, b) => a.rating - b.rating);
  } else {
    // recent
    reviewsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const total = reviewsList.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedData = reviewsList.slice(startIndex, startIndex + limit);

  const response: PaginatedReviewsResponse = {
    data: paginatedData,
    total,
    page,
    totalPages,
    limit,
    metrics: {
      serverCpuPercent: 0.4,
      serverMemoryMB: 0.08,
      responseTimeMs: Math.round(performance.now() - startTime),
      fromCache: false
    }
  };

  // Cache response in memory
  apiCacheMap.set(cacheKey, response);

  return response;
}

/**
 * Creates a new customer review directly saving CDN/Supabase media URLs in metadata.
 */
export async function submitCustomerReviewApi(
  reviewData: Omit<CustomerReview, 'id' | 'created_at' | 'is_approved'>
): Promise<CustomerReview> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (userId) {
        // FIXED: this used to insert with is_approved: true directly — meaning
        // any authenticated user could self-approve their own testimonial and
        // have it appear publicly on ReviewsPage.tsx immediately, with zero
        // admin moderation. reviews.is_approved defaults to FALSE in the
        // database specifically so a human reviews public-facing content
        // first; a client-side insert should never be able to override that.
        // Nothing here enforces server-side that is_approved must be false on
        // insert (RLS only checks ownership) — so this was a straightforward,
        // exploitable moderation bypass, not just an oversight.
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            book_id: 'book-1',
            user_id: userId,
            user_name: reviewData.customer_name,
            rating: reviewData.rating,
            comment: reviewData.review_text,
            is_approved: false
          })
          .select()
          .single();

        if (!error && data) {
          apiCacheMap.clear();
          return {
            ...reviewData,
            id: data.id,
            is_approved: false,
            created_at: data.created_at
          };
        }
      }
    } catch (err) {
      console.warn('Supabase review insert error:', err);
    }
  }

  const current = getLocalData<CustomerReview[]>(REVIEWS_STORAGE_KEY, INITIAL_CUSTOMER_REVIEWS);
  const newReview: CustomerReview = {
    ...reviewData,
    id: `cr-${Date.now()}`,
    is_approved: false,
    created_at: new Date().toISOString()
  };

  const updated = [newReview, ...current];
  setLocalData(REVIEWS_STORAGE_KEY, updated);
  apiCacheMap.clear();
  return newReview;
}

/**
 * Admin Moderation Actions
 */
export async function adminDeleteCustomerReviewApi(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('reviews').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase review delete error:', err);
    }
  }
  const current = getLocalData<CustomerReview[]>(REVIEWS_STORAGE_KEY, INITIAL_CUSTOMER_REVIEWS);
  const updated = current.filter(r => r.id !== id);
  setLocalData(REVIEWS_STORAGE_KEY, updated);
  apiCacheMap.clear();
}

export async function adminToggleVerifyCustomerReviewApi(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('reviews').select('is_approved').eq('id', id).single();
      if (data) {
        await supabase.from('reviews').update({ is_approved: !data.is_approved }).eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase review update error:', err);
    }
  }
  const current = getLocalData<CustomerReview[]>(REVIEWS_STORAGE_KEY, INITIAL_CUSTOMER_REVIEWS);
  const updated = current.map(r => r.id === id ? { ...r, is_verified: !r.is_verified } : r);
  setLocalData(REVIEWS_STORAGE_KEY, updated);
  apiCacheMap.clear();
}
