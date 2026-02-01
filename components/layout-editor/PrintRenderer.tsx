'use client';

import { forwardRef, useMemo } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BoxConfig, PaperSize } from '@/lib/events/types';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp?: number;
}

export interface PrintRendererProps {
  /** Photo boxes configuration */
  boxes: BoxConfig[];
  /** Paper size for aspect ratio calculation */
  paperSize: PaperSize;
  /** Background color (defaults to white) */
  backgroundColor?: string;
  /** Background image URL (renders above background color) */
  backgroundImage?: string | null;
  /** Frame overlay image URL (renders above photos) */
  frameTemplate?: string | null;
  /** Captured photos to render in boxes (indexed by position) */
  photos?: CapturedPhoto[];
  /** Show placeholder icons when no photos */
  showPlaceholders?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Custom width - use for width-constrained layouts (4R) */
  width?: string | number;
  /** Custom height - use for height-constrained layouts (strip) */
  height?: string | number;
  /** Max width constraint */
  maxWidth?: string | number;
  /** Max height constraint */
  maxHeight?: string | number;
}

/**
 * PrintRenderer - Shared component for rendering print layout
 *
 * This component renders the complete print output with proper layer hierarchy:
 * 1. Background Color (base)
 * 2. Background Image (above color)
 * 3. Photo Boxes with photos or placeholders
 * 4. Frame Overlay (above photos)
 *
 * Use this component for:
 * - Layout editor preview
 * - Print preview modal
 * - Final print/export output
 * - Photo review screens
 */
export const PrintRenderer = forwardRef<HTMLDivElement, PrintRendererProps>(
  function PrintRenderer(
    {
      boxes,
      paperSize,
      backgroundColor = '#ffffff',
      backgroundImage,
      frameTemplate,
      photos = [],
      showPlaceholders = true,
      className,
      width,
      height,
      maxWidth,
      maxHeight,
    },
    ref
  ) {
    // Calculate aspect ratio based on paper size
    const aspectRatio = useMemo(() => {
      return paperSize === 'strip' ? '2 / 6' : '6 / 4';
    }, [paperSize]);

    // Build style object
    const containerStyle = useMemo(() => {
      const style: React.CSSProperties = {
        aspectRatio,
      };

      // Apply width or height (one determines the other via aspect ratio)
      if (width) {
        style.width = width;
      } else if (height) {
        style.height = height;
      } else {
        style.width = '100%';
      }

      // Apply max constraints
      if (maxWidth) style.maxWidth = maxWidth;
      if (maxHeight) style.maxHeight = maxHeight;

      return style;
    }, [aspectRatio, width, height, maxWidth, maxHeight]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          className
        )}
        style={containerStyle}
      >
        {/* ========================================
            LAYER HIERARCHY (strict render order):
            1. Background Color (base)
            2. Background Image (above color)
            3. Photo Boxes (main content)
            4. Frame Overlay (above photos)
            ======================================== */}

        {/* LAYER 1: Background Color */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: backgroundColor,
            zIndex: 1,
          }}
        />

        {/* LAYER 2: Background Image */}
        {backgroundImage && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 2 }}
          >
            <img
              src={backgroundImage}
              alt="Background"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        )}

        {/* LAYER 3: Photo Boxes */}
        {boxes.map((box, index) => {
          const photo = photos[index];

          return (
            <div
              key={box.id}
              className="absolute overflow-hidden"
              style={{
                zIndex: 3,
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              {photo ? (
                // Render actual photo
                <img
                  src={photo.dataUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : showPlaceholders ? (
                // Render placeholder
                <div className="w-full h-full rounded-sm bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-500 opacity-50" />
                </div>
              ) : null}
            </div>
          );
        })}

        {/* LAYER 4: Frame Overlay */}
        {frameTemplate && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 4 }}
          >
            <img
              src={frameTemplate}
              alt="Frame overlay"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        )}
      </div>
    );
  }
);

/**
 * Helper hook to get paper size dimensions in pixels
 * Useful for generating high-resolution print output
 */
export function usePrintDimensions(paperSize: PaperSize, dpi: number = 300) {
  return useMemo(() => {
    // Physical dimensions in inches
    const dimensions = paperSize === 'strip'
      ? { width: 2, height: 6 }  // 2x6 strip
      : { width: 6, height: 4 }; // 4x6 landscape (4R)

    return {
      width: dimensions.width * dpi,
      height: dimensions.height * dpi,
      physicalWidth: dimensions.width,
      physicalHeight: dimensions.height,
      dpi,
    };
  }, [paperSize, dpi]);
}
