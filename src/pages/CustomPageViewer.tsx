import { useSiteContent } from '../lib/useSiteContent';
import React from 'react';
import { useBooks } from '../context/BookContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { ArrowLeft, Clock, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

interface CustomPageViewerProps {
  pageSlug: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const CustomPageViewer: React.FC<CustomPageViewerProps> = ({ pageSlug, onNavigate }) => {
  const tx = useSiteContent();

  const { siteSettings } = useBooks();
  const customPages = siteSettings?.customPages || [];
  const currentPage = customPages.find(p => p.slug === pageSlug || p.id === pageSlug);

  if (!currentPage) {
    return (
      <div className="py-20 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen text-center px-4">
        <div className="max-w-md mx-auto bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/50 rounded-3xl p-8 shadow-sm space-y-4">
          <BookOpen className="w-12 h-12 text-[color:var(--c-primary)] mx-auto opacity-70" />
          <h2 className="font-serif text-2xl font-extrabold text-[color:var(--c-primary)]">
            {tx('t.CustomPageViewer.ac5af834')}
          </h2>
          <p className="text-xs text-[color:var(--c-text-muted)]">
            {tx('t.CustomPageViewer.91e0fa66')}
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="bg-[color:var(--c-primary)] text-amber-100 font-extrabold text-xs px-6 py-2.5 rounded-2xl shadow-sm hover:bg-red-900 transition-colors"
          >
            {tx('t.CustomPageViewer.80d6bb6d')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[color:var(--c-primary)] hover:underline bg-[color:var(--c-surface)] px-4 py-2 rounded-xl border border-amber-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tx('t.CustomPageViewer.c27e5cfc')}</span>
          </button>
          
          {currentPage.updatedAt && (
            <span className="text-xs text-[color:var(--c-text-muted)] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {tx('t.CustomPageViewer.2a5f04e6')} {currentPage.updatedAt}
            </span>
          )}
        </div>

        {/* Article Container */}
        <div className="bg-[color:var(--c-surface)] border border-[color:var(--c-accent)]/40 rounded-3xl p-6 sm:p-12 shadow-sm space-y-6">
          <div className="border-b border-[color:var(--c-accent)]/30 pb-6 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-[color:var(--c-primary)] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              {tx('t.CustomPageViewer.2e745957')}
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[color:var(--c-primary)] leading-tight">
              {currentPage.title}
            </h1>
          </div>

          {/* Dynamic Content Display */}
          <div className="prose prose-amber max-w-none text-sm sm:text-base leading-relaxed text-[color:var(--c-text)]/95 space-y-4 whitespace-pre-line">
            {currentPage.content}
          </div>

          {/* Footer Badge */}
          <div className="pt-8 border-t border-[color:var(--c-accent)]/30 flex items-center justify-between text-xs text-[color:var(--c-text-muted)]">
            <span className="flex items-center gap-1.5 font-bold text-[color:var(--c-primary)]">
              <ShieldCheck className="w-4 h-4" /> {siteSettings?.siteName || 'शक्ति से शांति'}
            </span>
            <span>{tx('t.CustomPageViewer.90d847c4')}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
