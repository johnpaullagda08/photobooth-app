'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, RotateCcw, Grid3X3, Image, Plus, Trash2, Move, LayoutGrid, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PrintLayoutConfig, BoxConfig, OverlayConfig } from '@/lib/events/types';
import { LAYOUT_PRESETS } from '@/lib/events/types';
import { getLastOutput, type LastPhotoOutput } from '@/lib/photos/lastOutput';

interface PrintLayoutSettingsProps {
  config: PrintLayoutConfig;
  onUpdate: (config: PrintLayoutConfig) => void;
}

const formatOptions = [
  { value: '2x6-strip', label: '2x6 Strip', description: 'Classic photo strip', aspectRatio: '2 / 6', landscapeRatio: '6 / 2', photoCountOptions: [3, 4] as const },
  { value: '4r-single', label: '4R Single', description: 'Single photo on 4x6', aspectRatio: '4 / 6', landscapeRatio: '6 / 4', photoCountOptions: [1] as const },
  { value: '4r-grid-2x2', label: '4R 2x2 Grid', description: '4 photos in grid', aspectRatio: '4 / 6', landscapeRatio: '6 / 4', photoCountOptions: [4] as const },
] as const;

const orientationOptions = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
] as const;

const layoutPresetOptions = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid, description: 'Equal-sized photos in grid' },
  { value: 'custom', label: 'Custom', icon: Move, description: 'Manually position photos' },
] as const;

// Helper function to get aspect ratio based on format and orientation
function getAspectRatio(format: PrintLayoutConfig['format'], orientation: PrintLayoutConfig['orientation']): string {
  const formatConfig = formatOptions.find(f => f.value === format);
  if (!formatConfig) return '2 / 6';
  return orientation === 'landscape' ? formatConfig.landscapeRatio : formatConfig.aspectRatio;
}

// Get photo count options for a format
function getPhotoCountOptionsForFormat(format: PrintLayoutConfig['format']): readonly number[] {
  const formatConfig = formatOptions.find(f => f.value === format);
  return formatConfig?.photoCountOptions ?? [3, 4];
}

export function PrintLayoutSettings({ config, onUpdate }: PrintLayoutSettingsProps) {
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastOutput, setLastOutput] = useState<LastPhotoOutput | null>(null);
  const [showPreviewPhotos, setShowPreviewPhotos] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load last output on mount
  useEffect(() => {
    const output = getLastOutput();
    setLastOutput(output);
  }, []);

  // Auto-update grid layout when margins/spacing change
  const updateGridLayout = useCallback(() => {
    if (config.layoutPreset !== 'grid') return;

    const { margins, spacing, photoCount } = config;
    const availableHeight = 100 - margins.top - margins.bottom;
    const availableWidth = 100 - margins.left - margins.right;
    const totalSpacing = spacing * (photoCount - 1);
    const boxHeight = (availableHeight - totalSpacing) / photoCount;

    const newBoxes = Array.from({ length: photoCount }, (_, i) => ({
      id: `photo-${i + 1}`,
      label: `Photo ${i + 1}`,
      x: margins.left,
      y: margins.top + i * (boxHeight + spacing),
      width: availableWidth,
      height: boxHeight,
    }));

    return newBoxes;
  }, [config.margins, config.spacing, config.photoCount, config.layoutPreset]);

  // Update layout when margins or spacing change (for grid preset only)
  const handleMarginsChange = (key: keyof typeof config.margins, value: number) => {
    const newMargins = { ...config.margins, [key]: value };
    if (config.layoutPreset === 'grid') {
      const availableHeight = 100 - newMargins.top - newMargins.bottom;
      const availableWidth = 100 - newMargins.left - newMargins.right;
      const totalSpacing = config.spacing * (config.photoCount - 1);
      const boxHeight = (availableHeight - totalSpacing) / config.photoCount;

      const newBoxes = Array.from({ length: config.photoCount }, (_, i) => ({
        id: `photo-${i + 1}`,
        label: `Photo ${i + 1}`,
        x: newMargins.left,
        y: newMargins.top + i * (boxHeight + config.spacing),
        width: availableWidth,
        height: boxHeight,
      }));

      onUpdate({ ...config, margins: newMargins, boxes: newBoxes });
    } else {
      onUpdate({ ...config, margins: newMargins });
    }
  };

  const handleSpacingChange = (value: number) => {
    if (config.layoutPreset === 'grid') {
      const { margins, photoCount } = config;
      const availableHeight = 100 - margins.top - margins.bottom;
      const availableWidth = 100 - margins.left - margins.right;
      const totalSpacing = value * (photoCount - 1);
      const boxHeight = (availableHeight - totalSpacing) / photoCount;

      const newBoxes = Array.from({ length: photoCount }, (_, i) => ({
        id: `photo-${i + 1}`,
        label: `Photo ${i + 1}`,
        x: margins.left,
        y: margins.top + i * (boxHeight + value),
        width: availableWidth,
        height: boxHeight,
      }));

      onUpdate({ ...config, spacing: value, boxes: newBoxes });
    } else {
      onUpdate({ ...config, spacing: value });
    }
  };

  const handleBoxUpdate = (boxId: string, updates: Partial<BoxConfig>) => {
    const updatedBoxes = config.boxes.map((box) =>
      box.id === boxId ? { ...box, ...updates } : box
    );
    onUpdate({ ...config, boxes: updatedBoxes });
  };

  const handleAddBox = () => {
    const newBox: BoxConfig = {
      id: `photo-${config.boxes.length + 1}`,
      label: `Photo ${config.boxes.length + 1}`,
      x: 10,
      y: 10,
      width: 40,
      height: 20,
    };
    onUpdate({ ...config, boxes: [...config.boxes, newBox] });
  };

  const handleRemoveBox = (boxId: string) => {
    const updatedBoxes = config.boxes.filter((box) => box.id !== boxId);
    onUpdate({ ...config, boxes: updatedBoxes });
    if (selectedBoxId === boxId) {
      setSelectedBoxId(null);
    }
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({ ...config, frameTemplate: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const getPresetBoxes = (format: PrintLayoutConfig['format'], preset: PrintLayoutConfig['layoutPreset'], count: number): BoxConfig[] => {
    const formatPresets = LAYOUT_PRESETS[format];
    if (!formatPresets) return [];

    // Check if the preset exists for this format
    const presetFn = formatPresets[preset as keyof typeof formatPresets];
    if (presetFn && typeof presetFn === 'function') {
      return presetFn(count);
    }

    // Fall back to grid
    const gridFn = formatPresets.grid;
    if (gridFn && typeof gridFn === 'function') {
      return gridFn(count);
    }

    return [];
  };

  const handleFormatChange = (format: PrintLayoutConfig['format']) => {
    const preset = config.layoutPreset || 'grid';
    // Get the default photo count for this format
    const formatConfig = formatOptions.find(f => f.value === format);
    const newPhotoCount = formatConfig?.photoCountOptions[0] ?? config.photoCount;
    const newBoxes = getPresetBoxes(format, preset, newPhotoCount as number);
    onUpdate({ ...config, format, photoCount: newPhotoCount as 1 | 3 | 4, boxes: newBoxes });
  };

  const handleLayoutPresetChange = (preset: PrintLayoutConfig['layoutPreset']) => {
    if (preset === 'custom') {
      onUpdate({ ...config, layoutPreset: preset });
      return;
    }
    const newBoxes = getPresetBoxes(config.format, preset, config.photoCount);
    onUpdate({ ...config, layoutPreset: preset, boxes: newBoxes });
  };

  const handlePhotoCountChange = (count: 1 | 3 | 4) => {
    const preset = config.layoutPreset || 'grid';
    const newBoxes = getPresetBoxes(config.format, preset, count);
    onUpdate({ ...config, photoCount: count, boxes: newBoxes });
  };

  const handleMouseDown = (e: React.MouseEvent, boxId: string) => {
    if (!canvasRef.current) return;
    setSelectedBoxId(boxId);
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | { clientX: number; clientY: number }) => {
      if (!isDragging || !selectedBoxId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const box = config.boxes.find((b) => b.id === selectedBoxId);
      if (box) {
        const newX = Math.max(0, Math.min(100 - box.width, x - box.width / 2));
        const newY = Math.max(0, Math.min(100 - box.height, y - box.height / 2));
        handleBoxUpdate(selectedBoxId, { x: newX, y: newY });
      }
    },
    [isDragging, selectedBoxId, config.boxes]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectedBox = config.boxes.find((b) => b.id === selectedBoxId);

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-4 sm:space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Print Format</CardTitle>
              <CardDescription>Select the print layout format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {formatOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleFormatChange(option.value as PrintLayoutConfig['format'])}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-colors text-center',
                      config.format === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Layout className="h-5 w-5" />
                    <span className="font-medium text-sm">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Layout Preset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Layout Style</CardTitle>
              <CardDescription>Choose how photos are arranged</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {layoutPresetOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLayoutPresetChange(option.value)}
                      className={cn(
                        'flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-colors text-left',
                        config.layoutPreset === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm sm:text-base">{option.label}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block">{option.description}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Orientation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Orientation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {orientationOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onUpdate({ ...config, orientation: option.value })}
                    className={cn(
                      'flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-colors',
                      config.orientation === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RotateCcw
                      className={cn(
                        'h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0',
                        option.value === 'landscape' && 'rotate-90'
                      )}
                    />
                    <span className="font-medium text-sm sm:text-base">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo Count - Only show if format has multiple options */}
          {getPhotoCountOptionsForFormat(config.format).length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photo Count</CardTitle>
                <CardDescription>Number of photos per print</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {getPhotoCountOptionsForFormat(config.format).map((count) => (
                    <motion.button
                      key={count}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePhotoCountChange(count as 1 | 3 | 4)}
                      className={cn(
                        'flex items-center gap-3 p-3 sm:p-4 rounded-lg border-2 transition-colors',
                        config.photoCount === count
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{count} {count === 1 ? 'Photo' : 'Photos'}</span>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Margins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Margins</CardTitle>
              <CardDescription>Adjust print margins (percentage) - Layout auto-updates in grid mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Top: {config.margins.top}%</Label>
                  <Slider
                    value={[config.margins.top]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) => handleMarginsChange('top', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bottom: {config.margins.bottom}%</Label>
                  <Slider
                    value={[config.margins.bottom]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) => handleMarginsChange('bottom', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Left: {config.margins.left}%</Label>
                  <Slider
                    value={[config.margins.left]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) => handleMarginsChange('left', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Right: {config.margins.right}%</Label>
                  <Slider
                    value={[config.margins.right]}
                    min={0}
                    max={20}
                    step={1}
                    onValueChange={([value]) => handleMarginsChange('right', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spacing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spacing</CardTitle>
              <CardDescription>Space between photos: {config.spacing}%</CardDescription>
            </CardHeader>
            <CardContent>
              <Slider
                value={[config.spacing]}
                min={0}
                max={15}
                step={1}
                onValueChange={([value]) => handleSpacingChange(value)}
              />
            </CardContent>
          </Card>

          {/* Frame Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frame Template</CardTitle>
              <CardDescription>Upload a frame overlay image</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFrameUpload}
                  className="flex-1"
                />
                {config.frameTemplate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdate({ ...config, frameTemplate: null })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {config.frameTemplate && (
                <div className="h-24 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={config.frameTemplate}
                    alt="Frame template"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Box Editor */}
        <div className="space-y-4 sm:space-y-6">
          {/* Layout Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Layout Preview</CardTitle>
                <div className="flex gap-2">
                  {lastOutput && (
                    <Button
                      variant={showPreviewPhotos ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowPreviewPhotos(!showPreviewPhotos)}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {showPreviewPhotos ? 'Hide Photos' : 'Show Photos'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleAddBox}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Box
                  </Button>
                </div>
              </div>
              <CardDescription>
                {lastOutput && showPreviewPhotos
                  ? 'Showing last captured photos - Click and drag to reposition'
                  : 'Click and drag to reposition photo boxes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className={cn(
                  'relative bg-white border-2 border-dashed border-muted rounded-lg overflow-hidden mx-auto touch-none',
                  // Responsive sizing
                  'w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px]'
                )}
                style={{
                  aspectRatio: getAspectRatio(config.format, config.orientation),
                  maxHeight: '60vh',
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                }}
                onTouchEnd={handleMouseUp}
              >
                {/* Photo Boxes */}
                {config.boxes.map((box, index) => {
                  const hasPhoto = showPreviewPhotos && lastOutput?.photos[index];

                  return (
                    <motion.div
                      key={box.id}
                      className={cn(
                        'absolute border-2 rounded cursor-move flex items-center justify-center select-none overflow-hidden',
                        selectedBoxId === box.id
                          ? 'border-primary ring-2 ring-primary/50'
                          : hasPhoto
                          ? 'border-transparent'
                          : 'border-muted-foreground/30 hover:border-primary/50 bg-muted/50'
                      )}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, box.id)}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent, box.id);
                      }}
                      whileHover={{ scale: selectedBoxId === box.id ? 1 : 1.02 }}
                    >
                      {hasPhoto ? (
                        <img
                          src={lastOutput.photos[index]}
                          alt={box.label}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground pointer-events-none">
                          <Image className="h-4 w-4 sm:h-6 sm:w-6" />
                          <span className="text-[10px] sm:text-xs font-medium">{box.label}</span>
                        </div>
                      )}
                      {selectedBoxId === box.id && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBox(box.id);
                          }}
                        >
                          <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                      )}
                    </motion.div>
                  );
                })}

                {/* Frame Template Overlay */}
                {config.frameTemplate && (
                  <img
                    src={config.frameTemplate}
                    alt="Frame"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                  />
                )}
              </div>

              {/* Last Output Info */}
              {lastOutput && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Last captured: {new Date(lastOutput.timestamp).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selected Box Properties */}
          {selectedBox && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Box Properties</CardTitle>
                <CardDescription>Edit {selectedBox.label}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={selectedBox.label}
                    onChange={(e) => handleBoxUpdate(selectedBox.id, { label: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>X Position: {selectedBox.x.toFixed(1)}%</Label>
                    <Slider
                      value={[selectedBox.x]}
                      min={0}
                      max={100 - selectedBox.width}
                      step={0.5}
                      onValueChange={([value]) => handleBoxUpdate(selectedBox.id, { x: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y Position: {selectedBox.y.toFixed(1)}%</Label>
                    <Slider
                      value={[selectedBox.y]}
                      min={0}
                      max={100 - selectedBox.height}
                      step={0.5}
                      onValueChange={([value]) => handleBoxUpdate(selectedBox.id, { y: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width: {selectedBox.width.toFixed(1)}%</Label>
                    <Slider
                      value={[selectedBox.width]}
                      min={10}
                      max={100 - selectedBox.x}
                      step={0.5}
                      onValueChange={([value]) => handleBoxUpdate(selectedBox.id, { width: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height: {selectedBox.height.toFixed(1)}%</Label>
                    <Slider
                      value={[selectedBox.height]}
                      min={10}
                      max={100 - selectedBox.y}
                      step={0.5}
                      onValueChange={([value]) => handleBoxUpdate(selectedBox.id, { height: value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
