'use client';

import { forwardRef, useMemo } from 'react';
import { Camera, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BoxConfig, PaperSize, Orientation } from '@/lib/events/types';
import {
  calculateStripLayout,
  gridBoxToBoxConfig,
  STRIP_CANVAS,
  STRIP_LAYOUT,
  SINGLE_STRIP,
} from '@/lib/printing/strip-grid-composer';

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
  /** Orientation - only affects 4R mode (strip is always portrait) */
  orientation?: Orientation;
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
  /** Show as print preview (matches final print output exactly) */
  showPrintPreview?: boolean;
  /** Photo count for dynamic grid layout (strip mode) */
  photoCount?: number;
  /** Show cut marks between strips (strip mode only) */
  showCutMarks?: boolean;
}

/**
 * PrintRenderer - Shared component for rendering print layout
 *
 * PRINT OUTPUT RULES:
 * - All output uses 4R (4x6) canvas: 1200 x 1800 px at 300 DPI
 * - Strip mode: Dynamic grid layout (2 columns × N rows based on photoCount)
 * - 4R mode: Single layout fills the 4R canvas
 *
 * STRIP MODE GRID:
 * - Always 2 columns (side-by-side)
 * - Rows = ceil(photoCount / 2)
 * - Examples: 3 photos → 2×2, 4 photos → 2×2, 6 photos → 2×3
 * - Preview exactly matches final print output
 *
 * Layer hierarchy:
 * 1. Background Color (base)
 * 2. Background Image (above color, object-fit: cover)
 * 3. Photo Boxes with photos or placeholders (object-fit: cover)
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
      orientation = 'portrait',
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
      showPrintPreview = false,
      photoCount,
      showCutMarks = false,
    },
    ref
  ) {
    // Calculate aspect ratio based on paper size and orientation
    // Strip mode: Always 2:3 (portrait, rendered as side-by-side on 4R)
    // 4R mode: Depends on orientation - portrait (4:6) or landscape (6:4)
    const aspectRatio = useMemo(() => {
      if (paperSize === 'strip') {
        // Strip mode always uses 4R canvas (1200:1800 = 2:3)
        return '2 / 3';
      }
      // 4R mode: respect orientation
      if (orientation === 'portrait') {
        return '4 / 6'; // Portrait 4R (1200:1800 = 2:3)
      }
      return '6 / 4'; // Landscape 4R (1800:1200 = 3:2)
    }, [paperSize, orientation]);

    // Calculate single-column strip boxes (for one strip)
    // Always use the passed boxes directly - they represent the user's layout
    // Only generate defaults if no boxes exist
    const stripBoxes = useMemo(() => {
      if (paperSize !== 'strip') return boxes;

      // If boxes exist, always use them directly (user's customized layout)
      if (boxes.length > 0) {
        return boxes;
      }

      // No boxes provided - generate default layout based on photoCount
      const count = photoCount || 4;
      const stripLayout = calculateStripLayout(count);
      return stripLayout.map(gridBoxToBoxConfig);
    }, [paperSize, photoCount, boxes]);

    // Calculate layout percentages for side-by-side strips
    const stripLayoutPct = useMemo(() => {
      // Calculate percentages based on pixel values
      const marginPct = (STRIP_LAYOUT.MARGIN / STRIP_CANVAS.WIDTH) * 100;
      const gapPct = (STRIP_LAYOUT.GAP / STRIP_CANVAS.WIDTH) * 100;
      const stripWidthPct = (SINGLE_STRIP.WIDTH / STRIP_CANVAS.WIDTH) * 100;
      const marginYPct = (STRIP_LAYOUT.MARGIN / STRIP_CANVAS.HEIGHT) * 100;
      const stripHeightPct = (SINGLE_STRIP.HEIGHT / STRIP_CANVAS.HEIGHT) * 100;

      return {
        marginX: marginPct,
        marginY: marginYPct,
        gap: gapPct,
        stripWidth: stripWidthPct,
        stripHeight: stripHeightPct,
        leftStripX: marginPct,
        rightStripX: marginPct + stripWidthPct + gapPct,
      };
    }, []);

    // Build style object
    const containerStyle = useMemo(() => {
      const style: React.CSSProperties = {
        aspectRatio,
      };

      if (width) {
        style.width = width;
      } else if (height) {
        style.height = height;
      } else {
        style.width = '100%';
      }

      if (maxWidth) style.maxWidth = maxWidth;
      if (maxHeight) style.maxHeight = maxHeight;

      return style;
    }, [aspectRatio, width, height, maxWidth, maxHeight]);

    // Render a single strip (used for both left and right)
    const renderSingleStrip = (offsetX: number, keyPrefix: string) => {
      return (
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${offsetX}%`,
            top: `${stripLayoutPct.marginY}%`,
            width: `${stripLayoutPct.stripWidth}%`,
            height: `${stripLayoutPct.stripHeight}%`,
          }}
        >
          {/* Strip Background Color */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor, zIndex: 1 }}
          />

          {/* Strip Background Image */}
          {backgroundImage && (
            <div className="absolute inset-0" style={{ zIndex: 2 }}>
              <img
                src={backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}

          {/* Photos (single column in each strip) */}
          {stripBoxes.map((box, index) => {
            const photo = photos[index];
            return (
              <div
                key={`${keyPrefix}-${box.id}`}
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
                  <img
                    src={photo.dataUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : showPlaceholders ? (
                  <div className="w-full h-full rounded-sm bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-400 dark:text-zinc-500 opacity-50" />
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* Strip Frame Overlay */}
          {frameTemplate && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
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
    };

    // Render strip layout - 2 identical strips side-by-side on 4R canvas
    const renderStripLayout = () => {
      return (
        <>
          {/* LAYER 1: Paper Background (white) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#ffffff',
              zIndex: 1,
            }}
          />

          {/* LAYER 2: Left Strip */}
          {renderSingleStrip(stripLayoutPct.leftStripX, 'left')}

          {/* LAYER 3: Right Strip (identical copy) */}
          {renderSingleStrip(stripLayoutPct.rightStripX, 'right')}

          {/* LAYER 4: Cut Marks (between strips) */}
          {showCutMarks && (
            <div
              className="absolute top-0 bottom-0 flex flex-col items-center justify-between py-2"
              style={{
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
            >
              {/* Top cut mark with scissors */}
              <div className="flex flex-col items-center">
                <Scissors className="w-4 h-4 text-gray-500 rotate-90" />
                <div className="w-6 h-px bg-gray-500 mt-1" />
              </div>

              {/* Dashed center line */}
              <div
                className="flex-1 w-0 border-l-2 border-dashed border-gray-400"
                style={{ marginTop: '4px', marginBottom: '4px' }}
              />

              {/* Bottom cut mark */}
              <div className="w-6 h-px bg-gray-500" />
            </div>
          )}
        </>
      );
    };

    // Render 4R layout
    const render4RLayout = () => {
      // Safe margin: 20px out of 1200px width, 20px out of 1800px height
      const safeMarginXPct = (20 / 1200) * 100;
      const safeMarginYPct = (20 / 1800) * 100;
      const safeWidthPct = 100 - safeMarginXPct * 2;
      const safeHeightPct = 100 - safeMarginYPct * 2;

      return (
        <>
          {/* Safe area background */}
          <div
            className="absolute"
            style={{
              left: `${safeMarginXPct}%`,
              top: `${safeMarginYPct}%`,
              width: `${safeWidthPct}%`,
              height: `${safeHeightPct}%`,
              backgroundColor,
              zIndex: 2,
            }}
          />

          {/* Background Image */}
          {backgroundImage && (
            <div
              className="absolute"
              style={{
                left: `${safeMarginXPct}%`,
                top: `${safeMarginYPct}%`,
                width: `${safeWidthPct}%`,
                height: `${safeHeightPct}%`,
                zIndex: 2,
              }}
            >
              <img
                src={backgroundImage}
                alt="Background"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
          )}

          {/* Photos */}
          {boxes.map((box, index) => {
            const photo = photos[index];
            // Scale box positions to be within safe area
            const scaledX = safeMarginXPct + (box.x / 100) * safeWidthPct;
            const scaledY = safeMarginYPct + (box.y / 100) * safeHeightPct;
            const scaledW = (box.width / 100) * safeWidthPct;
            const scaledH = (box.height / 100) * safeHeightPct;

            return (
              <div
                key={box.id}
                className="absolute overflow-hidden"
                style={{
                  zIndex: 3,
                  left: `${scaledX}%`,
                  top: `${scaledY}%`,
                  width: `${scaledW}%`,
                  height: `${scaledH}%`,
                }}
              >
                {photo ? (
                  <img
                    src={photo.dataUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : showPlaceholders ? (
                  <div className="w-full h-full rounded-sm bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-500 opacity-50" />
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* Frame Overlay */}
          {frameTemplate && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${safeMarginXPct}%`,
                top: `${safeMarginYPct}%`,
                width: `${safeWidthPct}%`,
                height: `${safeHeightPct}%`,
                zIndex: 4,
              }}
            >
              <img
                src={frameTemplate}
                alt="Frame overlay"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}
        </>
      );
    };

    // Render standard editor layout (not print preview)
    const renderEditorLayout = () => {
      return (
        <>
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
                  <img
                    src={photo.dataUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : showPlaceholders ? (
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
        </>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          className
        )}
        style={containerStyle}
      >
        {paperSize === 'strip' ? (
          // Strip mode: Always use dynamic grid layout (same for preview and print)
          renderStripLayout()
        ) : showPrintPreview ? (
          // 4R print preview mode
          render4RLayout()
        ) : (
          // 4R editor mode
          renderEditorLayout()
        )}
      </div>
    );
  }
);

/**
 * Helper hook to get paper size dimensions in pixels
 * Useful for generating high-resolution print output
 *
 * Note: All output uses 4R canvas (1200 x 1800 px for portrait, 1800 x 1200 px for landscape)
 */
export function usePrintDimensions(
  paperSize: PaperSize,
  photoCount: number = 4,
  dpi: number = 300,
  orientation: Orientation = 'portrait'
) {
  return useMemo(() => {
    if (paperSize === 'strip') {
      return {
        width: STRIP_CANVAS.WIDTH,
        height: STRIP_CANVAS.HEIGHT,
        physicalWidth: 4,
        physicalHeight: 6,
        dpi,
        mode: paperSize,
        orientation: 'portrait' as const, // Strip is always portrait
        modeDescription: `2 identical strips side-by-side with ${photoCount} photos each`,
        stripWidth: SINGLE_STRIP.WIDTH,
        stripHeight: SINGLE_STRIP.HEIGHT,
        photosPerStrip: photoCount,
      };
    }

    // 4R mode: dimensions depend on orientation
    if (orientation === 'portrait') {
      return {
        width: 1200,  // 4 inches at 300 DPI
        height: 1800, // 6 inches at 300 DPI
        physicalWidth: 4,
        physicalHeight: 6,
        dpi,
        mode: paperSize,
        orientation,
        modeDescription: 'Portrait layout on 4×6',
      };
    }

    // Landscape
    return {
      width: 1800,  // 6 inches at 300 DPI
      height: 1200, // 4 inches at 300 DPI
      physicalWidth: 6,
      physicalHeight: 4,
      dpi,
      mode: paperSize,
      orientation,
      modeDescription: 'Landscape layout on 6×4',
    };
  }, [paperSize, photoCount, dpi, orientation]);
}
