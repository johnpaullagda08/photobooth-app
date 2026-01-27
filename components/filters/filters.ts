import type { Filter } from '@/types';
import { CSS_FILTERS } from '@/constants/config';

// Re-export the filter definitions
export { FILTERS } from '@/constants/config';

// Helper to get CSS filter by ID
export function getCSSFilter(filterId: string): string {
  return CSS_FILTERS[filterId] || 'none';
}

// Helper to create a filter preview thumbnail
export async function createFilterThumbnail(
  imageSrc: string,
  filter: Filter,
  size: number = 100
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate crop dimensions to get square center
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;

      // Apply filter
      ctx.filter = filter.cssFilter;

      // Draw cropped and scaled image
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
