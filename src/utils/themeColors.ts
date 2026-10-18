/**
 * Website colours — editable from Control Panel > Site Settings > Theme > Colours.
 *
 * Every page colour is a CSS variable (--c-*) whose DEFAULT is the colour the
 * site always had (see index.css). Saved values are applied on top of those
 * defaults at runtime, so an empty/never-saved palette changes nothing.
 *
 * Safety: only keys listed here are read; a value must be a plain #RRGGBB hex
 * (anything else is dropped) — so nothing but a colour can ever reach the
 * <style> element. The admin panel itself ignores the palette (data-admin
 * attribute) so a bad choice can never lock the owner out of readable controls.
 */
export type ColorKey =
  | 'primary' | 'primaryDeep' | 'primaryDarkest' | 'accent' | 'accentLight'
  | 'page' | 'surface' | 'text' | 'textMuted' | 'ink'
  | 'headerBg' | 'headerText' | 'stripBg' | 'footerBg' | 'footerText';

export interface ColorToken {
  key: ColorKey;
  css: string;
  label: string;
  hint: string;
  /** Built-in colour (what the site looked like before this feature). null = follows another colour. */
  fallback: string | null;
  group: 'palette' | 'area';
}

export const COLOR_TOKENS: ColorToken[] = [
  { key: 'primary', css: '--c-primary', label: 'मुख्य रंग (Primary)', hint: 'हेडर, फुटर, बटन और शीर्षकों का गहरा रंग', fallback: '#6B1D3A', group: 'palette' },
  { key: 'primaryDeep', css: '--c-primary-deep', label: 'गहरा मुख्य रंग', hint: 'ऊपरी पट्टी, कार्ड और बटन का गहरा रंग', fallback: '#4F1229', group: 'palette' },
  { key: 'primaryDarkest', css: '--c-primary-darkest', label: 'सबसे गहरा मुख्य रंग', hint: 'hover और सबसे गहरे हिस्से', fallback: '#3F0E21', group: 'palette' },
  { key: 'accent', css: '--c-accent', label: 'सुनहरा/उभार रंग (Accent)', hint: 'बटन, बॉर्डर, आइकन और सितारे', fallback: '#B8923A', group: 'palette' },
  { key: 'accentLight', css: '--c-accent-light', label: 'हल्का उभार रंग', hint: 'गहरे हिस्सों पर लिखे शब्द और लिंक', fallback: '#E3C77E', group: 'palette' },
  { key: 'page', css: '--c-page', label: 'पेज की पृष्ठभूमि (Page Background)', hint: 'पूरी साइट का पीछे का रंग', fallback: '#FAF7F2', group: 'palette' },
  { key: 'surface', css: '--c-surface', label: 'कार्ड की पृष्ठभूमि (Card)', hint: 'कार्ड, बॉक्स और फ़ॉर्म का रंग', fallback: '#FFFCF7', group: 'palette' },
  { key: 'text', css: '--c-text', label: 'मुख्य लेख का रंग (Text)', hint: 'पैराग्राफ और आम लेख', fallback: '#33231B', group: 'palette' },
  { key: 'textMuted', css: '--c-text-muted', label: 'हल्का लेख (Muted Text)', hint: 'उप-शीर्षक और छोटे विवरण', fallback: '#6B5748', group: 'palette' },
  { key: 'ink', css: '--c-ink', label: 'गहरा लेख / बटन के अक्षर (Ink)', hint: 'सुनहरे बटन पर अक्षर और गहरे शीर्षक', fallback: '#2B1B14', group: 'palette' },
  { key: 'headerBg', css: '--c-header-bg', label: 'हेडर की पृष्ठभूमि', hint: 'खाली = मुख्य रंग', fallback: null, group: 'area' },
  { key: 'headerText', css: '--c-header-text', label: 'हेडर के अक्षर', hint: 'खाली = सुनहरे रंग का हल्का शेड', fallback: null, group: 'area' },
  { key: 'stripBg', css: '--c-strip-bg', label: 'हेडर की पतली पट्टियाँ', hint: 'हेल्पलाइन पट्टी और मेन्यू पट्टी; खाली = गहरा मुख्य रंग', fallback: null, group: 'area' },
  { key: 'footerBg', css: '--c-footer-bg', label: 'फुटर की पृष्ठभूमि', hint: 'खाली = मुख्य रंग', fallback: null, group: 'area' },
  { key: 'footerText', css: '--c-footer-text', label: 'फुटर के अक्षर', hint: 'खाली = सुनहरे रंग का हल्का शेड', fallback: null, group: 'area' },
];

export type ThemeColors = Partial<Record<ColorKey, string>>;

const KEYS = new Set<string>(COLOR_TOKENS.map(t => t.key));
export const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Whitelist keys, accept only #RRGGBB, store upper-case. */
export const cleanThemeColors = (raw: unknown): ThemeColors => {
  const out: ThemeColors = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!KEYS.has(k) || typeof v !== 'string') continue;
    const t = v.trim();
    if (HEX6.test(t)) (out as Record<string, string>)[k] = t.toUpperCase();
  }
  return out;
};

/** Old "Primary / Secondary" fields keep working: used only when no palette was saved for that colour. */
export const effectiveThemeColors = (settings?: { themeColors?: unknown; theme?: { primaryColor?: string; secondaryColor?: string } } | null): ThemeColors => {
  const legacy: ThemeColors = {};
  const p = settings?.theme?.primaryColor?.trim().toUpperCase();
  const s = settings?.theme?.secondaryColor?.trim().toUpperCase();
  if (p && HEX6.test(p) && p !== '#6B1D3A') legacy.primary = p;
  if (s && HEX6.test(s) && s !== '#B8923A') legacy.accent = s;
  return { ...legacy, ...cleanThemeColors(settings?.themeColors) };
};

// ---------- colour maths ----------
const toRgb = (hex: string): [number, number, number] => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (c: number[]) => '#' + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export const mixHex = (hex: string, withHex: string, ratio: number): string => {
  const a = toRgb(hex), b = toRgb(withHex);
  return toHex(a.map((v, i) => v + (b[i] - v) * ratio));
};
const lum = (hex: string) => {
  const [r, g, b] = toRgb(hex).map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG contrast ratio (1 – 21). */
export const contrastRatio = (fg: string, bg: string): number => {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

// The site's amber ramp is generated from the accent colour with the same
// tint/shade ratios the original hand-tuned gold ramp used.
const TINTS: [string, [number, number, number]][] = [
  ['50', [0.944, 0.927, 0.904]], ['100', [0.859, 0.817, 0.756]], ['200', [0.718, 0.633, 0.513]],
  ['300', [0.535, 0.422, 0.294]], ['400', [0.324, 0.211, 0.127]],
];
const SHADES: [string, [number, number, number]][] = [
  ['600', [0.163, 0.199, 0.259]], ['700', [0.31, 0.342, 0.345]], ['800', [0.446, 0.466, 0.345]],
  ['900', [0.582, 0.596, 0.414]], ['950', [0.75, 0.76, 0.655]],
];
// Per-channel tint/shade ratios measured from the original hand-tuned gold ramp:
// for the default gold they reproduce it exactly, for any other accent they give the same feel.
export const accentRamp = (accent: string): Record<string, string> => {
  const base = toRgb(accent);
  const r: Record<string, string> = { '500': accent };
  for (const [k, t] of TINTS) r[k] = toHex(base.map((v, i) => v + (255 - v) * t[i]));
  for (const [k, t] of SHADES) r[k] = toHex(base.map((v, i) => v - v * t[i]));
  return r;
};

/** The <style> text for the saved palette ('' when nothing was changed). Not applied inside the admin panel. */
export const buildThemeCss = (colors: ThemeColors): string => {
  const decl: string[] = [];
  for (const t of COLOR_TOKENS) { const v = colors[t.key]; if (v) decl.push(`${t.css}:${v}`); }
  if (colors.accent) {
    for (const [k, v] of Object.entries(accentRamp(colors.accent))) decl.push(`--ramp-${k}:${v}`);
  }
  if (colors.page) decl.push(`--page-top:${mixHex(colors.page, '#FFFFFF', 0.4)}`);
  return decl.length ? `:root:not([data-admin]){${decl.join(';')}}` : '';
};

// ---------- presets ----------
export interface ThemePreset { id: string; label: string; colors: ThemeColors }
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', label: 'मैरून-सुनहरा (मूल)', colors: {} },
  { id: 'saffron', label: 'केसरिया मंदिर', colors: { primary: '#9A3412', primaryDeep: '#7C2D12', primaryDarkest: '#5C1F0B', accent: '#C2790A', accentLight: '#FCD34D', page: '#FFF8F0', surface: '#FFFFFF', text: '#3B2416', textMuted: '#6B5646', ink: '#2A170B' } },
  { id: 'forest', label: 'शांत हरा', colors: { primary: '#1F4D36', primaryDeep: '#163A28', primaryDarkest: '#0F2A1C', accent: '#C9A227', accentLight: '#E8D48A', page: '#F7F8F3', surface: '#FFFFFF', text: '#1F2A22', textMuted: '#55645A', ink: '#14201A' } },
  { id: 'midnight', label: 'रात्रि नीला', colors: { primary: '#1E2F5A', primaryDeep: '#16234A', primaryDarkest: '#0E1936', accent: '#D4A93C', accentLight: '#EBD58F', page: '#F6F7FA', surface: '#FFFFFF', text: '#1D2433', textMuted: '#566078', ink: '#121826' } },
];

// ---------- readability checks shown next to the editor ----------
export interface ContrastPair { id: string; label: string; fg: string; bg: string; min: number }
export const contrastPairs = (colors: ThemeColors): ContrastPair[] => {
  const v = (k: ColorKey) => colors[k] || COLOR_TOKENS.find(t => t.key === k)!.fallback!;
  const accent = v('accent');
  const ramp = accentRamp(accent);
  const headerBg = colors.headerBg || v('primary');
  const headerText = colors.headerText || (colors.accent ? ramp['50'] : '#FBF7EC');
  const footerBg = colors.footerBg || v('primary');
  const footerText = colors.footerText || (colors.accent ? ramp['100'] : '#F5EBCF');
  const stripBg = colors.stripBg || v('primaryDeep');
  return [
    { id: 'text-page', label: 'मुख्य लेख — पेज पर', fg: v('text'), bg: v('page'), min: 4.5 },
    { id: 'text-surface', label: 'मुख्य लेख — कार्ड पर', fg: v('text'), bg: v('surface'), min: 4.5 },
    { id: 'muted-page', label: 'हल्का लेख — पेज पर', fg: v('textMuted'), bg: v('page'), min: 4.5 },
    { id: 'primary-surface', label: 'शीर्षक (मुख्य रंग) — कार्ड पर', fg: v('primary'), bg: v('surface'), min: 4.5 },
    { id: 'ink-accent', label: 'बटन के अक्षर — सुनहरे बटन पर', fg: v('ink'), bg: accent, min: 4.5 },
    { id: 'header', label: 'हेडर के अक्षर — हेडर पर', fg: headerText, bg: headerBg, min: 4.5 },
    { id: 'strip', label: 'हल्का उभार रंग — पतली पट्टी पर', fg: v('accentLight'), bg: stripBg, min: 4.5 },
    { id: 'footer', label: 'फुटर के अक्षर — फुटर पर', fg: footerText, bg: footerBg, min: 4.5 },
  ];
};
