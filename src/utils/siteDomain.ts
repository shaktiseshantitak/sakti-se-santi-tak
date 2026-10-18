/**
 * Single source of truth for the website's own domain name as shown to
 * visitors (header chip, mobile strip, footer, banners).
 * Editable from Control Panel > Settings > "Website Domain".
 * Only a plain host name is accepted (letters, digits, dots, hyphens) so a
 * typo or pasted URL can never inject anything odd into the page.
 */
export const DEFAULT_SITE_DOMAIN = 'shaktiseshantitak.com';

export const cleanDomain = (raw: string | undefined | null): string => {
  const v = (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(v) ? v : '';
};

export const getSiteDomain = (settings?: { siteDomain?: string } | null): string =>
  cleanDomain(settings?.siteDomain) || DEFAULT_SITE_DOMAIN;

/**
 * Brand name for display. Older saved names look like
 * "शक्ति से शांति (shaktiseshantitak.com)" — the bracketed domain is dropped
 * so the header shows just the name.
 */
export const getBrandName = (settings?: { siteName?: string } | null, fallback = 'शक्ति से शांति तक'): string => {
  const raw = (settings?.siteName || '').replace(/\s*\([^)]*\.[a-z]{2,}[^)]*\)\s*$/i, '').trim();
  return raw || fallback;
};

/** Fallback public email when none is saved: support@<your domain>. Editable in Control Panel > Contact & Emails. */
export const getDefaultSupportEmail = (settings?: { siteDomain?: string } | null): string =>
  `support@${getSiteDomain(settings)}`;
