/**
 * Canvas-based filter implementations for export
 * These apply pixel-level transformations to the image data
 */

export type FilterFunction = (imageData: ImageData) => ImageData;

/**
 * Grayscale filter - converts image to black and white
 */
export function grayscaleFilter(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Luminosity method for natural-looking grayscale
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  return imageData;
}

/**
 * Sepia filter - gives warm, vintage look
 */
export function sepiaFilter(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
    data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
    data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
  }

  return imageData;
}

/**
 * Vintage filter - sepia + vignette + reduced contrast
 */
export function vintageFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply sepia
      const newR = 0.393 * r + 0.769 * g + 0.189 * b;
      const newG = 0.349 * r + 0.686 * g + 0.168 * b;
      const newB = 0.272 * r + 0.534 * g + 0.131 * b;

      // Reduce contrast
      r = (newR - 128) * 0.9 + 128;
      g = (newG - 128) * 0.9 + 128;
      b = (newB - 128) * 0.9 + 128;

      // Apply vignette
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vignette = 1 - (dist / maxDist) * 0.5;

      data[i] = Math.min(255, Math.max(0, r * vignette));
      data[i + 1] = Math.min(255, Math.max(0, g * vignette));
      data[i + 2] = Math.min(255, Math.max(0, b * vignette));
    }
  }

  return imageData;
}

/**
 * High contrast filter - increases contrast and saturation
 */
export function highContrastFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const contrast = 1.5;
  const saturation = 1.2;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply contrast
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // Apply saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  return imageData;
}

/**
 * Soft glow filter - adds brightness and slight blur effect
 */
export function softGlowFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const brightness = 1.05;
  const contrast = 0.95;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // Reduce contrast slightly
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  return imageData;
}

/**
 * Warm filter - adds warm color tones
 */
export function warmFilter(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Boost reds, reduce blues
    data[i] = Math.min(255, data[i] * 1.1);
    data[i + 1] = Math.min(255, data[i + 1] * 1.05);
    data[i + 2] = Math.max(0, data[i + 2] * 0.9);
  }

  return imageData;
}

/**
 * Cool filter - adds cool color tones
 */
export function coolFilter(imageData: ImageData): ImageData {
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Reduce reds, boost blues
    data[i] = Math.max(0, data[i] * 0.9);
    data[i + 1] = data[i + 1];
    data[i + 2] = Math.min(255, data[i + 2] * 1.1);
  }

  return imageData;
}

/**
 * Dramatic filter - high contrast with deep shadows
 */
export function dramaticFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const contrast = 1.3;
  const brightness = 0.9;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // Apply contrast
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;

    // Boost saturation slightly
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * 1.1;
    g = gray + (g - gray) * 1.1;
    b = gray + (b - gray) * 1.1;

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  return imageData;
}

/**
 * Map of filter IDs to their implementations
 */
export const CANVAS_FILTERS: Record<string, FilterFunction | null> = {
  none: null,
  grayscale: grayscaleFilter,
  vintage: vintageFilter,
  highContrast: highContrastFilter,
  softGlow: softGlowFilter,
  warm: warmFilter,
  cool: coolFilter,
  dramatic: dramaticFilter,
};

/**
 * Apply a filter to a canvas
 */
export function applyFilterToCanvas(
  canvas: HTMLCanvasElement,
  filterId: string
): void {
  const filterFn = CANVAS_FILTERS[filterId];
  if (!filterFn) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filteredData = filterFn(imageData);
  ctx.putImageData(filteredData, 0, 0);
}

/**
 * Apply a filter to an image and return as data URL
 */
export function applyFilterToImage(
  imageSrc: string,
  filterId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      applyFilterToCanvas(canvas, filterId);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
