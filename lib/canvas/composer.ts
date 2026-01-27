import type { CapturedPhoto, PhotoCount, Theme } from '@/types';
import { STRIP_WIDTH, PHOTO_SPACING } from '@/constants/config';
import { applyFilterToCanvas, CANVAS_FILTERS } from './filters';
import { renderOverlays } from '@/components/overlays/overlays';

interface CompositionOptions {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  overlayIds: string[];
  customTexts?: Record<string, string>;
  includeDatetime?: boolean;
}

// Calculate dimensions for the strip
function calculateDimensions(photoCount: PhotoCount) {
  const photoHeight = Math.floor((STRIP_WIDTH * 3) / 4); // 4:3 aspect ratio
  const totalPhotoHeight = photoHeight * photoCount;
  const totalSpacing = PHOTO_SPACING * (photoCount + 1);
  const footerHeight = 40; // Space for text overlays
  const stripHeight = totalPhotoHeight + totalSpacing + footerHeight;

  return {
    stripWidth: STRIP_WIDTH,
    stripHeight,
    photoWidth: STRIP_WIDTH - PHOTO_SPACING * 2,
    photoHeight,
  };
}

// Load image from data URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 50)}...`));
    img.src = src;
  });
}

/**
 * Compose a complete photo strip with all photos, filters, and overlays
 */
export async function composePhotoStrip(options: CompositionOptions): Promise<HTMLCanvasElement> {
  const { photos, photoCount, filterId, theme, overlayIds, customTexts, includeDatetime } = options;

  const dims = calculateDimensions(photoCount);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = dims.stripWidth;
  canvas.height = dims.stripHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill background
  ctx.fillStyle = theme.backgroundColor;
  ctx.fillRect(0, 0, dims.stripWidth, dims.stripHeight);

  // Draw each photo
  for (let i = 0; i < Math.min(photos.length, photoCount); i++) {
    const photo = photos[i];
    if (!photo) continue;

    try {
      // Create a temporary canvas for the photo
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = dims.photoWidth;
      photoCanvas.height = dims.photoHeight;
      const photoCtx = photoCanvas.getContext('2d');

      if (!photoCtx) continue;

      // Load and draw the photo
      const img = await loadImage(photo.dataUrl);

      // Calculate crop to maintain aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = dims.photoWidth / dims.photoHeight;

      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgAspect > targetAspect) {
        // Image is wider - crop width
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        // Image is taller - crop height
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }

      photoCtx.drawImage(img, sx, sy, sw, sh, 0, 0, dims.photoWidth, dims.photoHeight);

      // Apply canvas filter
      if (filterId !== 'none' && CANVAS_FILTERS[filterId]) {
        applyFilterToCanvas(photoCanvas, filterId);
      }

      // Calculate position
      const x = PHOTO_SPACING;
      const y = PHOTO_SPACING + i * (dims.photoHeight + PHOTO_SPACING);

      // Draw photo to main canvas
      ctx.drawImage(photoCanvas, x, y);

      // Draw border if theme specifies it
      if (theme.borderStyle !== 'none' && theme.borderWidth > 0) {
        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = theme.borderWidth;

        if (theme.borderStyle === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }

        if (theme.borderStyle === 'double') {
          // Draw two borders for double style
          ctx.strokeRect(x + 2, y + 2, dims.photoWidth - 4, dims.photoHeight - 4);
          ctx.strokeRect(x + 6, y + 6, dims.photoWidth - 12, dims.photoHeight - 12);
        } else {
          ctx.strokeRect(x, y, dims.photoWidth, dims.photoHeight);
        }

        ctx.setLineDash([]);
      }
    } catch (error) {
      console.error(`Failed to draw photo ${i}:`, error);
    }
  }

  // Render overlays
  const allOverlayIds = [...overlayIds];
  if (includeDatetime && !allOverlayIds.includes('datetime')) {
    allOverlayIds.push('datetime');
  }

  await renderOverlays(ctx, allOverlayIds, dims.stripWidth, dims.stripHeight, customTexts);

  return canvas;
}

/**
 * Get the composed strip as a data URL
 */
export async function composePhotoStripDataUrl(
  options: CompositionOptions,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.92
): Promise<string> {
  const canvas = await composePhotoStrip(options);
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Get the composed strip as a Blob
 */
export async function composePhotoStripBlob(
  options: CompositionOptions,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.92
): Promise<Blob> {
  const canvas = await composePhotoStrip(options);
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
