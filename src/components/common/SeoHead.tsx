import React, { useEffect } from 'react';
import { useBooks } from '../../context/BookContext';
import { Book, BlogPost } from '../../types';

interface SeoHeadProps {
  currentPage?: string;
  currentBook?: Book | null;
  currentBlog?: BlogPost | null;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  schemaJson?: object;
  type?: 'website' | 'book' | 'article' | 'product';
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  currentPage,
  currentBook,
  currentBlog,
  title,
  description,
  keywords,
  ogImage,
  canonicalUrl,
  schemaJson,
  type = 'website',
}) => {
  const { siteSettings } = useBooks();
  const seoDefaults = siteSettings.seo;

  let calculatedTitle = title;
  let calculatedDesc = description;
  let calculatedKeywords = keywords;
  let calculatedOgImage = ogImage;
  let calculatedCanonical = canonicalUrl;
  let calculatedType = type;
  let calculatedSchema = schemaJson;

  if (currentPage === 'book-details' && currentBook) {
    calculatedTitle = currentBook.seo?.metaTitle || `${currentBook.title} ${currentBook.originalTitle ? `(${currentBook.originalTitle})` : ''} - ${currentBook.authorName}`;
    calculatedDesc = currentBook.seo?.metaDescription || currentBook.description;
    calculatedKeywords = currentBook.seo?.metaKeywords || (currentBook.tags ? currentBook.tags.join(', ') : `${currentBook.title}, Sanskrit books`);
    calculatedOgImage = currentBook.seo?.ogImage || currentBook.coverImage;
    calculatedCanonical = currentBook.seo?.canonicalUrl || `${seoDefaults?.canonicalUrl || 'https://shaktiseshanti.com'}/book/${currentBook.slug}`;
    calculatedType = 'book';
    calculatedSchema = schemaJson || {
      '@context': 'https://schema.org',
      '@type': 'Book',
      'name': currentBook.title,
      'alternateName': currentBook.originalTitle,
      'description': calculatedDesc,
      'image': calculatedOgImage,
      'isbn': currentBook.isbn,
      'author': { '@type': 'Person', 'name': currentBook.authorName },
      'publisher': { '@type': 'Organization', 'name': currentBook.publisher },
      'offers': {
        '@type': 'Offer',
        'price': currentBook.offerPrice,
        'priceCurrency': 'INR',
        'availability': currentBook.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      }
    };
  } else if (currentPage === 'blog-post' && currentBlog) {
    calculatedTitle = `${currentBlog.title} | ${siteSettings.siteName || 'शक्ति से शांति तक'}`;
    calculatedDesc = currentBlog.excerpt;
    calculatedOgImage = currentBlog.coverImage;
    calculatedType = 'article';
  }

  const finalTitle = calculatedTitle
    ? (calculatedTitle.includes(siteSettings.siteName || 'शक्ति') ? calculatedTitle : `${calculatedTitle} | ${siteSettings.siteName || 'शक्ति से शांति तक'}`)
    : (seoDefaults?.metaTitle || `${siteSettings.siteName} | Authentic Sacred Scriptures & Vedic Literature`);

  const finalDesc = calculatedDesc || seoDefaults?.metaDescription || siteSettings.siteTagline || 'Authentic Sanskrit scriptures & spiritual books online.';
  const finalKeywords = calculatedKeywords || seoDefaults?.metaKeywords || 'Bhagavad Gita, Sanskrit Scriptures, Vedas, Upanishads';
  const finalOgImage = calculatedOgImage || seoDefaults?.ogImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80';
  const finalCanonical = calculatedCanonical || seoDefaults?.canonicalUrl || 'https://shaktiseshanti.com';
  const enableIndex = seoDefaults?.enableIndexing !== false;

  useEffect(() => {
    // 1. Update Document Title
    document.title = finalTitle;

    // Helper to update or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    // Helper to update or create link tag
    const setLinkTag = (relVal: string, hrefVal: string) => {
      let element = document.querySelector(`link[rel="${relVal}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', relVal);
        document.head.appendChild(element);
      }
      element.setAttribute('href', hrefVal);
    };

    // 2. Standard SEO Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', finalDesc);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', finalKeywords);
    setMetaTag('meta[name="robots"]', 'name', 'robots', enableIndex ? 'index, follow' : 'noindex, nofollow');
    if (seoDefaults?.googleSiteVerification) {
      setMetaTag('meta[name="google-site-verification"]', 'name', 'google-site-verification', seoDefaults.googleSiteVerification);
    }

    // 3. OpenGraph / Social Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', finalTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', finalDesc);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', finalOgImage);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', type);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteSettings.siteName || 'शक्ति से शांति तक');

    // 4. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', finalTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', finalDesc);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', finalOgImage);
    if (seoDefaults?.twitterHandle) {
      setMetaTag('meta[name="twitter:site"]', 'name', 'twitter:site', seoDefaults.twitterHandle);
    }

    // 5. Canonical Link
    setLinkTag('canonical', finalCanonical);

    // 6. Schema.org JSON-LD Injection
    const existingScript = document.getElementById('seo-jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const defaultSchema = calculatedSchema || {
      '@context': 'https://schema.org',
      '@type': 'BookStore',
      'name': siteSettings.siteName || 'शक्ति से शांति तक',
      'description': finalDesc,
      'url': finalCanonical,
      'image': finalOgImage,
      'telephone': siteSettings.contactPhone || '+91 98765 43210',
      'email': siteSettings.contactEmail || 'support@shaktiseshanti.com',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': siteSettings.address || 'Assi Ghat Road',
        'addressLocality': 'Varanasi',
        'addressRegion': 'Uttar Pradesh',
        'addressCountry': 'India',
      },
    };

    const script = document.createElement('script');
    script.id = 'seo-jsonld-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(defaultSchema);
    document.head.appendChild(script);

  }, [finalTitle, finalDesc, finalKeywords, finalOgImage, finalCanonical, enableIndex, type, schemaJson, siteSettings, seoDefaults]);

  return null;
};
