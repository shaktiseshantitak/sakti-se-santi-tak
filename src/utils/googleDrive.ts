/**
 * Google Drive Link Converter & Validation Utility
 * Converts Google Drive sharing/view links into direct, high-performance URLs for images, PDFs, and audio files.
 * Prevents server memory overload by offloading binary storage to Google Drive.
 */

export interface GoogleDriveValidationResult {
  isValid: boolean;
  isGoogleDrive: boolean;
  fileId?: string;
  directUrl: string;
  mediaType: 'image' | 'pdf' | 'audio' | 'any';
  statusMessage: string;
  error?: string;
}

/**
 * Extracts Google Drive File ID from various share link formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.usercontent.google.com/download?id=FILE_ID
 * - FILE_ID directly (if alphanumeric with underscores/hyphens, length > 20)
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/FILE_ID/
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // Pattern 3: direct ID string (e.g. 1aB2c3D4e5F6g7H8i9J0)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Validates a Google Drive link or direct URL and provides comprehensive status details
 */
export function validateGoogleDriveLink(
  url: string,
  mediaType: 'image' | 'pdf' | 'audio' | 'any' = 'any'
): GoogleDriveValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      isGoogleDrive: false,
      directUrl: '',
      mediaType,
      statusMessage: 'No URL provided',
      error: 'Please paste a Google Drive share link or public URL',
    };
  }

  const trimmed = url.trim();
  const fileId = extractGoogleDriveFileId(trimmed);
  const isDrive = trimmed.includes('drive.google.com') || trimmed.includes('drive.usercontent.google.com') || !!fileId;

  if (isDrive) {
    if (!fileId) {
      return {
        isValid: false,
        isGoogleDrive: true,
        directUrl: trimmed,
        mediaType,
        statusMessage: 'Invalid Google Drive link structure',
        error: 'Could not extract File ID. Please check the Google Drive sharing URL.',
      };
    }

    let directUrl = trimmed;

    if (mediaType === 'image') {
      directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    } else if (mediaType === 'pdf') {
      // PDF Embed / Preview URL
      directUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (mediaType === 'audio') {
      // Direct stream / download URL for MP3/Audio player
      directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    } else {
      // Default to high-reliability content URL
      directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return {
      isValid: true,
      isGoogleDrive: true,
      fileId,
      directUrl,
      mediaType,
      statusMessage: `Valid Google Drive ${mediaType.toUpperCase()} Link (File ID: ${fileId.substring(0, 8)}...)`,
    };
  }

  // Non-Google Drive regular URL (e.g., Unsplash, Cloudinary, AWS S3, etc.)
  const isValidStandardUrl = /^https?:\/\/.+/i.test(trimmed);
  if (isValidStandardUrl) {
    return {
      isValid: true,
      isGoogleDrive: false,
      directUrl: trimmed,
      mediaType,
      statusMessage: 'Valid Web URL (Standard HTTP/HTTPS)',
    };
  }

  return {
    isValid: false,
    isGoogleDrive: false,
    directUrl: trimmed,
    mediaType,
    statusMessage: 'Invalid URL format',
    error: 'URL must start with http://, https:// or be a valid Google Drive link',
  };
}

/**
 * Converts Google Drive sharing links into direct URLs based on media type
 */
export function convertGoogleDriveUrl(url: string, mediaType: 'image' | 'pdf' | 'audio' = 'image'): string {
  const result = validateGoogleDriveLink(url, mediaType);
  return result.directUrl;
}

/**
 * Specific helpers for Photos, PDFs, and Audio
 */
export function convertGoogleDriveImageUrl(url: string): string {
  return convertGoogleDriveUrl(url, 'image');
}

export function convertGoogleDrivePdfUrl(url: string): string {
  return convertGoogleDriveUrl(url, 'pdf');
}

export function convertGoogleDriveAudioUrl(url: string): string {
  return convertGoogleDriveUrl(url, 'audio');
}

export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || extractGoogleDriveFileId(url) !== null;
}

