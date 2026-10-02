import { supabase, isSupabaseConfigured } from './supabase';

export interface UploadOptions {
  folder?: string;
  maxSizeBytes?: number; // Images default 10MB, Audio/PDF default 50MB
  allowedMimeTypes?: string[];
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  isFallback?: boolean;
  provider?: 'r2' | 'supabase' | 'base64';
}

const DEFAULT_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MEDIA_MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Reads a File object and converts it to a base64 Data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Universal Cloud Upload Utility:
 * Primary: Cloudflare R2 via /api/media/upload
 * Secondary: Supabase Storage ('book-images')
 * Fallback: Client-side FileReader Base64
 */
export async function uploadMediaToStorage(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const folder = options.folder || 'general';
  const isImage = file.type.startsWith('image/');
  const maxSizeBytes = options.maxSizeBytes || (isImage ? DEFAULT_IMAGE_MAX_SIZE : DEFAULT_MEDIA_MAX_SIZE);

  // 1. Client-side File Size Validation
  if (file.size > maxSizeBytes) {
    const sizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      success: false,
      error: `File size too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed limit is ${sizeMB} MB.`
    };
  }

  // 2. Client-side MIME Type Validation
  if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    const fileMime = file.type.toLowerCase();
    const isAllowed = options.allowedMimeTypes.some(type => fileMime.includes(type) || type === fileMime);
    if (!isAllowed) {
      return {
        success: false,
        error: `Invalid file type (${file.type || 'unknown'}). Allowed types: ${options.allowedMimeTypes.join(', ')}.`
      };
    }
  }

  options.onProgress?.(20);

  // 3. Attempt Server-side Upload to Cloudflare R2
  try {
    const base64Data = await fileToBase64(file);
    options.onProgress?.(40);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
    }

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileData: base64Data,
        folder
      })
    });

    options.onProgress?.(80);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.url) {
        options.onProgress?.(100);
        return {
          success: true,
          url: data.url,
          provider: 'r2',
          isFallback: false
        };
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: errData.error || 'Authentication required. Only administrators can upload files.'
        };
      }
      // If server explicitly returned an error message (and R2 was configured), bubble it up
      if (errData.isConfigured !== false && errData.error) {
        console.warn('R2 upload endpoint error:', errData.error);
        return {
          success: false,
          error: errData.error
        };
      }
    }
  } catch (err: any) {
    console.warn('Server R2 upload endpoint unreachable or failed, trying Supabase fallback:', err);
  }

  // 4. Secondary Fallback: Supabase Storage (for images)
  if (isImage && isSupabaseConfigured && supabase) {
    try {
      options.onProgress?.(60);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timeStamp = Date.now();
      const sanitizedFolder = folder.replace(/\.\./g, '').replace(/^\/+|\/+$/g, '') || 'general';
      const filePath = `${sanitizedFolder}/${timeStamp}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('book-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from('book-images')
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          options.onProgress?.(100);
          return {
            success: true,
            url: publicUrlData.publicUrl,
            provider: 'supabase',
            isFallback: false
          };
        }
      }
    } catch (sbErr) {
      console.warn('Supabase storage fallback exception:', sbErr);
    }
  }

  // 5. Final Fallback: Client-side base64 Data URL
  try {
    options.onProgress?.(90);
    const base64Data = await fileToBase64(file);
    options.onProgress?.(100);
    return {
      success: true,
      url: base64Data,
      provider: 'base64',
      isFallback: true
    };
  } catch (readerErr) {
    return {
      success: false,
      error: 'Failed to read file contents.'
    };
  }
}

// Alias for backwards compatibility
export const uploadImageToStorage = uploadMediaToStorage;
