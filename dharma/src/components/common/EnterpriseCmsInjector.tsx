import React, { useEffect, useState } from 'react';
import { useBooks } from '../../context/BookContext';
import { X, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';

interface EnterpriseCmsInjectorProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const EnterpriseCmsInjector: React.FC<EnterpriseCmsInjectorProps> = ({ onNavigate }) => {
  const { siteSettings } = useBooks();
  const theme = siteSettings?.theme;
  const popups = siteSettings?.popups || [];

  const [activePopup, setActivePopup] = useState<any | null>(null);

  // Apply Custom CSS & Theme Styles
  useEffect(() => {
    // 1. Favicon Injection
    if (siteSettings?.header?.faviconUrl) {
      let fav = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!fav) {
        fav = document.createElement('link');
        fav.rel = 'icon';
        document.head.appendChild(fav);
      }
      fav.href = siteSettings.header.faviconUrl;
    }

    // 2. Dynamic Style Element for Primary/Secondary Theme Colors & Custom CSS (Sanitized)
    const styleId = 'enterprise-custom-theme-css';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const primaryColor = (theme?.primaryColor || '#8B1E3F').replace(/[^a-zA-Z0-9#,-.()]/g, '');
    const secondaryColor = (theme?.secondaryColor || '#D4AF37').replace(/[^a-zA-Z0-9#,-.()]/g, '');
    const borderRadius = Math.min(64, Math.max(0, parseInt(String(theme?.borderRadiusPx || 16), 10) || 16));

    // Strip out dangerous CSS rules like @import, expression(), javascript:
    const safeCustomCss = (theme?.customCss || '')
      .replace(/@import/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    styleEl.textContent = `
      :root {
        --cms-primary-color: ${primaryColor};
        --cms-secondary-color: ${secondaryColor};
        --cms-border-radius: ${borderRadius}px;
      }
      .bg-cms-primary { background-color: var(--cms-primary-color) !important; }
      .text-cms-primary { color: var(--cms-primary-color) !important; }
      .border-cms-primary { border-color: var(--cms-primary-color) !important; }
      .bg-cms-secondary { background-color: var(--cms-secondary-color) !important; }
      .text-cms-secondary { color: var(--cms-secondary-color) !important; }
      .border-cms-secondary { border-color: var(--cms-secondary-color) !important; }
      
      ${safeCustomCss}
    `;

    // Phase 10 compliance: Arbitrary custom JS execution is REMOVED for security.
    const scriptId = 'enterprise-custom-js-script';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
  }, [siteSettings, theme]);

  // Check for Active Popups (Shown once per session)
  useEffect(() => {
    const shownSessionKey = 'popup_shown_session';
    const isShown = sessionStorage.getItem(shownSessionKey);

    if (!isShown && popups.length > 0) {
      const activeOne = popups.find(p => p.active);
      if (activeOne) {
        const timer = setTimeout(() => {
          setActivePopup(activeOne);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [popups]);

  const handleClosePopup = () => {
    sessionStorage.setItem('popup_shown_session', 'true');
    setActivePopup(null);
  };

  const handlePopupClick = () => {
    handleClosePopup();
    if (activePopup?.buttonUrl) {
      onNavigate(activePopup.buttonUrl);
    } else {
      onNavigate('checkout');
    }
  };

  if (!activePopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FFF8EE] text-[#4A2C17] border-2 border-[#D4AF37] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 text-center overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={handleClosePopup}
          className="absolute top-4 right-4 p-2 text-[#8B1E3F] hover:bg-amber-100 rounded-full transition-colors"
          title="Close Popup"
        >
          <X className="w-5 h-5" />
        </button>

        {activePopup.imageUrl && (
          <div className="w-full h-44 rounded-2xl overflow-hidden shadow-md border border-[#D4AF37]/40">
            <img
              src={activePopup.imageUrl}
              alt={activePopup.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-[#8B1E3F] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {activePopup.title || 'विशेष ऑफर'}
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-[#8B1E3F] leading-snug">
            {activePopup.headline}
          </h3>
          <p className="text-xs sm:text-sm text-[#4A2C17]/90 leading-relaxed max-w-md mx-auto">
            {activePopup.bodyText}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handlePopupClick}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#3A1F0D] font-extrabold text-sm px-6 py-3 rounded-2xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-[#3A1F0D]" />
            <span>{activePopup.buttonText || 'अभी लाभ उठाएं'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleClosePopup}
            className="text-xs text-[#8B1E3F] font-bold hover:underline py-2"
          >
            रहने दें, बाद में देखेंगे
          </button>
        </div>

      </div>
    </div>
  );
};
