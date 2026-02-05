'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Grid3X3, Eye, EyeOff, Maximize2, X, Camera, Minimize2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PhotoBox } from './PhotoBox';
import { SnapGuidelines } from './SnapGuidelines';
import { PrintRenderer } from './PrintRenderer';
import { useLayoutValidation, useSnapToGuides, type SnapGuide } from '@/hooks/layout-editor';
import type { BoxConfig, PaperSize, Orientation } from '@/lib/events/types';

interface LayoutCanvasProps {
  boxes: BoxConfig[];
  paperSize: PaperSize;
  /** Orientation - only affects 4R mode (strip is always portrait) */
  orientation?: Orientation;
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onUpdateBox: (id: string, updates: Partial<BoxConfig>) => void;
  onDeleteBox: (id: string) => void;
  onAddBox: () => void;
  maxBoxes?: number;
  frameTemplate?: string | null;
  backgroundColor?: string;
  backgroundImage?: string | null;
  /** Number of photos per strip (strip mode only) */
  photoCount?: number;
  /** Show cut marks between strips (strip mode only) */
  showCutMarks?: boolean;
}

// Paper size configurations - now a function to support orientation
function getPaperConfig(paperSize: PaperSize, orientation: Orientation = 'portrait') {
  if (paperSize === 'strip') {
    return {
      // 2x6 inches - always portrait (tall and narrow)
      aspectRatio: 2 / 6, // 0.333...
      cssAspectRatio: '2 / 6',
      label: '2×6 Strip',
      description: '2 inch × 6 inch photo strip',
      // For responsive sizing, strip should be height-constrained
      sizing: 'height' as const,
    };
  }

  // 4R mode - support both orientations
  if (orientation === 'portrait') {
    return {
      // 4x6 inches - portrait (tall)
      aspectRatio: 4 / 6, // 0.667
      cssAspectRatio: '4 / 6',
      label: '4R Portrait',
      description: '4 inch × 6 inch (portrait)',
      sizing: 'height' as const,
    };
  }

  return {
    // 4x6 inches - landscape (wide)
    aspectRatio: 6 / 4, // 1.5
    cssAspectRatio: '6 / 4',
    label: '4R Landscape',
    description: '6 inch × 4 inch (landscape)',
    sizing: 'width' as const,
  };
}

// Legacy PAPER_CONFIG for compatibility
const PAPER_CONFIG = {
  strip: getPaperConfig('strip'),
  '4r': getPaperConfig('4r', 'landscape'),
};

export function LayoutCanvas({
  boxes,
  paperSize,
  orientation = 'portrait',
  selectedBoxId,
  onSelectBox,
  onUpdateBox,
  onDeleteBox,
  onAddBox,
  maxBoxes = 4,
  frameTemplate,
  backgroundColor = '#ffffff',
  backgroundImage,
  photoCount,
  showCutMarks = false,
}: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fullscreenCanvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [activeSnapGuides, setActiveSnapGuides] = useState<SnapGuide[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isFullscreenEdit, setIsFullscreenEdit] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Get paper config based on paper size and orientation
  const paperConfig = useMemo(() => {
    return getPaperConfig(paperSize, orientation);
  }, [paperSize, orientation]);

  // Validation hook
  const { overlappingBoxIds } = useLayoutValidation({
    boxes,
    minBoxSize: 10,
  });

  // Snap hook
  const { guides, snapPosition } = useSnapToGuides({
    boxes,
    activeBoxId: selectedBoxId,
    snapThreshold: 3,
    marginGuides: [5],
    enabled: snapEnabled,
  });

  // Handle box update with snap
  const handleBoxUpdate = useCallback(
    (boxId: string, updates: Partial<BoxConfig>) => {
      onUpdateBox(boxId, updates);
    },
    [onUpdateBox]
  );

  // Snap position wrapper
  const handleSnapPosition = useCallback(
    (box: BoxConfig, x: number, y: number) => {
      if (!snapEnabled) {
        return { x, y };
      }
      const result = snapPosition(box, x, y);
      setActiveSnapGuides(result.activeGuides);
      return { x: result.x, y: result.y };
    },
    [snapEnabled, snapPosition]
  );

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setActiveSnapGuides([]);
  }, []);

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === canvasRef.current || target === fullscreenCanvasRef.current) {
        onSelectBox(null);
      }
    },
    [onSelectBox]
  );

  // Measure container for responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate responsive canvas dimensions
  const canvasDimensions = useMemo(() => {
    const padding = 32; // Container padding
    const availableWidth = Math.max(200, (containerSize.width || 400) - padding);
    const availableHeight = 400; // Max height for inline editor

    let width: number;
    let height: number;

    if (paperConfig.sizing === 'height') {
      // Strip: constrain by height, calculate width
      height = Math.min(availableHeight, 450);
      width = height * paperConfig.aspectRatio;
      // Don't exceed available width
      if (width > availableWidth) {
        width = availableWidth;
        height = width / paperConfig.aspectRatio;
      }
    } else {
      // 4R: constrain by width, calculate height
      width = Math.min(availableWidth, 500);
      height = width / paperConfig.aspectRatio;
      // Don't exceed available height
      if (height > availableHeight) {
        height = availableHeight;
        width = height * paperConfig.aspectRatio;
      }
    }

    return { width, height };
  }, [containerSize.width, paperConfig]);

  // Calculate fullscreen canvas dimensions
  const fullscreenDimensions = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const padding = 120; // Space for header/footer

    const availableWidth = viewportWidth - padding;
    const availableHeight = viewportHeight - padding;

    let width: number;
    let height: number;

    if (paperConfig.sizing === 'height') {
      // Strip: prioritize height
      height = Math.min(availableHeight, 700);
      width = height * paperConfig.aspectRatio;
      if (width > availableWidth * 0.6) {
        width = availableWidth * 0.6;
        height = width / paperConfig.aspectRatio;
      }
    } else {
      // 4R: prioritize width
      width = Math.min(availableWidth * 0.8, 900);
      height = width / paperConfig.aspectRatio;
      if (height > availableHeight) {
        height = availableHeight;
        width = height * paperConfig.aspectRatio;
      }
    }

    return { width, height };
  }, [paperConfig]);

  const canAddBox = boxes.length < maxBoxes;

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenEdit) {
        setIsFullscreenEdit(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenEdit]);

  // Render the layered canvas content
  const renderCanvasLayers = (isPreview: boolean, targetRef: React.RefObject<HTMLDivElement | null>) => (
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
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* LAYER 3: Grid Overlay (edit mode only) */}
      {showGrid && !isPreview && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 3,
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '10% 10%',
          }}
        />
      )}

      {/* LAYER 4: Snap Guidelines (edit mode only) */}
      {!isPreview && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 4 }}>
          <SnapGuidelines guides={guides} activeGuides={activeSnapGuides} showAll={false} />
        </div>
      )}

      {/* LAYER 5: Photo Boxes */}
      {boxes.map((box) => (
        <div
          key={box.id}
          className="absolute"
          style={{
            zIndex: 5,
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
          }}
        >
          {isPreview ? (
            <div className="w-full h-full rounded-sm bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-500 opacity-50" />
            </div>
          ) : (
            <PhotoBox
              box={box}
              isSelected={selectedBoxId === box.id}
              hasError={overlappingBoxIds.has(box.id)}
              containerRef={targetRef as React.RefObject<HTMLElement>}
              onSelect={() => onSelectBox(box.id)}
              onUpdate={(updates) => handleBoxUpdate(box.id, updates)}
              onDelete={() => onDeleteBox(box.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              snapPosition={handleSnapPosition}
              isPreviewMode={false}
            />
          )}
        </div>
      ))}

      {/* LAYER 6: Frame Overlay */}
      {frameTemplate && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
          <img
            src={frameTemplate}
            alt="Frame overlay"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* LAYER 7: UI Elements (edit mode only) */}
      {!isPreview && (
        <>
          {boxes.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none"
              style={{ zIndex: 7 }}
            >
              <Grid3X3 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No photo boxes</p>
              <p className="text-xs mt-1">Click &quot;Add Photo Box&quot; to get started</p>
            </div>
          )}

          {/* Paper Size Badge */}
          <div
            className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium text-muted-foreground border"
            style={{ zIndex: 7 }}
          >
            {paperConfig.label}
          </div>
        </>
      )}
    </>
  );

  // Toolbar component (shared between inline and fullscreen)
  const renderToolbar = (isFullscreen: boolean = false) => (
    <div className={cn(
      'flex items-center justify-between gap-4 flex-wrap',
      isFullscreen && 'px-4'
    )}>
      <div className="flex items-center gap-4">
        {/* Fullscreen Toggle */}
        <Button
          variant={isFullscreen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsFullscreenEdit(!isFullscreen)}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4 mr-1.5" />
              Exit Full Screen
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 mr-1.5" />
              Edit Full Screen
            </>
          )}
        </Button>

        {/* Preview Button (only in inline mode) */}
        {!isFullscreen && (
          <Button variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
            <Eye className="w-4 h-4 mr-1.5" />
            Preview
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Switch id={`show-grid-${isFullscreen}`} checked={showGrid} onCheckedChange={setShowGrid} />
          <Label htmlFor={`show-grid-${isFullscreen}`} className="text-sm cursor-pointer flex items-center gap-1.5">
            <Grid3X3 className="w-4 h-4" />
            Grid
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id={`snap-enabled-${isFullscreen}`} checked={snapEnabled} onCheckedChange={setSnapEnabled} />
          <Label htmlFor={`snap-enabled-${isFullscreen}`} className="text-sm cursor-pointer flex items-center gap-1.5">
            {snapEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Snap
          </Label>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onAddBox} disabled={!canAddBox}>
        <Plus className="w-4 h-4 mr-1.5" />
        Add Photo Box
        <span className="ml-1.5 text-muted-foreground">
          ({boxes.length}/{maxBoxes})
        </span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Inline Canvas Controls */}
      {renderToolbar(false)}

      {/* Inline Canvas Area */}
      <div className="relative flex items-center justify-center p-4 bg-muted/30 rounded-xl min-h-[300px]">
        {/* Paper outline visual */}
        <div
          className={cn(
            'relative flex items-center justify-center',
            paperSize === 'strip' ? 'py-2' : 'px-2'
          )}
        >
          {/* Decorative paper shadow */}
          <div
            className="absolute bg-black/5 dark:bg-black/20 rounded-lg"
            style={{
              width: canvasDimensions.width + 8,
              height: canvasDimensions.height + 8,
              transform: 'translate(4px, 4px)',
            }}
          />

          {/* Main Canvas */}
          <motion.div
            ref={canvasRef}
            className={cn(
              'relative rounded-lg overflow-hidden shadow-lg',
              'border-2 border-border dark:border-zinc-700',
              'bg-white',
              isDragging && 'cursor-grabbing'
            )}
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
            }}
            onClick={handleCanvasClick}
            layout
          >
            {renderCanvasLayers(false, canvasRef)}
          </motion.div>
        </div>

        {/* Size indicator */}
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded border">
          {paperConfig.description}
        </div>
      </div>

      {/* Editing hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Move className="w-3 h-3" />
        <span>Click a photo box to select it. Drag to move, use handles to resize.</span>
        <span className="text-primary cursor-pointer hover:underline" onClick={() => setIsFullscreenEdit(true)}>
          Open full screen editor for easier editing →
        </span>
      </div>

      {/* Validation Errors */}
      <AnimatePresence>
        {overlappingBoxIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400"
          >
            <span className="font-medium">Overlap detected:</span> Photo boxes cannot overlap.
            Reposition the highlighted boxes.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Edit Modal */}
      <AnimatePresence>
        {isFullscreenEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-white">Layout Editor</h2>
                <span className="text-sm text-zinc-400">
                  {paperConfig.label} • {paperConfig.description}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {renderToolbar(true)}
              </div>
            </div>

            {/* Fullscreen Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-8" style={{ height: 'calc(100vh - 140px)' }}>
              {/* Canvas container with paper effect */}
              <div className="relative">
                {/* Paper shadow */}
                <div
                  className="absolute bg-black/30 rounded-lg blur-sm"
                  style={{
                    width: fullscreenDimensions.width + 12,
                    height: fullscreenDimensions.height + 12,
                    transform: 'translate(6px, 6px)',
                  }}
                />

                {/* Main Canvas */}
                <motion.div
                  ref={fullscreenCanvasRef}
                  className={cn(
                    'relative rounded-lg overflow-hidden shadow-2xl',
                    'border-2 border-zinc-600',
                    'bg-white',
                    isDragging && 'cursor-grabbing'
                  )}
                  style={{
                    width: fullscreenDimensions.width,
                    height: fullscreenDimensions.height,
                  }}
                  onClick={handleCanvasClick}
                  layout
                >
                  {renderCanvasLayers(false, fullscreenCanvasRef)}
                </motion.div>

                {/* Dimension indicator */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-zinc-400">
                  {Math.round(fullscreenDimensions.width)} × {Math.round(fullscreenDimensions.height)} px (preview)
                </div>
              </div>
            </div>

            {/* Fullscreen Footer */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-700 bg-zinc-800">
              <div className="text-sm text-zinc-400">
                {boxes.length} photo {boxes.length === 1 ? 'box' : 'boxes'} • Press ESC to exit
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setShowPreviewModal(true)}>
                  <Eye className="w-4 h-4 mr-1.5" />
                  Preview Final Output
                </Button>
                <Button onClick={() => setIsFullscreenEdit(false)}>
                  Done Editing
                </Button>
              </div>
            </div>

            {/* Validation overlay for fullscreen */}
            <AnimatePresence>
              {overlappingBoxIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/90 text-white rounded-lg text-sm shadow-lg"
                >
                  Photo boxes are overlapping! Please reposition them.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold">Print Preview</h2>
                  <p className="text-sm text-muted-foreground">
                    Final output for {paperConfig.label} ({paperConfig.description})
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPreviewModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content - Responsive Preview */}
              <div className="p-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 min-h-[400px]">
                <PrintRenderer
                  key={`preview-${boxes.map(b => `${b.id}:${b.x}:${b.y}:${b.width}:${b.height}`).join('|')}`}
                  boxes={boxes}
                  paperSize={paperSize}
                  orientation={orientation}
                  backgroundColor={backgroundColor}
                  backgroundImage={backgroundImage}
                  frameTemplate={frameTemplate}
                  showPlaceholders={true}
                  className="rounded-lg shadow-xl max-h-[60vh]"
                  width={paperSize === 'strip' ? '200px' : orientation === 'portrait' ? '300px' : '500px'}
                  photoCount={photoCount || boxes.length}
                  showCutMarks={showCutMarks}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  {boxes.length} photo {boxes.length === 1 ? 'box' : 'boxes'} configured
                </div>
                <Button onClick={() => setShowPreviewModal(false)}>Close Preview</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
