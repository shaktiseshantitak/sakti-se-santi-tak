import React from 'react';
import { ShaktiHeroBanner } from '../components/home/ShaktiHeroBanner';
import { TrustSection } from '../components/home/TrustSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { SacredStats } from '../components/home/SacredStats';
import { FaqSection } from '../components/home/FaqSection';
import { BuyCtaSection } from '../components/home/BuyCtaSection';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { 
  HelpCircle, Sparkles, Award, Star, ArrowRight, BookOpen, 
  FileText, Image as ImageIcon, MessageSquare, ShoppingBag, 
  ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useCart } from '../context/CartContext';
import { Book } from '../types';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onSelectBook: (book: Book) => void;
  onQuickView?: (book: Book) => void;
  onSelectBlog?: (blog: any) => void;
  onOpenLiveStream?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectBlog,
}) => {
  const { books, testimonials, blogs, siteSettings } = useBooks();
  const { addToCart } = useCart();

  const heroBookId = siteSettings?.featuredHeroBookId || 'book-shakti';
  const shaktiBook = books.find(b => b.id === heroBookId) || books.find(b => b.isFeatured) || books[0];

  const handleBuyNow = (bookToBuy?: Book) => {
    const targetBook = bookToBuy || shaktiBook;
    addToCart(targetBook, 'Hardcover', targetBook.languages[0] || 'Hindi', 1);
    onNavigate('checkout', { directBook: targetBook });
  };

  const navCards = [
    {
      id: 'book-details',
      title: 'पुस्तक विवरण एवं अध्याय',
      subtitle: 'ग्रंथ का परिचय, पृष्ठ संख्या व सूचकांक',
      icon: BookOpen,
      badge: 'मुख्य ग्रंथ',
      color: 'from-amber-700 to-amber-900',
      action: () => onNavigate('book-details', { bookId: shaktiBook.id }),
    },
    {
      id: 'curiosity',
      title: 'जिज्ञासा व समाधान',
      subtitle: 'मंत्र जप के बाद भी शांति क्यों नहीं मिलती?',
      icon: HelpCircle,
      badge: 'अध्यात्म समाधान',
      color: 'from-amber-800 to-amber-950',
      action: () => onNavigate('curiosity'),
    },
    {
      id: 'gayatri-secrets',
      title: '24 देवशक्तियाँ व रहस्य',
      subtitle: 'गायत्री मंत्र के 24 अक्षरों की अलौकिक गुप्त शक्तियाँ',
      icon: Sparkles,
      badge: 'मंत्र रहस्य',
      color: 'from-[#8B1E3F] to-[#5C142B]',
      action: () => onNavigate('gayatri-secrets'),
    },
    {
      id: 'authors',
      title: 'लेखक परिचय',
      subtitle: 'कुंजेश शर्मा एवं पूनम शर्मा की साधना यात्रा',
      icon: Award,
      badge: 'मार्गदर्शक',
      color: 'from-amber-700 to-[#8B1E3F]',
      action: () => onNavigate('authors'),
    },
    {
      id: 'reviews',
      title: 'पाठक समीक्षाएं व अनुभव',
      subtitle: '1,480+ साधकों के वास्तविक अनुभव व रेटिंग्स',
      icon: Star,
      badge: '4.95/5 ★',
      color: 'from-amber-600 to-amber-800',
      action: () => onNavigate('reviews'),
    },
    {
      id: 'blogs',
      title: 'ज्ञान मंच व लेख',
      subtitle: 'गायत्री महामंत्र, साधना व वैदिक दर्शन पर शोध पत्र',
      icon: FileText,
      badge: 'नवीनतम लेख',
      color: 'from-amber-800 to-amber-900',
      action: () => onNavigate('blogs'),
    },
    {
      id: 'faq',
      title: 'अक्सर पूछे जाने वाले प्रश्न',
      subtitle: 'डिलिवरी, बाइंडिंग, पेमेंट व साधना सम्बंधी उत्तर',
      icon: MessageSquare,
      badge: 'FAQ',
      color: 'from-amber-900 to-[#4A2C17]',
      action: () => onNavigate('faq'),
    },
    {
      id: 'gallery',
      title: 'चित्र एवं प्रकाशन गैलरी',
      subtitle: 'ग्रंथ के हस्तनिर्मित चित्र व विमोचन दृश्य',
      icon: ImageIcon,
      badge: 'फोटो गैलरी',
      color: 'from-[#8B1E3F] to-amber-900',
      action: () => onNavigate('gallery'),
    },
    {
      id: 'books',
      title: 'संपूर्ण पुस्तक स्टोर',
      subtitle: 'गीता, उपनिषद एवं वैदिक साहित्य संग्रह',
      icon: ShoppingBag,
      badge: 'स्टोर',
      color: 'from-[#4A2C17] to-[#2B180B]',
      action: () => onNavigate('books'),
    },
  ];

  return (
    <div className="bg-[#F8F4E8] text-[#4A2C17] pb-16 space-y-12">
      
      {/* 1. Main Hero Banner */}
      <ShaktiHeroBanner
        shaktiBook={shaktiBook}
        onBuyNow={handleBuyNow}
        onAuthorsClick={() => onNavigate('authors')}
      />

      {/* 2. Trust & Features Section */}
      <TrustSection />

      {/* 3. Single Featured Book Concise Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#8B1E3F] to-[#5C142B] text-amber-100 rounded-3xl p-6 sm:p-10 shadow-xl border border-amber-400/30 flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              100% प्रामाणिक वैदिक ग्रंथ • हार्डकवर संस्करण
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-extrabold leading-tight text-white">
              {shaktiBook?.title || 'शक्ति से शांति तक'}
            </h3>
            <p className="text-xs sm:text-base text-amber-200/90 leading-relaxed">
              {shaktiBook?.description || 'गायत्री महामंत्र एवं दुर्गा मंत्र की अंतर्यात्रा रहस्य तथा अंतर्मन की 24 देवशक्तियों को उजागर करने वाला प्रामाणिक ग्रंथ।'}
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => handleBuyNow(shaktiBook)}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#3A1F0D] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-transform active:scale-95"
              >
                ₹{shaktiBook?.offerPrice || 499} में आर्डर करें (Buy Now)
              </button>
              <button
                onClick={() => onNavigate('book-details', { bookId: shaktiBook.id })}
                className="bg-white/10 hover:bg-white/20 text-amber-100 font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl border border-amber-300/30 transition-colors inline-flex items-center gap-1.5"
              >
                <span>पूरा विवरण एवं विषय-सूची पढ़ें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="shrink-0 w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40 transform hover:scale-105 transition-transform duration-300">
            <OptimizedImage
              src={shaktiBook?.coverImage || 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80'}
              alt={shaktiBook?.title || 'Shakti Se Shanti'}
              targetWidth={500}
              priority={false}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* 4. Social Proof & Testimonials / Sacred Stats */}
      {testimonials && testimonials.length > 0 && (
        <TestimonialsSection testimonials={testimonials} />
      )}
      <SacredStats />

      {/* 5. Main Navigation Hub - 9 Page-Wise Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-[#8B1E3F] text-xs font-extrabold uppercase tracking-widest border border-amber-400/40">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            संपूर्ण वेबसाइट नेविगेशन
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#8B1E3F]">
            विषयानुसार समर्पित पृष्ठ चुनें
          </h2>
          <p className="text-xs sm:text-sm text-[#4A2C17]/90">
            नीचे दिए गए कार्ड्स पर क्लिक करके सीधे अपनी पसंद के विषय या पृष्ठ पर जाएँ:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {navCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={card.action}
                className="group relative text-left bg-[#FFF8EE] hover:bg-white rounded-3xl p-6 border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-amber-100 shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-[#8B1E3F] border border-amber-300/50 uppercase tracking-wide">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-extrabold text-lg text-[#8B1E3F] group-hover:text-amber-900 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#6E4E37] mt-1 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-bold text-[#8B1E3F]">
                  <span>पृष्ठ खोलें</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Authors Highlights Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFF8EE] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">मार्गदर्शक लेखकद्वय</span>
            <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#8B1E3F]">
              कुंजेश शर्मा एवं पूनम शर्मा (Kunjesh & Poonam Sharma)
            </h3>
            <p className="text-xs sm:text-sm text-[#4A2C17]/90 max-w-2xl">
              वैदिक शोधकर्ता एवं मंत्र साधक दंपति जिन्होंने गायत्री मंत्र और दुर्गा सप्तशती के आभ्यंतर रहस्यों को जन-जन के लिए प्रस्तुत किया है।
            </p>
          </div>
          <button
            onClick={() => onNavigate('authors')}
            className="shrink-0 bg-[#8B1E3F] hover:bg-red-900 text-amber-100 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-sm inline-flex items-center gap-2"
          >
            <span>लेखक का पूरा जीवन परिचय देखें</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 7. Recent Blog Articles Preview */}
      {blogs && blogs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">ज्ञान मंच</span>
              <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#8B1E3F]">
                नवीनतम आध्यात्मिक लेख एवं शोध
              </h3>
            </div>
            <button
              onClick={() => onNavigate('blogs')}
              className="text-xs font-extrabold text-[#8B1E3F] hover:text-amber-900 inline-flex items-center gap-1 bg-[#FFF8EE] px-4 py-2 rounded-xl border border-amber-300"
            >
              <span>सभी लेख पढ़ें ({blogs.length}+)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.slice(0, 3).map((blog) => (
              <div
                key={blog.id}
                onClick={() => {
                  if (onSelectBlog) onSelectBlog(blog);
                  onNavigate('blog-post', { blogId: blog.id });
                }}
                className="bg-[#FFF8EE] rounded-2xl p-4 border border-[#D4AF37]/30 hover:border-[#D4AF37] cursor-pointer shadow-xs hover:shadow-md transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    {blog.category}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-[#8B1E3F] mt-2 line-clamp-2">
                    {blog.title}
                  </h4>
                  <p className="text-xs text-[#6E4E37] line-clamp-2 mt-1">
                    {blog.excerpt}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-amber-800 pt-2 flex items-center justify-between border-t border-amber-200/50">
                  <span>{blog.readTime || '5 min read'}</span>
                  <span className="text-[#8B1E3F] flex items-center gap-1">पढ़ें <ArrowRight className="w-3 h-3" /></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. FAQ Section */}
      <FaqSection />

      {/* 9. Buy Section (Large Order CTA) */}
      <BuyCtaSection
        shaktiBook={shaktiBook}
        onBuyNow={handleBuyNow}
      />

    </div>
  );
};


