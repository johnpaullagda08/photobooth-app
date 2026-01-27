import type { PrintSize, PrintFormat, CapturedPhoto, PhotoCount, Theme } from '@/types';
import { PRINT_FORMATS, PHOTO_SPACING } from '@/constants/config';
import { applyFilterToCanvas, CANVAS_FILTERS } from '@/lib/canvas/filters';

export { PRINT_FORMATS };

// Get print format by size
export function getPrintFormat(size: PrintSize): PrintFormat {
  return PRINT_FORMATS[size];
}

// Calculate dimensions for print layout
function calculatePrintDimensions(
  printFormat: PrintFormat,
  photoCount: PhotoCount
) {
  const { width, height } = printFormat;

  // For 2x6 strip, photos are stacked vertically
  if (printFormat.size === '2x6') {
    const photoHeight = Math.floor((height - PHOTO_SPACING * (photoCount + 1)) / photoCount);
    const photoWidth = width - PHOTO_SPACING * 2;
    return { photoWidth, photoHeight, layout: 'vertical' as const };
  }

  // For 4x6, we can fit 2 strips side by side
  if (printFormat.size === '4x6') {
    const stripWidth = Math.floor((width - PHOTO_SPACING * 3) / 2);
    const photoHeight = Math.floor((height - PHOTO_SPACING * (photoCount + 1)) / photoCount);
    return { photoWidth: stripWidth, photoHeight, layout: 'side-by-side' as const };
  }

  // Default
  return {
    photoWidth: width - PHOTO_SPACING * 2,
    photoHeight: Math.floor((height - PHOTO_SPACING * (photoCount + 1)) / photoCount),
    layout: 'vertical' as const,
  };
}

// Load image from data URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

interface ComposeForPrintOptions {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  printSize: PrintSize;
  duplicateStrip?: boolean; // For 4x6, duplicate the strip
}

/**
 * Compose photo strip for print at specific size
 */
export async function composeForPrint(options: ComposeForPrintOptions): Promise<HTMLCanvasElement> {
  const { photos, photoCount, filterId, theme, printSize, duplicateStrip = true } = options;

  const printFormat = getPrintFormat(printSize);
  const dims = calculatePrintDimensions(printFormat, photoCount);

  const canvas = document.createElement('canvas');
  canvas.width = printFormat.width;
  canvas.height = printFormat.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill background
  ctx.fillStyle = theme.backgroundColor;
  ctx.fillRect(0, 0, printFormat.width, printFormat.height);

  // Draw photos
  const drawPhotoStrip = async (offsetX: number) => {
    for (let i = 0; i < Math.min(photos.length, photoCount); i++) {
      const photo = photos[i];
      if (!photo) continue;

      try {
        const photoCanvas = document.createElement('canvas');
        photoCanvas.width = dims.photoWidth;
        photoCanvas.height = dims.photoHeight;
        const photoCtx = photoCanvas.getContext('2d');

        if (!photoCtx) continue;

        const img = await loadImage(photo.dataUrl);

        // Calculate crop to maintain aspect ratio
        const imgAspect = img.width / img.height;
        const targetAspect = dims.photoWidth / dims.photoHeight;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgAspect > targetAspect) {
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }

        photoCtx.drawImage(img, sx, sy, sw, sh, 0, 0, dims.photoWidth, dims.photoHeight);

        // Apply filter
        if (filterId !== 'none' && CANVAS_FILTERS[filterId]) {
          applyFilterToCanvas(photoCanvas, filterId);
        }

        // Position
        const x = offsetX + PHOTO_SPACING;
        const y = PHOTO_SPACING + i * (dims.photoHeight + PHOTO_SPACING);

        ctx.drawImage(photoCanvas, x, y);

        // Border
        if (theme.borderStyle !== 'none' && theme.borderWidth > 0) {
          ctx.strokeStyle = theme.borderColor;
          ctx.lineWidth = theme.borderWidth;
          ctx.strokeRect(x, y, dims.photoWidth, dims.photoHeight);
        }
      } catch (error) {
        console.error(`Failed to draw photo ${i}:`, error);
      }
    }
  };

  if (printSize === '4x6' && duplicateStrip) {
    // Draw two strips side by side
    const stripWidth = dims.photoWidth + PHOTO_SPACING * 2;
    await drawPhotoStrip(0);
    await drawPhotoStrip(stripWidth);
  } else {
    await drawPhotoStrip(0);
  }

  return canvas;
}

/**
 * Get print canvas as blob
 */
export async function getPrintBlob(
  options: ComposeForPrintOptions,
  format: 'png' | 'jpeg' = 'jpeg',
  quality: number = 1.0
): Promise<Blob> {
  const canvas = await composeForPrint(options);
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
}
