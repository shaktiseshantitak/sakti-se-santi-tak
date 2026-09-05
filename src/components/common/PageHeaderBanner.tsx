import React from 'react';
import { ChevronRight, Sparkles, ShoppingCart, ArrowLeft } from 'lucide-react';

interface PageHeaderBannerProps {
  title: string;
  subtitle?: string;
  onNavigate: (page: string) => void;
  onBuyNow?: () => void;
}

export const PageHeaderBanner: React.FC<PageHeaderBannerProps> = ({
  title,
  subtitle,
  onNavigate,
  onBuyNow,
}) => {
  return (
    <div className="relative bg-[#66122C] text-amber-50 py-8 px-4 sm:px-8 border-b border-amber-500/30 overflow-hidden shadow-sm">
      {/* Background Mandala Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(217,119,6,0.18),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-amber-300 font-medium">
            <button
              onClick={() => onNavigate('home')}
              className="hover:underline hover:text-amber-100 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>मुख्य पृष्ठ (Home)</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-100 font-bold underline decoration-amber-500/50">
              {title}
            </span>
          </nav>

          {/* Page Title */}
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-amber-100 tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{title}</span>
          </h1>

          {subtitle && (
            <p className="text-xs sm:text-sm text-amber-200/80 font-medium max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Quick Buy CTA */}
        {onBuyNow && (
          <button
            onClick={onBuyNow}
            className="self-start sm:self-center bg-[#D4AF37] hover:from-amber-400 hover:to-amber-300 text-red-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 border border-amber-300 shrink-0 transition-transform active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>अभी प्राप्त करें (Buy Now @ ₹499)</span>
          </button>
        )}
      </div>
    </div>
  );
};
