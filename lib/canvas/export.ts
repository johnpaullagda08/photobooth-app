import type { ExportOptions, CapturedPhoto, PhotoCount, Theme } from '@/types';
import { composePhotoStripBlob } from './composer';
import { DEFAULT_EXPORT_QUALITY, DEFAULT_EXPORT_DPI } from '@/constants/config';

interface ExportParams {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  overlayIds: string[];
  customTexts?: Record<string, string>;
  filename?: string;
}

/**
 * Download the photo strip as an image file
 */
export async function downloadPhotoStrip(
  params: ExportParams,
  options: ExportOptions = {
    format: 'png',
    quality: DEFAULT_EXPORT_QUALITY,
    dpi: DEFAULT_EXPORT_DPI,
  }
): Promise<void> {
  const { photos, photoCount, filterId, theme, overlayIds, customTexts, filename } = params;
  const { format, quality } = options;

  const blob = await composePhotoStripBlob(
    { photos, photoCount, filterId, theme, overlayIds, customTexts },
    format,
    quality
  );

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const defaultFilename = `photobooth-${Date.now()}.${extension}`;

  link.href = url;
  link.download = filename || defaultFilename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Get a shareable URL for the photo strip (as base64 data URL)
 * Note: This is only suitable for small images due to URL length limits
 */
export async function getShareableDataUrl(params: ExportParams): Promise<string> {
  const { photos, photoCount, filterId, theme, overlayIds, customTexts } = params;

  const blob = await composePhotoStripBlob(
    { photos, photoCount, filterId, theme, overlayIds, customTexts },
    'jpeg',
    0.7 // Lower quality for smaller size
  );

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read blob'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Copy photo strip to clipboard
 */
export async function copyToClipboard(params: ExportParams): Promise<boolean> {
  try {
    const { photos, photoCount, filterId, theme, overlayIds, customTexts } = params;

    const blob = await composePhotoStripBlob(
      { photos, photoCount, filterId, theme, overlayIds, customTexts },
      'png'
    );

    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);

    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Share photo strip using Web Share API
 */
export async function sharePhotoStrip(params: ExportParams): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    const { photos, photoCount, filterId, theme, overlayIds, customTexts } = params;

    const blob = await composePhotoStripBlob(
      { photos, photoCount, filterId, theme, overlayIds, customTexts },
      'jpeg',
      0.85
    );

    const file = new File([blob], 'photobooth.jpg', { type: 'image/jpeg' });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'My Photobooth Strip',
        text: 'Check out my photo strip!',
      });
      return true;
    } else {
      console.warn('Cannot share files');
      return false;
    }
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Failed to share:', error);
    }
    return false;
  }
}

/**
 * Get file size estimate for the export
 */
export async function getExportSize(
  params: ExportParams,
  format: 'png' | 'jpeg' = 'png',
  quality: number = DEFAULT_EXPORT_QUALITY
): Promise<number> {
  const { photos, photoCount, filterId, theme, overlayIds, customTexts } = params;

  const blob = await composePhotoStripBlob(
    { photos, photoCount, filterId, theme, overlayIds, customTexts },
    format,
    quality
  );

  return blob.size;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
