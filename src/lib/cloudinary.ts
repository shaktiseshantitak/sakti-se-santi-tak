// Cloudinary unsigned upload utility.
//
// Uses an UNSIGNED upload preset, which is Cloudinary's standard pattern for
// uploading straight from the browser with no secret key involved — only the
// account's public "cloud name" and a preset name are needed, both of which
// are safe to ship in client-side code (same trust level as the Supabase
// anon key already in this app). No server round-trip is required.
//
// Setup (one-time, in the Cloudinary dashboard — see the deployment guide):
//   1. Create a free Cloudinary account.
//   2. Settings → Upload → Upload presets → Add upload preset →
//      Signing Mode: "Unsigned" → Save, and note the preset name.
//   3. Set these two Netlify environment variables:
//      VITE_CLOUDINARY_CLOUD_NAME = <your cloud name, shown on the dashboard home>
//      VITE_CLOUDINARY_UPLOAD_PRESET = <the unsigned preset name from step 2>

const CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export interface CloudinaryUploadOptions {
  folder?: string;
  /** 'video' | 'image' | 'auto' — defaults to detecting from the file's MIME type */
  resourceType?: 'video' | 'image' | 'auto';
  onProgress?: (percent: number) => void;
}

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  /** Cloudinary's own thumbnail for a video, when resourceType is 'video' */
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Uploads a File directly from the browser to Cloudinary using an unsigned
 * upload preset. Returns a permanent https:// URL (res.secure_url) — unlike
 * URL.createObjectURL(), this URL keeps working after a page reload, in a
 * different browser, and on the public site.
 */
export function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    return Promise.resolve({
      success: false,
      error:
        'Cloudinary configured nahi hai — VITE_CLOUDINARY_CLOUD_NAME aur VITE_CLOUDINARY_UPLOAD_PRESET environment variables set karein (Netlify mein), phir redeploy karein.'
    });
  }

  const resourceType =
    options.resourceType || (file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'auto');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET as string);
  if (options.folder) form.append('folder', options.folder);

  return new Promise<CloudinaryUploadResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // fall through — json stays null, handled below
      }
      if (xhr.status >= 200 && xhr.status < 300 && json?.secure_url) {
        resolve({ success: true, url: json.secure_url as string, thumbnailUrl: json.thumbnail_url });
      } else {
        resolve({
          success: false,
          error: json?.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`
        });
      }
    };

    xhr.onerror = () => resolve({ success: false, error: 'Network error during Cloudinary upload.' });
    xhr.send(form);
  });
}
