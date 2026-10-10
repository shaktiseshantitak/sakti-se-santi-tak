import type { Config, Context } from "@netlify/edge-functions";

// FIXED (2026-09-26 — "SEO dummy hai"): every meta tag, OG tag and
// Schema.org block this site builds (see SeoHead.tsx) is injected into
// the page by client-side React *after* the JS bundle has loaded and run.
// Netlify only ever serves one static, generic dist/index.html for every
// route, so any visitor whose client doesn't execute JavaScript sees just
// that generic title and nothing else. Google eventually renders JS, but
// inconsistently and with delay — and the crawlers that matter most for
// link previews (WhatsApp, Facebook, Twitter/X, LinkedIn, Slack,
// Telegram...) never run JS at all, so a shared book/blog link has always
// shown the plain homepage title with no description or image.
//
// This runs at the edge, before the static file is served, and ONLY for
// requests whose User-Agent identifies them as a bot/crawler (regular
// visitors are untouched — same SPA, same client-side SeoHead.tsx as
// before). For a matched request it fetches the real book/blog/site data
// straight from Supabase (same tables/columns as mapDbBookToBook /
// mapDbBlogToBlog / site_settings.seo in src/context/BookContext.tsx) and
// rewrites <title> plus the meta/OG/canonical tags in the HTML before
// it's returned — so the crawler sees the real per-page content instead
// of the generic shell.
//
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be set as
// Netlify environment variables with the "Edge functions" scope enabled
// (env vars from netlify.toml are NOT visible to edge functions). If
// they're missing, or any fetch fails, this falls back to generic
// site-wide tags rather than failing the request — a bot still gets
// *some* valid tags, never an error page.

const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|twitterbot|linkedinbot|slackbot|discordbot|pinterest|redditbot|skypeuripreview|vkshare|w3c_validator|embedly|quora link preview|outbrain|nuzzel|flipboard|tumblr|bitlybot|semrushbot|ahrefsbot/i;

const BASE_URL = "https://shaktiseshanti.com";

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

async function fetchJson(url: string, apikey: string) {
  try {
    const res = await fetch(url, { headers: { apikey, Authorization: `Bearer ${apikey}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async (request: Request, context: Context) => {
  const userAgent = request.headers.get("user-agent") || "";
  if (!BOT_UA_REGEX.test(userAgent)) {
    return context.next();
  }

  const url = new URL(request.url);
  const path = url.pathname;
  const canonical = `${BASE_URL}${path}`;

  // Site-wide fallback values — mirror SeoHead.tsx's own fallbacks so a
  // bot never sees anything worse than what a JS-executing crawler
  // already gets today.
  let title = "शक्ति से शांति (Shakti Se Shanti) — shaktiseshanti.com | गायत्री एवं दुर्गा मंत्र गुप्त रहस्य";
  let description = "Authentic Sanskrit scriptures & spiritual books online.";
  let image =
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80";
  let ogType: "website" | "book" | "article" = "website";

  const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_ANON_KEY");

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const rest = `${SUPABASE_URL}/rest/v1`;

    const settingsRows = await fetchJson(
      `${rest}/site_settings?id=eq.default&select=settings`,
      SUPABASE_ANON_KEY
    );
    const seo = settingsRows?.[0]?.settings?.seo;
    if (seo?.metaDescription) description = seo.metaDescription;
    if (seo?.ogImageUrl) image = seo.ogImageUrl;

    if (path.startsWith("/book/")) {
      const slug = decodeURIComponent(path.slice("/book/".length));
      // A book's "slug" is its id — see mapDbBookToBook in BookContext.tsx.
      const rows = await fetchJson(
        `${rest}/books?id=eq.${encodeURIComponent(slug)}&select=title,description,cover_image,author_name,seo`,
        SUPABASE_ANON_KEY
      );
      const book = rows?.[0];
      if (book) {
        title = book.seo?.metaTitle || [book.title, book.author_name].filter(Boolean).join(" - ");
        description = book.seo?.metaDescription || book.description || description;
        image = book.seo?.ogImage || book.cover_image || image;
        ogType = "book";
      }
    } else if (path.startsWith("/blog/")) {
      const slug = decodeURIComponent(path.slice("/blog/".length));
      const rows = await fetchJson(
        `${rest}/blogs?slug=eq.${encodeURIComponent(slug)}&select=title,excerpt,cover_image`,
        SUPABASE_ANON_KEY
      );
      const blog = rows?.[0];
      if (blog) {
        title = blog.title || title;
        description = blog.excerpt || description;
        image = blog.cover_image || image;
        ogType = "article";
      }
    }
  }

  const response = await context.next();
  const html = await response.text();

  const metaTags = `
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(canonical)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${esc(canonical)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
  `;

  const newHtml = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace("</head>", `${metaTags}\n  </head>`);

  const rewritten = new Response(newHtml, response);
  rewritten.headers.set("content-type", "text/html; charset=utf-8");
  rewritten.headers.delete("content-length");
  return rewritten;
};

export const config: Config = {
  path: "/*",
  excludedPath: [
    "/api/*",
    "/assets/*",
    "/*.js",
    "/*.css",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.webp",
    "/*.svg",
    "/*.woff2",
    "/manifest.json",
    "/robots.txt",
    "/sitemap.xml",
  ],
};
