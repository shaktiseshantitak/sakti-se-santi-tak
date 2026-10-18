import { useSiteContent } from '../lib/useSiteContent';
import { getBrandName, getSiteDomain } from '../utils/siteDomain';
import React, { useState } from 'react';
import { FileCode, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface SitemapPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({ onNavigate }) => {
  const tx = useSiteContent();

  const { books, categories, siteSettings } = useBooks();
  const [copied, setCopied] = useState<boolean>(false);

  // Generate XML Sitemap string
  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shaktiseshantitak.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://shaktiseshantitak.com/books</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${categories.map(c => `
  <url>
    <loc>https://shaktiseshantitak.com/books/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${books.map(b => `
  <url>
    <loc>https://shaktiseshantitak.com/book/${b.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "BookStore",
    "name": getBrandName(siteSettings),
    "description": "Sacred scripture publishing house in Varanasi",
    "url": `https://${getSiteDomain(siteSettings)}`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": siteSettings.address || "",
      "addressLocality": "Varanasi",
      "addressRegion": "Uttar Pradesh",
      "addressCountry": "IN"
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlSitemap);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="py-8 bg-[color:var(--c-page)] text-[color:var(--c-text)] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'XML Sitemap & Schema.org SEO' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl font-bold text-[color:var(--c-primary)]">
            {tx('t.SitemapPage.8ac6109d')}
          </h1>
          <p className="text-xs text-[color:var(--c-text-muted)] font-medium mt-1">
            {tx('t.SitemapPage.6e9fd173')}
          </p>
        </div>

        <div className="bg-[color:var(--c-surface)] rounded-3xl p-8 border border-[color:var(--c-accent)]/40 shadow-sm space-y-6 my-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-base text-[color:var(--c-primary)] flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[color:var(--c-primary)]" /> {tx('t.SitemapPage.06518380')}
            </h3>
            <button
              onClick={handleCopy}
              className="bg-[color:var(--c-accent)] hover:bg-amber-400 text-[color:var(--c-ink)] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow border border-amber-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied XML' : 'Copy sitemap.xml'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[color:var(--c-ink)] text-amber-200 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-64 border border-[color:var(--c-accent)]/30">
            {xmlSitemap}
          </pre>

          <div className="pt-6 border-t border-[color:var(--c-accent)]/20">
            <h3 className="font-serif font-bold text-base text-[color:var(--c-primary)] mb-2">
              {tx('t.SitemapPage.adcee466')}
            </h3>
            <pre className="p-4 bg-[color:var(--c-ink)] text-amber-200 font-mono text-[11px] rounded-2xl overflow-x-auto border border-[color:var(--c-accent)]/30">
              {JSON.stringify(schemaJsonLd, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
