import { useEffect } from 'react';
import { useBooks } from '../../context/BookContext';
import { buildThemeCss, effectiveThemeColors, cleanThemeColors } from '../../utils/themeColors';

export const THEME_STYLE_ID = 'site-theme-colors';
export const THEME_CACHE_KEY = 'site-theme-colors-v1';

/** Mobile browsers colour their address bar from this tag: follow the header colour. */
const setMetaThemeColor = (hex: string) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && /^#[0-9A-F]{6}$/i.test(hex)) meta.setAttribute('content', hex);
};

const apply = (css: string) => {
  let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!css) { el?.remove(); return; }
  if (!el) { el = document.createElement('style'); el.id = THEME_STYLE_ID; document.head.appendChild(el); }
  el.textContent = css;
};

/** Paint the last saved palette immediately on load (before the database answers) so colours don't flash. */
export const applyCachedTheme = () => {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (raw) {
      const colors = cleanThemeColors(JSON.parse(raw));
      apply(buildThemeCss(colors));
      setMetaThemeColor(colors.headerBg || colors.primary || '#6B1D3A');
    }
  } catch { /* no cache — defaults are used */ }
};

/** Applies the Control-Panel palette to the whole public site. */
export const ThemeColorInjector = () => {
  const { siteSettings } = useBooks();
  useEffect(() => {
    const colors = effectiveThemeColors(siteSettings);
    apply(buildThemeCss(colors));
    setMetaThemeColor(colors.headerBg || colors.primary || '#6B1D3A');
    try {
      if (Object.keys(colors).length) localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(colors));
      else localStorage.removeItem(THEME_CACHE_KEY);
    } catch { /* private mode etc. */ }
  }, [siteSettings?.themeColors, siteSettings?.theme?.primaryColor, siteSettings?.theme?.secondaryColor]);
  return null;
};
