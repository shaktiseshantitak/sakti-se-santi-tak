/**
 * Book Cover & Image Resizing & Optimization Utility
 * Handles viewport-aware image sizing, Unsplash / CDN optimization params,
 * client-side canvas resizing fallback, and responsive srcSet generation.
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'crop' | 'contain' | 'max';
}

/**
 * Transforms an image URL into a viewport and size-optimized CDN URL when applicable.
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!src) {
    return 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80';
  }

  const { width = 800, quality = 80, format = 'auto', fit = 'crop' } = options;

  // Handles Unsplash URL query params optimization
  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('fit', fit);
      url.searchParams.set('auto', format === 'auto' ? 'format' : format);
      return url.toString();
    } catch {
      return src;
    }
  }

  // Handles Cloudinary URL query params
  if (src.includes('res.cloudinary.com')) {
    return src.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }

  return src;
}

/**
 * Generates a responsive srcSet string for standard viewport breakpoints
 */
export function getImageSrcSet(src: string): string | undefined {
  if (!src || !src.includes('images.unsplash.com')) {
    return undefined;
  }

  const widths = [320, 480, 640, 800, 1080, 1200];
  return widths
    .map(w => `${getOptimizedImageUrl(src, { width: w, quality: 75 })} ${w}w`)
    .join(', ');
}

/**
 * Client-side canvas helper to resize base64 or file blob images before rendering or upload
 */
export function resizeImageCanvas(
  dataUrl: string,
  maxWidth: number = 800,
  maxHeight: number = 1000,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
  });
}
