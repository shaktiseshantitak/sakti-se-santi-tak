// Turns any common YouTube link format into a proper embeddable iframe
// URL. Previously, BookDetailsPage.tsx only handled the exact
// "youtube.com/watch?v=ID" format via a naive .replace('watch?v=',
// 'embed/') — so a youtu.be/ID link (the format YouTube's own mobile
// "Share" button produces, and the single most common way anyone copies
// a YouTube link), a youtube.com/shorts/ID link, a link with extra
// query params (&t=30s, &list=...), or a link already in embed/ format
// all either produced a broken/blocked iframe or silently did nothing.
//
// Handles: youtube.com/watch?v=ID, youtu.be/ID, m.youtube.com/watch?v=ID,
// youtube.com/embed/ID, youtube.com/shorts/ID — with or without extra
// query params, with or without https://, with or without www.

const YOUTUBE_ID_PATTERN =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/**
 * Extracts the 11-character YouTube video ID from any common URL format.
 * Returns null if the URL doesn't look like a recognizable YouTube link.
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * Converts any common YouTube URL format into a clean, embeddable
 * "https://www.youtube.com/embed/{ID}" URL. If the input isn't a
 * recognizable YouTube link (e.g. it's already a non-YouTube embed URL,
 * a Google Drive link, or an HLS stream URL), returns the original URL
 * unchanged rather than breaking it.
 */
export function getYoutubeEmbedUrl(url: string, options?: { autoplay?: boolean }): string {
  if (!url) return url;
  const id = extractYoutubeVideoId(url);
  if (!id) return url;
  const autoplay = options?.autoplay ? '?autoplay=1' : '';
  return `https://www.youtube.com/embed/${id}${autoplay}`;
}
