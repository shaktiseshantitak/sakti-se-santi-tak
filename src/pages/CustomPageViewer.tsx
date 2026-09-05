import React from 'react';
import { useBooks } from '../context/BookContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { ArrowLeft, Clock, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface CustomPageViewerProps {
  pageSlug: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CustomPageViewer: React.FC<CustomPageViewerProps> = ({ pageSlug, onNavigate }) => {
  const { siteSettings } = useBooks();
  const customPages = siteSettings?.customPages || [];
  const currentPage = customPages.find(p => p.slug === pageSlug || p.id === pageSlug);

  if (!currentPage) {
    return (
      <div className="py-20 bg-[#F8F4E8] text-[#4A2C17] min-h-screen text-center px-4">
        <div className="max-w-md mx-auto bg-[#FFF8EE] border border-[#D4AF37]/50 rounded-3xl p-8 shadow-sm space-y-4">
          <BookOpen className="w-12 h-12 text-[#8B1E3F] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-extrabold text-[#8B1E3F]">
            पृष्ठ उपलब्ध नहीं है (Page Not Found)
          </h2>
          <p className="text-xs text-[#6E4E37]">
            अनुरोधित पृष्ठ हटा दिया गया है अथवा एडमिन से प्रकाशित नहीं किया गया है।
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-[#8B1E3F] text-amber-100 font-extrabold text-xs px-6 py-2.5 rounded-2xl shadow-sm hover:bg-red-900 transition-colors"
          >
            मुख्य पृष्ठ पर लौटें (Return Home)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#8B1E3F] hover:underline bg-[#FFF8EE] px-4 py-2 rounded-xl border border-amber-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>मुख्य पृष्ठ पर वापस जाएँ</span>
          </button>
          
          {currentPage.updatedAt && (
            <span className="text-xs text-[#6E4E37] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> अंतिम अद्यतन: {currentPage.updatedAt}
            </span>
          )}
        </div>

        {/* Article Container */}
        <div className="bg-[#FFF8EE] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-12 shadow-sm space-y-6">
          <div className="border-b border-[#D4AF37]/30 pb-6 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-[#8B1E3F] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              आधिकारिक प्रकाशन एवं जानकारी
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#8B1E3F] leading-tight">
              {currentPage.title}
            </h1>
          </div>

          {/* Dynamic Content Display */}
          <div className="prose prose-amber max-w-none text-sm sm:text-base leading-relaxed text-[#4A2C17]/95 space-y-4 whitespace-pre-line">
            {currentPage.content}
          </div>

          {/* Footer Badge */}
          <div className="pt-8 border-t border-[#D4AF37]/30 flex items-center justify-between text-xs text-[#6E4E37]">
            <span className="flex items-center gap-1.5 font-bold text-[#8B1E3F]">
              <ShieldCheck className="w-4 h-4" /> {siteSettings?.siteName || 'शक्ति से शांति'}
            </span>
            <span>shaktiseshanti.com</span>
          </div>
        </div>

      </div>
    </div>
  );
};
