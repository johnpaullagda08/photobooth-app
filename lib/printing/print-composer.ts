/**
 * Print Composer - Unified print layout system
 *
 * PAPER SIZE STANDARDS (300 DPI):
 * - 4R (4x6 inches) = 1200 x 1800 px
 * - All prints output to 4R canvas
 *
 * LAYOUT RULES:
 * - Strip Mode: 2 strips side-by-side on 4R canvas
 * - 4R Mode: Single photo scaled proportionally to fit canvas
 *
 * PRINT MODES:
 * - 'strip': Always 2 vertical strips side-by-side
 * - '4r': Single photo/layout filling the 4R canvas
 */

import type { CapturedPhoto, PhotoCount, Theme } from '@/types';
import type { BoxConfig, PaperSize, PrintLayoutConfig } from '@/lib/events/types';
import { applyFilterToCanvas, CANVAS_FILTERS } from '@/lib/canvas/filters';

// ============================================
// CONSTANTS - 4R Paper @ 300 DPI
// ============================================

/** 4R canvas dimensions at 300 DPI */
export const PRINT_CANVAS = {
  WIDTH: 1200,   // 4 inches at 300 DPI
  HEIGHT: 1800,  // 6 inches at 300 DPI
  DPI: 300,
} as const;

/** Safe area margin (20px on each side) */
export const SAFE_MARGIN = 20;

/** Gap between strips */
export const STRIP_GAP = 20;

/** Strip dimensions when printed 2-up on 4R */
export const STRIP_DIMENSIONS = {
  // Each strip: (1200 - 20*2 - 20) / 2 = 570px wide
  WIDTH: Math.floor((PRINT_CANVAS.WIDTH - SAFE_MARGIN * 2 - STRIP_GAP) / 2),
  HEIGHT: PRINT_CANVAS.HEIGHT - SAFE_MARGIN * 2,  // 1760px tall
} as const;

/** 4R photo area (with safe margins) */
export const PHOTO_4R_DIMENSIONS = {
  WIDTH: PRINT_CANVAS.WIDTH - SAFE_MARGIN * 2,   // 1160px
  HEIGHT: PRINT_CANVAS.HEIGHT - SAFE_MARGIN * 2, // 1760px
} as const;

// ============================================
// INTERFACES
// ============================================

export interface PrintComposerOptions {
  /** Print mode: strip (2-up) or 4r (single) */
  mode: PaperSize;
  /** Captured photos */
  photos: CapturedPhoto[];
  /** Photo layout boxes (positions as percentages) */
  boxes: BoxConfig[];
  /** Background color */
  backgroundColor: string;
  /** Background image (data URL) */
  backgroundImage?: string | null;
  /** Frame overlay (data URL) */
  frameTemplate?: string | null;
  /** Filter ID to apply */
  filterId?: string;
  /** Theme for borders */
  theme?: Theme;
  /** Export quality (0-1) for JPEG */
  quality?: number;
}

export interface ComposedPrint {
  canvas: HTMLCanvasElement;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Load an image from a data URL or src
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Calculate dimensions for proportional scaling (object-fit: contain)
 * Centers the image within the target area without distortion
 */
function calculateContainFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number; width: number; height: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let width: number;
  let height: number;

  if (srcRatio > targetRatio) {
    // Source is wider - fit to width
    width = targetWidth;
    height = targetWidth / srcRatio;
  } else {
    // Source is taller - fit to height
    height = targetHeight;
    width = targetHeight * srcRatio;
  }

  // Center within target
  const x = (targetWidth - width) / 2;
  const y = (targetHeight - height) / 2;

  return { x, y, width, height };
}

/**
 * Calculate dimensions for cover fit (object-fit: cover)
 * Fills the target area, cropping if necessary
 */
function calculateCoverFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sw: number; sh: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0;
  let sy = 0;
  let sw = srcWidth;
  let sh = srcHeight;

  if (srcRatio > targetRatio) {
    // Source is wider - crop width
    sw = srcHeight * targetRatio;
    sx = (srcWidth - sw) / 2;
  } else {
    // Source is taller - crop height
    sh = srcWidth / targetRatio;
    sy = (srcHeight - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

// ============================================
// STRIP RENDERING
// ============================================

/**
 * Compose a single strip canvas from photos and layout
 */
async function composeStrip(
  photos: CapturedPhoto[],
  boxes: BoxConfig[],
  backgroundColor: string,
  backgroundImage: string | null | undefined,
  frameTemplate: string | null | undefined,
  filterId: string | undefined,
  theme: Theme | undefined,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // 1. Background color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Background image
  if (backgroundImage) {
    try {
      const bgImg = await loadImage(backgroundImage);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch (e) {
      console.warn('Failed to load background image:', e);
    }
  }

  // 3. Photos
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    const photo = photos[i];
    if (!photo) continue;

    // Calculate pixel positions from percentages
    const boxX = Math.round((box.x / 100) * width);
    const boxY = Math.round((box.y / 100) * height);
    const boxW = Math.round((box.width / 100) * width);
    const boxH = Math.round((box.height / 100) * height);

    try {
      const img = await loadImage(photo.dataUrl);

      // Create temp canvas for photo with filter
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = boxW;
      photoCanvas.height = boxH;
      const photoCtx = photoCanvas.getContext('2d');
      if (!photoCtx) continue;

      // Cover fit (crop to fill)
      const crop = calculateCoverFit(img.width, img.height, boxW, boxH);
      photoCtx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, boxW, boxH);

      // Apply filter
      if (filterId && filterId !== 'none' && CANVAS_FILTERS[filterId]) {
        applyFilterToCanvas(photoCanvas, filterId);
      }

      // Draw to main canvas
      ctx.drawImage(photoCanvas, boxX, boxY);

      // Draw border
      if (theme && theme.borderStyle !== 'none' && theme.borderWidth > 0) {
        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = theme.borderWidth;
        if (theme.borderStyle === 'dashed') {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.setLineDash([]);
      }
    } catch (e) {
      console.warn(`Failed to draw photo ${i}:`, e);
    }
  }

  // 4. Frame overlay
  if (frameTemplate) {
    try {
      const frameImg = await loadImage(frameTemplate);
      ctx.drawImage(frameImg, 0, 0, width, height);
    } catch (e) {
      console.warn('Failed to load frame template:', e);
    }
  }

  return canvas;
}

// ============================================
// MAIN COMPOSER
// ============================================

/**
 * Compose print output for the specified mode
 *
 * - Strip mode: Renders 2 identical strips side-by-side on 4R canvas
 * - 4R mode: Renders photos according to layout, scaled to fit 4R canvas
 */
export async function composePrint(options: PrintComposerOptions): Promise<ComposedPrint> {
  const {
    mode,
    photos,
    boxes,
    backgroundColor,
    backgroundImage,
    frameTemplate,
    filterId,
    theme,
    quality = 0.95,
  } = options;

  // Create the 4R canvas
  const canvas = document.createElement('canvas');
  canvas.width = PRINT_CANVAS.WIDTH;
  canvas.height = PRINT_CANVAS.HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Fill with white (default paper color)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PRINT_CANVAS.WIDTH, PRINT_CANVAS.HEIGHT);

  if (mode === 'strip') {
    // ========================================
    // STRIP MODE: 2 strips side-by-side
    // ========================================

    // Compose the strip
    const stripCanvas = await composeStrip(
      photos,
      boxes,
      backgroundColor,
      backgroundImage,
      frameTemplate,
      filterId,
      theme,
      STRIP_DIMENSIONS.WIDTH,
      STRIP_DIMENSIONS.HEIGHT
    );

    // Calculate positions for 2 strips
    const strip1X = SAFE_MARGIN;
    const strip1Y = SAFE_MARGIN;
    const strip2X = SAFE_MARGIN + STRIP_DIMENSIONS.WIDTH + STRIP_GAP;
    const strip2Y = SAFE_MARGIN;

    // Draw strip 1 (left)
    ctx.drawImage(stripCanvas, strip1X, strip1Y);

    // Draw strip 2 (right) - identical copy
    ctx.drawImage(stripCanvas, strip2X, strip2Y);

  } else {
    // ========================================
    // 4R MODE: Layout fills the canvas
    // ========================================

    // For 4R mode, render the layout directly to the canvas
    // The layout boxes are already in percentages, apply to full canvas area

    // 1. Background color (within safe area)
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      SAFE_MARGIN,
      SAFE_MARGIN,
      PHOTO_4R_DIMENSIONS.WIDTH,
      PHOTO_4R_DIMENSIONS.HEIGHT
    );

    // 2. Background image (within safe area)
    if (backgroundImage) {
      try {
        const bgImg = await loadImage(backgroundImage);
        // Use contain fit to avoid stretching
        const fit = calculateContainFit(
          bgImg.width,
          bgImg.height,
          PHOTO_4R_DIMENSIONS.WIDTH,
          PHOTO_4R_DIMENSIONS.HEIGHT
        );
        ctx.drawImage(
          bgImg,
          SAFE_MARGIN + fit.x,
          SAFE_MARGIN + fit.y,
          fit.width,
          fit.height
        );
      } catch (e) {
        console.warn('Failed to load background image:', e);
      }
    }

    // 3. Photos (percentages relative to safe area)
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const photo = photos[i];
      if (!photo) continue;

      // Calculate pixel positions from percentages (relative to safe area)
      const boxX = SAFE_MARGIN + Math.round((box.x / 100) * PHOTO_4R_DIMENSIONS.WIDTH);
      const boxY = SAFE_MARGIN + Math.round((box.y / 100) * PHOTO_4R_DIMENSIONS.HEIGHT);
      const boxW = Math.round((box.width / 100) * PHOTO_4R_DIMENSIONS.WIDTH);
      const boxH = Math.round((box.height / 100) * PHOTO_4R_DIMENSIONS.HEIGHT);

      try {
        const img = await loadImage(photo.dataUrl);

        // Create temp canvas for photo with filter
        const photoCanvas = document.createElement('canvas');
        photoCanvas.width = boxW;
        photoCanvas.height = boxH;
        const photoCtx = photoCanvas.getContext('2d');
        if (!photoCtx) continue;

        // Cover fit (crop to fill)
        const crop = calculateCoverFit(img.width, img.height, boxW, boxH);
        photoCtx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, boxW, boxH);

        // Apply filter
        if (filterId && filterId !== 'none' && CANVAS_FILTERS[filterId]) {
          applyFilterToCanvas(photoCanvas, filterId);
        }

        // Draw to main canvas
        ctx.drawImage(photoCanvas, boxX, boxY);

        // Draw border
        if (theme && theme.borderStyle !== 'none' && theme.borderWidth > 0) {
          ctx.strokeStyle = theme.borderColor;
          ctx.lineWidth = theme.borderWidth;
          if (theme.borderStyle === 'dashed') {
            ctx.setLineDash([5, 5]);
          } else {
            ctx.setLineDash([]);
          }
          ctx.strokeRect(boxX, boxY, boxW, boxH);
          ctx.setLineDash([]);
        }
      } catch (e) {
        console.warn(`Failed to draw photo ${i}:`, e);
      }
    }

    // 4. Frame overlay (within safe area)
    if (frameTemplate) {
      try {
        const frameImg = await loadImage(frameTemplate);
        ctx.drawImage(
          frameImg,
          SAFE_MARGIN,
          SAFE_MARGIN,
          PHOTO_4R_DIMENSIONS.WIDTH,
          PHOTO_4R_DIMENSIONS.HEIGHT
        );
      } catch (e) {
        console.warn('Failed to load frame template:', e);
      }
    }
  }

  // Export
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      'image/jpeg',
      quality
    );
  });

  return {
    canvas,
    blob,
    dataUrl,
    width: PRINT_CANVAS.WIDTH,
    height: PRINT_CANVAS.HEIGHT,
  };
}

/**
 * Compose print and return as data URL
 */
export async function composePrintDataUrl(options: PrintComposerOptions): Promise<string> {
  const result = await composePrint(options);
  return result.dataUrl;
}

/**
 * Compose print and return as Blob
 */
export async function composePrintBlob(options: PrintComposerOptions): Promise<Blob> {
  const result = await composePrint(options);
  return result.blob;
}

// ============================================
// PREVIEW GENERATION
// ============================================

/**
 * Generate a preview canvas at reduced size for UI display
 * Maintains exact aspect ratio of final print (1200:1800 = 2:3)
 */
export async function composePreview(
  options: Omit<PrintComposerOptions, 'quality'>,
  previewHeight: number = 400
): Promise<HTMLCanvasElement> {
  const result = await composePrint({ ...options, quality: 0.8 });

  // Scale down for preview while maintaining aspect ratio
  const aspectRatio = PRINT_CANVAS.WIDTH / PRINT_CANVAS.HEIGHT;
  const previewWidth = Math.round(previewHeight * aspectRatio);

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = previewWidth;
  previewCanvas.height = previewHeight;

  const ctx = previewCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(result.canvas, 0, 0, previewWidth, previewHeight);

  return previewCanvas;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that boxes don't exceed canvas bounds
 */
export function validateLayout(boxes: BoxConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const box of boxes) {
    if (box.x < 0 || box.x > 100) {
      errors.push(`Box "${box.label}": X position out of bounds (${box.x}%)`);
    }
    if (box.y < 0 || box.y > 100) {
      errors.push(`Box "${box.label}": Y position out of bounds (${box.y}%)`);
    }
    if (box.x + box.width > 100) {
      errors.push(`Box "${box.label}": Exceeds right edge (${box.x + box.width}%)`);
    }
    if (box.y + box.height > 100) {
      errors.push(`Box "${box.label}": Exceeds bottom edge (${box.y + box.height}%)`);
    }
    if (box.width <= 0 || box.height <= 0) {
      errors.push(`Box "${box.label}": Invalid dimensions`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get print specifications for display
 */
export function getPrintSpecs(mode: PaperSize) {
  return {
    canvasWidth: PRINT_CANVAS.WIDTH,
    canvasHeight: PRINT_CANVAS.HEIGHT,
    dpi: PRINT_CANVAS.DPI,
    physicalWidth: 4, // inches
    physicalHeight: 6, // inches
    safeMargin: SAFE_MARGIN,
    mode,
    modeDescription: mode === 'strip'
      ? '2 strips side-by-side on 4x6 paper'
      : 'Single layout on 4x6 paper',
    stripDimensions: mode === 'strip' ? STRIP_DIMENSIONS : null,
  };
}
