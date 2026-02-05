/**
 * Print Formats - Unified print layout system
 *
 * ALL prints output to 4R (4x6) canvas at 300 DPI = 1200 x 1800 px
 *
 * Layout Modes:
 * - Strip: Dynamic grid layout (2 columns, variable rows based on photoCount)
 * - 4R: Single photo/layout fills the 4R canvas
 *
 * Strip Grid Examples:
 * - 3 photos → 2 cols × 2 rows
 * - 4 photos → 2 cols × 2 rows
 * - 6 photos → 2 cols × 3 rows
 */

import type { PrintSize, PrintFormat, CapturedPhoto, PhotoCount, Theme } from '@/types';
import type { BoxConfig, PaperSize } from '@/lib/events/types';
import { PRINT_FORMATS, PRINT_CANVAS, PHOTO_SPACING } from '@/constants/config';
import { applyFilterToCanvas, CANVAS_FILTERS } from '@/lib/canvas/filters';
import {
  composeStripGrid,
  calculateGridLayout,
  gridBoxToBoxConfig,
  STRIP_CANVAS,
  GRID_LAYOUT,
  type GridBox,
} from './strip-grid-composer';

export { PRINT_FORMATS };

// Re-export strip grid utilities
export {
  calculateGridLayout,
  gridBoxToBoxConfig,
  STRIP_CANVAS,
  GRID_LAYOUT,
  type GridBox,
} from './strip-grid-composer';

// ============================================
// CONSTANTS
// ============================================

/** Safe margin on each side of the print canvas */
const SAFE_MARGIN = PRINT_CANVAS.SAFE_MARGIN;

// ============================================
// PUBLIC API
// ============================================

/**
 * Get print format by size
 */
export function getPrintFormat(size: PrintSize): PrintFormat {
  return PRINT_FORMATS[size];
}

/**
 * Get print specifications for a paper size mode
 */
export function getPrintSpecs(mode: PaperSize) {
  if (mode === 'strip') {
    return {
      canvasWidth: STRIP_CANVAS.WIDTH,
      canvasHeight: STRIP_CANVAS.HEIGHT,
      dpi: STRIP_CANVAS.DPI,
      physicalWidth: 4,
      physicalHeight: 6,
      mode,
      modeDescription: 'Side-by-side grid layout on 4×6 paper',
      gridColumns: GRID_LAYOUT.COLUMNS,
      gridMargin: GRID_LAYOUT.MARGIN_TOP,
      gridSpacing: GRID_LAYOUT.SPACING_X,
    };
  }

  return {
    canvasWidth: PRINT_CANVAS.WIDTH,
    canvasHeight: PRINT_CANVAS.HEIGHT,
    dpi: PRINT_CANVAS.DPI,
    physicalWidth: 4,
    physicalHeight: 6,
    safeMargin: SAFE_MARGIN,
    mode,
    modeDescription: 'Single layout on 4×6 paper',
  };
}

/**
 * Generate default box layout for strip mode
 * Returns percentage-based BoxConfig array
 */
export function getStripGridBoxes(photoCount: number): BoxConfig[] {
  const gridBoxes = calculateGridLayout(photoCount);
  return gridBoxes.map(gridBoxToBoxConfig);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Load an image from a data URL
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
 * Calculate crop dimensions for cover fit (fills target, may crop)
 */
function calculateCoverCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sw: number; sh: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0, sy = 0, sw = srcWidth, sh = srcHeight;

  if (srcRatio > targetRatio) {
    sw = srcHeight * targetRatio;
    sx = (srcWidth - sw) / 2;
  } else {
    sh = srcWidth / targetRatio;
    sy = (srcHeight - sh) / 2;
  }

  return { sx, sy, sw, sh };
}

/**
 * Calculate dimensions for contain fit (fits within, no crop)
 */
function calculateContainFit(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { x: number; y: number; width: number; height: number } {
  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  let width: number, height: number;

  if (srcRatio > targetRatio) {
    width = targetWidth;
    height = targetWidth / srcRatio;
  } else {
    height = targetHeight;
    width = targetHeight * srcRatio;
  }

  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height,
  };
}

// ============================================
// MAIN COMPOSE FUNCTION
// ============================================

export interface ComposeForPrintOptions {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filterId: string;
  theme: Theme;
  printSize: PrintSize;
  /** Box configurations (for custom layouts) */
  boxes?: BoxConfig[];
  /** Background image */
  backgroundImage?: string | null;
  /** Frame overlay */
  frameTemplate?: string | null;
  /** @deprecated No longer used - strip always uses grid layout */
  duplicateStrip?: boolean;
}

/**
 * Compose photo layout for print
 *
 * Output: Always 4R canvas (1200 x 1800 px)
 *
 * - For '2x6' (strip): Dynamic side-by-side grid layout
 * - For '4x6' (4R): Photos rendered according to boxes layout
 */
export async function composeForPrint(options: ComposeForPrintOptions): Promise<HTMLCanvasElement> {
  const {
    photos,
    photoCount,
    filterId,
    theme,
    printSize,
    boxes,
    backgroundImage,
    frameTemplate,
  } = options;

  if (printSize === '2x6') {
    // ========================================
    // STRIP MODE: Dynamic grid layout
    // ========================================
    const result = await composeStripGrid({
      photos,
      photoCount,
      backgroundColor: theme.backgroundColor,
      backgroundImage,
      frameTemplate,
      filterId,
      theme,
      customBoxes: boxes,
    });

    return result.canvas;
  }

  // ========================================
  // 4R MODE: Layout fills canvas
  // ========================================

  const canvas = document.createElement('canvas');
  canvas.width = PRINT_CANVAS.WIDTH;
  canvas.height = PRINT_CANVAS.HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  const safeWidth = PRINT_CANVAS.WIDTH - SAFE_MARGIN * 2;
  const safeHeight = PRINT_CANVAS.HEIGHT - SAFE_MARGIN * 2;

  // White background (paper color)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PRINT_CANVAS.WIDTH, PRINT_CANVAS.HEIGHT);

  // Background color (in safe area)
  ctx.fillStyle = theme.backgroundColor;
  ctx.fillRect(SAFE_MARGIN, SAFE_MARGIN, safeWidth, safeHeight);

  // Background image
  if (backgroundImage) {
    try {
      const bgImg = await loadImage(backgroundImage);
      const crop = calculateCoverCrop(bgImg.width, bgImg.height, safeWidth, safeHeight);
      ctx.drawImage(
        bgImg,
        crop.sx, crop.sy, crop.sw, crop.sh,
        SAFE_MARGIN, SAFE_MARGIN, safeWidth, safeHeight
      );
    } catch (e) {
      console.warn('Failed to load background image:', e);
    }
  }

  // Draw photos using boxes layout
  const layoutBoxes = boxes || getStripGridBoxes(photoCount);

  for (let i = 0; i < layoutBoxes.length; i++) {
    const box = layoutBoxes[i];
    const photo = photos[i];
    if (!photo) continue;

    // Calculate pixel positions from percentages
    const boxX = SAFE_MARGIN + Math.round((box.x / 100) * safeWidth);
    const boxY = SAFE_MARGIN + Math.round((box.y / 100) * safeHeight);
    const boxW = Math.round((box.width / 100) * safeWidth);
    const boxH = Math.round((box.height / 100) * safeHeight);

    try {
      const img = await loadImage(photo.dataUrl);

      // Photo canvas
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = boxW;
      photoCanvas.height = boxH;
      const photoCtx = photoCanvas.getContext('2d');
      if (!photoCtx) continue;

      // Cover crop
      const crop = calculateCoverCrop(img.width, img.height, boxW, boxH);
      photoCtx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, boxW, boxH);

      // Apply filter
      if (filterId !== 'none' && CANVAS_FILTERS[filterId]) {
        applyFilterToCanvas(photoCanvas, filterId);
      }

      ctx.drawImage(photoCanvas, boxX, boxY);

      // Border
      if (theme.borderStyle !== 'none' && theme.borderWidth > 0) {
        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = theme.borderWidth;
        ctx.setLineDash(theme.borderStyle === 'dashed' ? [5, 5] : []);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.setLineDash([]);
      }
    } catch (e) {
      console.warn(`Failed to draw photo ${i}:`, e);
    }
  }

  // Frame overlay
  if (frameTemplate) {
    try {
      const frameImg = await loadImage(frameTemplate);
      ctx.drawImage(frameImg, SAFE_MARGIN, SAFE_MARGIN, safeWidth, safeHeight);
    } catch (e) {
      console.warn('Failed to load frame template:', e);
    }
  }

  return canvas;
}

/**
 * Get print canvas as blob
 */
export async function getPrintBlob(
  options: ComposeForPrintOptions,
  format: 'png' | 'jpeg' = 'jpeg',
  quality: number = 0.95
): Promise<Blob> {
  const canvas = await composeForPrint(options);
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      mimeType,
      quality
    );
  });
}

/**
 * Get print canvas as data URL
 */
export async function getPrintDataUrl(
  options: ComposeForPrintOptions,
  format: 'png' | 'jpeg' = 'jpeg',
  quality: number = 0.95
): Promise<string> {
  const canvas = await composeForPrint(options);
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, quality);
}

// ============================================
// PREVIEW HELPERS
// ============================================

/**
 * Calculate dimensions for print preview
 * Maintains exact aspect ratio (2:3 for 4R)
 */
export function calculatePreviewDimensions(
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } {
  const printRatio = PRINT_CANVAS.WIDTH / PRINT_CANVAS.HEIGHT; // 2:3

  let width = containerWidth;
  let height = containerWidth / printRatio;

  if (height > containerHeight) {
    height = containerHeight;
    width = containerHeight * printRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Validate that photo boxes are within bounds
 */
export function validateBoxes(boxes: BoxConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const box of boxes) {
    if (box.x < 0 || box.x > 100) {
      errors.push(`${box.label}: X position out of bounds`);
    }
    if (box.y < 0 || box.y > 100) {
      errors.push(`${box.label}: Y position out of bounds`);
    }
    if (box.x + box.width > 100) {
      errors.push(`${box.label}: Exceeds right edge`);
    }
    if (box.y + box.height > 100) {
      errors.push(`${box.label}: Exceeds bottom edge`);
    }
  }

  return { valid: errors.length === 0, errors };
}
