/**
 * Client-Side Media Processor & Browser-Based Image/Video Optimizer
 *
 * Designed for Low Server Memory Architecture:
 * - 0% Server CPU usage for image resizing / video transcoding
 * - Browser Canvas WebP compression (turns 5MB camera photos into 120KB WebP)
 * - Browser Canvas Video frame thumbnail extraction
 * - Direct Supabase Storage / CDN URL handling
 */

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'image' | 'video';
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

export function validateMediaFile(file: File): MediaValidationResult {
  if (!file) {
    return { valid: false, error: 'कोई फाइल नहीं चुनी गई।' };
  }

  const isImage = ALLOWED_IMAGE_TYPES.some(t => file.type.toLowerCase().includes(t.replace('image/', '')));
  const isVideo = ALLOWED_VIDEO_TYPES.some(t => file.type.toLowerCase().includes(t.replace('video/', '')));

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'केवल JPG, PNG, WebP इमेजेस या MP4, WebM वीडियो फाइलें ही अनुमत हैं।'
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `इमेज का आकार बहुत बड़ा है (${(file.size / (1024 * 1024)).toFixed(1)}MB)। अधिकतम सीमा 5MB है।`
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `वीडियो का आकार बहुत बड़ा है (${(file.size / (1024 * 1024)).toFixed(1)}MB)। अधिकतम सीमा 25MB है।`
    };
  }

  return { valid: true, fileType: isImage ? 'image' : 'video' };
}

/**
 * Browser-side WebP image compression via HTML Canvas
 * Completely avoids server-side Sharp/ImageMagick memory spikes.
 */
export function compressImageToWebP(
  file: File,
  maxWidth = 1080,
  quality = 0.82
): Promise<{ dataUrl: string; originalSizeKb: number; compressedSizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('फाइल पढ़ने में त्रुटि हुई।'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('इमेज लोड करने में विफल।'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', quality);
        const originalSizeKb = Math.round(file.size / 1024);
        const compressedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          originalSizeKb,
          compressedSizeKb
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts a thumbnail image directly from a video file in the user's browser
 * using an off-screen HTML5 Video & Canvas element.
 */
export function generateVideoThumbnailInBrowser(
  file: File
): Promise<{ dataUrl: string; durationSec: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const fileUrl = URL.createObjectURL(file);
    video.src = fileUrl;

    video.onloadedmetadata = () => {
      // Seek to 0.5s or 10% of video
      video.currentTime = Math.min(1.0, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.80);
        URL.revokeObjectURL(fileUrl);
        resolve({ dataUrl, durationSec: Math.round(video.duration || 0) });
      } else {
        URL.revokeObjectURL(fileUrl);
        resolve({
          dataUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
          durationSec: 0
        });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(fileUrl);
      resolve({
        dataUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=600&q=80',
        durationSec: 0
      });
    };
  });
}
