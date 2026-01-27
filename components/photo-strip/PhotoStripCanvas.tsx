'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CapturedPhoto, PhotoCount, Theme } from '@/types';
import { STRIP_WIDTH, PHOTO_SPACING } from '@/constants/config';

interface PhotoStripCanvasProps {
  photos: CapturedPhoto[];
  photoCount: PhotoCount;
  filter?: string;
  theme?: Theme;
  overlayImageUrl?: string;
  dateTimeText?: string;
  customText?: string;
  className?: string;
  onRender?: (canvas: HTMLCanvasElement) => void;
}

// Calculate dimensions for the strip
function calculateStripDimensions(photoCount: PhotoCount) {
  const photoHeight = Math.floor((STRIP_WIDTH * 3) / 4); // 4:3 aspect ratio
  const totalPhotoHeight = photoHeight * photoCount;
  const totalSpacing = PHOTO_SPACING * (photoCount + 1);
  const stripHeight = totalPhotoHeight + totalSpacing;

  return {
    width: STRIP_WIDTH,
    height: stripHeight,
    photoWidth: STRIP_WIDTH - PHOTO_SPACING * 2,
    photoHeight,
  };
}

export function PhotoStripCanvas({
  photos,
  photoCount,
  filter = 'none',
  theme,
  overlayImageUrl,
  dateTimeText,
  customText,
  className,
  onRender,
}: PhotoStripCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderStrip = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dims = calculateStripDimensions(photoCount);

    // Set canvas dimensions
    canvas.width = dims.width;
    canvas.height = dims.height;

    // Apply theme background
    if (theme) {
      ctx.fillStyle = theme.backgroundColor;
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, 0, dims.width, dims.height);

    // Draw photos
    const photoPromises = photos.slice(0, photoCount).map((photo, index) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const y = PHOTO_SPACING + index * (dims.photoHeight + PHOTO_SPACING);

          // Save context for filter application
          ctx.save();

          // Apply filter if needed
          if (filter !== 'none') {
            ctx.filter = filter;
          }

          // Draw photo centered
          const x = PHOTO_SPACING;
          ctx.drawImage(img, x, y, dims.photoWidth, dims.photoHeight);

          ctx.restore();

          // Draw border if theme specifies it
          if (theme && theme.borderStyle !== 'none' && theme.borderWidth > 0) {
            ctx.strokeStyle = theme.borderColor;
            ctx.lineWidth = theme.borderWidth;

            if (theme.borderStyle === 'double') {
              ctx.strokeRect(x + 2, y + 2, dims.photoWidth - 4, dims.photoHeight - 4);
              ctx.strokeRect(x + 6, y + 6, dims.photoWidth - 12, dims.photoHeight - 12);
            } else if (theme.borderStyle === 'dashed') {
              ctx.setLineDash([5, 5]);
              ctx.strokeRect(x, y, dims.photoWidth, dims.photoHeight);
              ctx.setLineDash([]);
            } else {
              ctx.strokeRect(x, y, dims.photoWidth, dims.photoHeight);
            }
          }

          resolve();
        };
        img.onerror = () => resolve();
        img.src = photo.dataUrl;
      });
    });

    await Promise.all(photoPromises);

    // Draw overlay if provided
    if (overlayImageUrl) {
      await new Promise<void>((resolve) => {
        const overlayImg = new Image();
        overlayImg.crossOrigin = 'anonymous';
        overlayImg.onload = () => {
          ctx.drawImage(overlayImg, 0, 0, dims.width, dims.height);
          resolve();
        };
        overlayImg.onerror = () => resolve();
        overlayImg.src = overlayImageUrl;
      });
    }

    // Draw text overlays
    if (dateTimeText || customText) {
      ctx.save();
      ctx.fillStyle = theme?.textColor || '#333333';
      ctx.font = `14px ${theme?.fontFamily || 'Arial, sans-serif'}`;
      ctx.textAlign = 'center';

      const textY = dims.height - 20;

      if (dateTimeText) {
        ctx.fillText(dateTimeText, dims.width / 2, textY);
      }

      if (customText) {
        ctx.fillText(customText, dims.width / 2, textY - 20);
      }

      ctx.restore();
    }

    // Notify parent of render completion
    onRender?.(canvas);
  }, [photos, photoCount, filter, theme, overlayImageUrl, dateTimeText, customText, onRender]);

  useEffect(() => {
    renderStrip();
  }, [renderStrip]);

  const dims = calculateStripDimensions(photoCount);

  return (
    <canvas
      ref={canvasRef}
      className={cn('max-w-full h-auto', className)}
      style={{
        aspectRatio: `${dims.width} / ${dims.height}`,
      }}
    />
  );
}

// Utility function to export strip as image
export function exportPhotoStrip(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.92
): string {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, quality);
}
