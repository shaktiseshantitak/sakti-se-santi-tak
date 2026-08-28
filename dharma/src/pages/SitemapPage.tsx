import React, { useState } from 'react';
import { FileCode, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useBooks } from '../context/BookContext';

interface SitemapPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({ onNavigate }) => {
  const { books, categories } = useBooks();
  const [copied, setCopied] = useState<boolean>(false);

  // Generate XML Sitemap string
  const xmlSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shaktiseshanti.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://shaktiseshanti.com/books</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${categories.map(c => `
  <url>
    <loc>https://shaktiseshanti.com/books/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  ${books.map(b => `
  <url>
    <loc>https://shaktiseshanti.com/book/${b.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "BookStore",
    "name": "Shakti Se Shanti Tak",
    "description": "Sacred scripture publishing house in Varanasi",
    "url": "https://shaktiseshanti.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Assi Ghat Road",
      "addressLocality": "Varanasi",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "221005",
      "addressCountry": "IN"
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlSitemap);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'XML Sitemap & Schema.org SEO' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6">
          <h1 className="font-serif text-3xl font-bold text-[#8B1E3F]">
            SEO Indexing & XML Sitemap Export
          </h1>
          <p className="text-xs text-[#6E4E37] font-medium mt-1">
            Production search engine XML sitemap and Schema.org structured data for Google Books index.
          </p>
        </div>

        <div className="bg-[#FFF8EE] rounded-3xl p-8 border border-[#D4AF37]/40 shadow-sm space-y-6 my-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-base text-[#8B1E3F] flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#8B1E3F]" /> XML Sitemap (sitemap.xml)
            </h3>
            <button
              onClick={handleCopy}
              className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow border border-amber-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied XML' : 'Copy sitemap.xml'}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#3A1F0D] text-amber-200 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-64 border border-[#D4AF37]/30">
            {xmlSitemap}
          </pre>

          <div className="pt-6 border-t border-[#D4AF37]/20">
            <h3 className="font-serif font-bold text-base text-[#8B1E3F] mb-2">
              Schema.org BookStore JSON-LD
            </h3>
            <pre className="p-4 bg-[#3A1F0D] text-amber-200 font-mono text-[11px] rounded-2xl overflow-x-auto border border-[#D4AF37]/30">
              {JSON.stringify(schemaJsonLd, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
