/**
 * Strip Composer - Side-by-side strip layout for Strip mode
 *
 * PAPER SIZE: 4R (4x6 inches) = 1200 x 1800 px @ 300 DPI
 *
 * LAYOUT RULES:
 * - Output: 2 identical strips side-by-side on 4R paper
 * - Each strip: Single column of photos (vertical stack)
 * - Photos maintain aspect ratio (cover fit, centered)
 * - Optional cut marks between strips
 *
 * OUTPUT EXAMPLE (4 photos):
 * ┌───────────────────────────┐
 * │ ┌─────────┐  ┌─────────┐  │
 * │ │ Photo 1 │  │ Photo 1 │  │
 * │ ├─────────┤  ├─────────┤  │
 * │ │ Photo 2 │  │ Photo 2 │  │
 * │ ├─────────┤  ├─────────┤  │
 * │ │ Photo 3 │  │ Photo 3 │  │
 * │ ├─────────┤  ├─────────┤  │
 * │ │ Photo 4 │  │ Photo 4 │  │
 * │ └─────────┘  └─────────┘  │
 * └───────────────────────────┘
 *   Left Strip    Right Strip
 */

import type { Theme } from '@/types';
import type { BoxConfig } from '@/lib/events/types';
import { applyFilterToCanvas, CANVAS_FILTERS } from '@/lib/canvas/filters';

/** Simple photo interface - only dataUrl is required for composition */
interface PhotoInput {
  dataUrl: string;
  id?: string;
  timestamp?: number;
  filterId?: string;
}

// ============================================
// CONSTANTS - 4R Paper @ 300 DPI
// ============================================

export const STRIP_CANVAS = {
  WIDTH: 1200,      // 4 inches at 300 DPI
  HEIGHT: 1800,     // 6 inches at 300 DPI
  DPI: 300,
} as const;

/** Strip layout configuration */
export const STRIP_LAYOUT = {
  MARGIN: 20,           // Safe margin on all edges
  GAP: 20,              // Gap between the two strips
  PHOTO_SPACING: 10,    // Vertical spacing between photos in a strip
} as const;

/** Calculated strip dimensions */
export const SINGLE_STRIP = {
  // Each strip width = (canvas - margins - gap) / 2
  WIDTH: Math.floor((STRIP_CANVAS.WIDTH - STRIP_LAYOUT.MARGIN * 2 - STRIP_LAYOUT.GAP) / 2),
  // Strip height = canvas height - top/bottom margins
  HEIGHT: STRIP_CANVAS.HEIGHT - STRIP_LAYOUT.MARGIN * 2,
} as const;

// Legacy exports for compatibility
export const GRID_LAYOUT = {
  MARGIN_TOP: STRIP_LAYOUT.MARGIN,
  MARGIN_BOTTOM: STRIP_LAYOUT.MARGIN,
  MARGIN_LEFT: STRIP_LAYOUT.MARGIN,
  MARGIN_RIGHT: STRIP_LAYOUT.MARGIN,
  SPACING_X: STRIP_LAYOUT.GAP,
  SPACING_Y: STRIP_LAYOUT.PHOTO_SPACING,
  COLUMNS: 1,  // Single column per strip
} as const;

// ============================================
// INTERFACES
// ============================================

export interface StripGridOptions {
  /** Photos to place in strip (only dataUrl is required) */
  photos: PhotoInput[];
  /** Number of photo boxes */
  photoCount: number;
  /** Background color */
  backgroundColor: string;
  /** Background image (data URL) - covers each strip */
  backgroundImage?: string | null;
  /** Frame overlay (data URL) - renders on top of each strip */
  frameTemplate?: string | null;
  /** Filter to apply to photos */
  filterId?: string;
  /** Theme for styling (borders, etc.) */
  theme?: Theme;
  /** Custom box configurations (overrides auto layout) */
  customBoxes?: BoxConfig[];
  /** Show cut marks between strips */
  showCutMarks?: boolean;
  /** Export quality (0-1) for JPEG */
  quality?: number;
}

export interface GridBox {
  id: string;
  label: string;
  x: number;      // Pixel position within strip
  y: number;      // Pixel position within strip
  width: number;  // Pixel size
  height: number; // Pixel size
  row: number;
  col: number;
}

export interface ComposedStripResult {
  canvas: HTMLCanvasElement;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  boxes: GridBox[];
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
 * Calculate cover crop dimensions (fills box, crops excess, centered)
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

// ============================================
// STRIP LAYOUT CALCULATION
// ============================================

/**
 * Calculate single-column layout for photos in a strip
 * Returns box positions relative to the strip (not the full canvas)
 */
export function calculateStripLayout(photoCount: number): GridBox[] {
  const stripWidth = SINGLE_STRIP.WIDTH;
  const stripHeight = SINGLE_STRIP.HEIGHT;

  // Calculate photo box dimensions
  const totalSpacing = STRIP_LAYOUT.PHOTO_SPACING * (photoCount - 1);
  const photoHeight = Math.floor((stripHeight - totalSpacing) / photoCount);
  const photoWidth = stripWidth; // Full width of strip

  const boxes: GridBox[] = [];

  for (let i = 0; i < photoCount; i++) {
    const y = i * (photoHeight + STRIP_LAYOUT.PHOTO_SPACING);

    boxes.push({
      id: `photo-${i + 1}`,
      label: `Photo ${i + 1}`,
      x: 0,
      y,
      width: photoWidth,
      height: photoHeight,
      row: i,
      col: 0,
    });
  }

  return boxes;
}

/**
 * Convert pixel-based GridBox to percentage-based BoxConfig
 * Percentages are relative to the strip dimensions
 */
export function gridBoxToBoxConfig(gridBox: GridBox): BoxConfig {
  return {
    id: gridBox.id,
    label: gridBox.label,
    x: (gridBox.x / SINGLE_STRIP.WIDTH) * 100,
    y: (gridBox.y / SINGLE_STRIP.HEIGHT) * 100,
    width: (gridBox.width / SINGLE_STRIP.WIDTH) * 100,
    height: (gridBox.height / SINGLE_STRIP.HEIGHT) * 100,
  };
}

/**
 * Convert percentage-based BoxConfig to pixel-based GridBox
 */
export function boxConfigToGridBox(box: BoxConfig, index: number): GridBox {
  return {
    id: box.id,
    label: box.label,
    x: Math.round((box.x / 100) * SINGLE_STRIP.WIDTH),
    y: Math.round((box.y / 100) * SINGLE_STRIP.HEIGHT),
    width: Math.round((box.width / 100) * SINGLE_STRIP.WIDTH),
    height: Math.round((box.height / 100) * SINGLE_STRIP.HEIGHT),
    row: index,
    col: 0,
  };
}

// Legacy function name for compatibility
export function calculateGridLayout(photoCount: number): GridBox[] {
  return calculateStripLayout(photoCount);
}

// ============================================
// MAIN COMPOSER
// ============================================

/**
 * Compose a single strip (used internally)
 */
async function composeSingleStrip(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  options: {
    photos: PhotoInput[];
    boxes: GridBox[];
    backgroundColor: string;
    backgroundImage?: string | null;
    frameTemplate?: string | null;
    filterId?: string;
    theme?: Theme;
  }
): Promise<void> {
  const { photos, boxes, backgroundColor, backgroundImage, frameTemplate, filterId, theme } = options;
  const stripWidth = SINGLE_STRIP.WIDTH;
  const stripHeight = SINGLE_STRIP.HEIGHT;

  // LAYER 1: Background Color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(offsetX, offsetY, stripWidth, stripHeight);

  // LAYER 2: Background Image (covers strip)
  if (backgroundImage) {
    try {
      const bgImg = await loadImage(backgroundImage);
      const crop = calculateCoverCrop(bgImg.width, bgImg.height, stripWidth, stripHeight);
      ctx.drawImage(
        bgImg,
        crop.sx, crop.sy, crop.sw, crop.sh,
        offsetX, offsetY, stripWidth, stripHeight
      );
    } catch (e) {
      console.warn('Failed to load background image:', e);
    }
  }

  // LAYER 3: Photo Boxes (single column)
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    const photo = photos[i];

    if (!photo) {
      // Empty box placeholder
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.fillRect(offsetX + box.x, offsetY + box.y, box.width, box.height);
      continue;
    }

    try {
      const img = await loadImage(photo.dataUrl);

      // Create temp canvas for photo processing
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = box.width;
      photoCanvas.height = box.height;
      const photoCtx = photoCanvas.getContext('2d');
      if (!photoCtx) continue;

      // Draw photo with cover crop
      const crop = calculateCoverCrop(img.width, img.height, box.width, box.height);
      photoCtx.drawImage(
        img,
        crop.sx, crop.sy, crop.sw, crop.sh,
        0, 0, box.width, box.height
      );

      // Apply filter
      if (filterId && filterId !== 'none' && CANVAS_FILTERS[filterId]) {
        applyFilterToCanvas(photoCanvas, filterId);
      }

      // Draw to main canvas
      ctx.drawImage(photoCanvas, offsetX + box.x, offsetY + box.y);

      // Draw border if theme specifies
      if (theme && theme.borderStyle !== 'none' && theme.borderWidth > 0) {
        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = theme.borderWidth;
        ctx.setLineDash(theme.borderStyle === 'dashed' ? [8, 4] : []);
        ctx.strokeRect(offsetX + box.x, offsetY + box.y, box.width, box.height);
        ctx.setLineDash([]);
      }
    } catch (e) {
      console.warn(`Failed to draw photo ${i + 1}:`, e);
    }
  }

  // LAYER 4: Frame Overlay
  if (frameTemplate) {
    try {
      const frameImg = await loadImage(frameTemplate);
      ctx.drawImage(frameImg, offsetX, offsetY, stripWidth, stripHeight);
    } catch (e) {
      console.warn('Failed to load frame template:', e);
    }
  }
}

/**
 * Draw cut marks between strips
 */
function drawCutMarks(ctx: CanvasRenderingContext2D): void {
  const centerX = STRIP_CANVAS.WIDTH / 2;
  const markLength = 30;
  const dashLength = 10;

  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 1;
  ctx.setLineDash([dashLength, dashLength]);

  // Vertical dashed line in the center
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, STRIP_CANVAS.HEIGHT);
  ctx.stroke();

  // Top cut mark
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(centerX - markLength / 2, 5);
  ctx.lineTo(centerX + markLength / 2, 5);
  ctx.stroke();

  // Bottom cut mark
  ctx.beginPath();
  ctx.moveTo(centerX - markLength / 2, STRIP_CANVAS.HEIGHT - 5);
  ctx.lineTo(centerX + markLength / 2, STRIP_CANVAS.HEIGHT - 5);
  ctx.stroke();

  // Scissors icon at top (simple representation)
  ctx.font = '12px Arial';
  ctx.fillStyle = '#888888';
  ctx.textAlign = 'center';
  ctx.fillText('✂', centerX, 20);
}

/**
 * Compose strip layout - 2 identical strips side-by-side
 */
export async function composeStripGrid(options: StripGridOptions): Promise<ComposedStripResult> {
  const {
    photos,
    photoCount,
    backgroundColor,
    backgroundImage,
    frameTemplate,
    filterId,
    theme,
    customBoxes,
    showCutMarks = false,
    quality = 0.95,
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = STRIP_CANVAS.WIDTH;
  canvas.height = STRIP_CANVAS.HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Calculate strip layout
  const boxes = customBoxes
    ? customBoxes.map((box, i) => boxConfigToGridBox(box, i))
    : calculateStripLayout(photoCount);

  // White background (paper color)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STRIP_CANVAS.WIDTH, STRIP_CANVAS.HEIGHT);

  // Left strip position
  const leftStripX = STRIP_LAYOUT.MARGIN;
  const stripY = STRIP_LAYOUT.MARGIN;

  // Right strip position
  const rightStripX = STRIP_LAYOUT.MARGIN + SINGLE_STRIP.WIDTH + STRIP_LAYOUT.GAP;

  // Compose left strip
  await composeSingleStrip(ctx, leftStripX, stripY, {
    photos,
    boxes,
    backgroundColor,
    backgroundImage,
    frameTemplate,
    filterId,
    theme,
  });

  // Compose right strip (identical copy)
  await composeSingleStrip(ctx, rightStripX, stripY, {
    photos,
    boxes,
    backgroundColor,
    backgroundImage,
    frameTemplate,
    filterId,
    theme,
  });

  // Draw cut marks if enabled
  if (showCutMarks) {
    drawCutMarks(ctx);
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
    width: STRIP_CANVAS.WIDTH,
    height: STRIP_CANVAS.HEIGHT,
    boxes,
  };
}

/**
 * Compose strip and return as data URL
 */
export async function composeStripGridDataUrl(options: StripGridOptions): Promise<string> {
  const result = await composeStripGrid(options);
  return result.dataUrl;
}

/**
 * Compose strip and return as Blob
 */
export async function composeStripGridBlob(options: StripGridOptions): Promise<Blob> {
  const result = await composeStripGrid(options);
  return result.blob;
}

// ============================================
// PREVIEW GENERATION
// ============================================

/**
 * Generate a preview at reduced size
 */
export async function generateStripPreview(
  options: StripGridOptions,
  maxHeight: number = 600
): Promise<HTMLCanvasElement> {
  const result = await composeStripGrid({ ...options, quality: 0.8 });

  const aspectRatio = STRIP_CANVAS.WIDTH / STRIP_CANVAS.HEIGHT;
  const previewHeight = Math.min(maxHeight, STRIP_CANVAS.HEIGHT);
  const previewWidth = Math.round(previewHeight * aspectRatio);

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = previewWidth;
  previewCanvas.height = previewHeight;

  const ctx = previewCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get preview canvas context');

  ctx.drawImage(result.canvas, 0, 0, previewWidth, previewHeight);

  return previewCanvas;
}

// ============================================
// VALIDATION & INFO
// ============================================

/**
 * Validate strip layout
 */
export function validateGridLayout(boxes: GridBox[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const box of boxes) {
    if (box.x < 0) {
      errors.push(`${box.label}: X position is negative`);
    }
    if (box.y < 0) {
      errors.push(`${box.label}: Y position is negative`);
    }
    if (box.x + box.width > SINGLE_STRIP.WIDTH) {
      errors.push(`${box.label}: Exceeds right edge of strip`);
    }
    if (box.y + box.height > SINGLE_STRIP.HEIGHT) {
      errors.push(`${box.label}: Exceeds bottom edge of strip`);
    }
    if (box.width <= 0 || box.height <= 0) {
      errors.push(`${box.label}: Invalid dimensions`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get strip layout info for display
 */
export function getGridLayoutInfo(photoCount: number) {
  const boxes = calculateStripLayout(photoCount);

  return {
    columns: 1,
    rows: photoCount,
    photoCount,
    boxWidth: boxes[0]?.width || 0,
    boxHeight: boxes[0]?.height || 0,
    stripWidth: SINGLE_STRIP.WIDTH,
    stripHeight: SINGLE_STRIP.HEIGHT,
    canvasWidth: STRIP_CANVAS.WIDTH,
    canvasHeight: STRIP_CANVAS.HEIGHT,
    dpi: STRIP_CANVAS.DPI,
    physicalWidth: 4, // inches
    physicalHeight: 6, // inches
    boxes,
  };
}
