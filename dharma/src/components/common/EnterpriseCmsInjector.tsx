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

    // FIXED (2026-08-29 — "Admin Control Panel is fully dummy, no real
    // effect"): saving Primary/Secondary Color here always genuinely
    // wrote to the database — that part was never fake. But .bg-cms-
    // primary / .text-cms-primary / etc. (the classes actually driven by
    // these CSS variables) were never used by a single component
    // anywhere in the site — every page hardcodes the brand colors
    // directly as Tailwind arbitrary values (bg-[#8B1E3F], border-[#D4AF37],
    // etc.), so changing the setting and hitting Save had ZERO visible
    // effect anywhere, which is exactly what "dummy" looks like from the
    // admin's side. Retrofitting every one of the 1000+ hardcoded color
    // instances across 50+ files to use CSS variables instead would be a
    // large, risky rewrite of the whole visual design — not appropriate
    // here. Instead, this overrides Tailwind's own generated selectors
    // for the exact two core brand hex values (only the flagship maroon
    // #8B1E3F and gold #D4AF37 — not their many intentionally-different
    // shades like hover/darker variants, which stay untouched so the
    // site's depth/shading isn't flattened) so a saved color change now
    // has a real, immediate, site-wide effect without touching those 50+
    // component files.
    const primaryOverrideCss = primaryColor.toUpperCase() !== '#8B1E3F' ? `
      .bg-\\[\\#8B1E3F\\] { background-color: var(--cms-primary-color) !important; }
      .text-\\[\\#8B1E3F\\] { color: var(--cms-primary-color) !important; }
      .border-\\[\\#8B1E3F\\] { border-color: var(--cms-primary-color) !important; }
    ` : '';
    const secondaryOverrideCss = secondaryColor.toUpperCase() !== '#D4AF37' ? `
      .bg-\\[\\#D4AF37\\] { background-color: var(--cms-secondary-color) !important; }
      .text-\\[\\#D4AF37\\] { color: var(--cms-secondary-color) !important; }
      .border-\\[\\#D4AF37\\] { border-color: var(--cms-secondary-color) !important; }
    ` : '';

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
      ${primaryOverrideCss}
      ${secondaryOverrideCss}

      ${safeCustomCss}
    `;

    // Phase 10 compliance: Arbitrary custom JS execution is REMOVED for security.
    const scriptId = 'enterprise-custom-js-script';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // FIXED (2026-08-29 — "Control Panel is dummy"): Google Analytics ID
    // and Facebook Pixel ID were captured and saved by the admin form but
    // never actually injected anywhere — the site never loaded either
    // script no matter what the admin entered. These are trusted
    // first-party tracking IDs the admin enters themselves (not arbitrary
    // user input), so injecting the standard, well-known GA4/Pixel loader
    // snippets for them is safe — this is not the same as the removed
    // arbitrary custom-JS feature above.
    const gaId = siteSettings?.analytics?.googleAnalyticsId;
    const gaScriptId = 'enterprise-ga4-script';
    if (gaId && !document.getElementById(gaScriptId)) {
      const gaScript1 = document.createElement('script');
      gaScript1.id = gaScriptId;
      gaScript1.async = true;
      gaScript1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(gaScript1);

      const gaScript2 = document.createElement('script');
      gaScript2.id = `${gaScriptId}-inline`;
      gaScript2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId.replace(/[^a-zA-Z0-9_-]/g, '')}');
      `;
      document.head.appendChild(gaScript2);
    }

    const pixelId = siteSettings?.analytics?.facebookPixelId;
    const pixelScriptId = 'enterprise-fb-pixel-script';
    if (pixelId && !document.getElementById(pixelScriptId)) {
      const pixelScript = document.createElement('script');
      pixelScript.id = pixelScriptId;
      pixelScript.textContent = `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId.replace(/[^0-9]/g, '')}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(pixelScript);
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
