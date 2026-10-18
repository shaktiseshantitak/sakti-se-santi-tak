/** Control Panel > Site Settings: every sub-section, grouped the way an owner thinks about the site. */
export type SettingsSubTabId =
  | 'brand' | 'contact' | 'header_footer' | 'theme'
  | 'store'
  | 'texts' | 'pagecontent' | 'homepage' | 'custom_pages' | 'popups' | 'media'
  | 'analytics' | 'backup';

export interface SettingsNavItem { id: SettingsSubTabId; icon: string; label: string; hint: string }
export interface SettingsNavGroup { label: string; items: SettingsNavItem[] }

export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    label: 'वेबसाइट की पहचान',
    items: [
      { id: 'brand', icon: '🌐', label: 'नाम एवं ब्रांड', hint: 'Brand, domain, tagline' },
      { id: 'contact', icon: '📞', label: 'संपर्क एवं ईमेल', hint: 'Phone, emails, address' },
      { id: 'header_footer', icon: '🖼️', label: 'लोगो एवं फ़ेविकॉन', hint: 'Logo & favicon' },
      { id: 'theme', icon: '🎨', label: 'रंग, थीम एवं स्टाइल', hint: 'Colours, header/footer colours, custom CSS' },
    ],
  },
  {
    label: 'स्टोर',
    items: [
      { id: 'store', icon: '🚚', label: 'शिपिंग एवं भुगतान', hint: 'Shipping, tax, COD' },
    ],
  },
  {
    label: 'सामग्री',
    items: [
      { id: 'texts', icon: '✍️', label: 'पेज के लेख एवं लेबल', hint: 'All page wording' },
      { id: 'pagecontent', icon: '📄', label: 'पेज सामग्री', hint: 'About, FAQ, legal, authors' },
      { id: 'homepage', icon: '🏠', label: 'होमपेज बिल्डर', hint: 'Hero & sections' },
      { id: 'custom_pages', icon: '🗂️', label: 'कस्टम पेज', hint: 'Extra pages' },
      { id: 'popups', icon: '📣', label: 'ऑफर पॉपअप', hint: 'Popups' },
      { id: 'media', icon: '📁', label: 'मीडिया लाइब्रेरी', hint: 'Images & files' },
    ],
  },
  {
    label: 'सिस्टम',
    items: [
      { id: 'analytics', icon: '📊', label: 'एनालिटिक्स व पिक्सल', hint: 'Tracking' },
      { id: 'backup', icon: '💾', label: 'बैकअप व रीस्टोर', hint: 'JSON export' },
    ],
  },
];

export const SETTINGS_TABS: SettingsNavItem[] = SETTINGS_NAV.flatMap(g => g.items);
