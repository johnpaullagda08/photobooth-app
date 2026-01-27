'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';
import {
  Type,
  Image,
  Square,
  MousePointer2,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Upload,
  Palette,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { LaunchPageConfig, DraggableElement, ElementProperties } from '@/lib/events/types';

interface LaunchPageBuilderProps {
  config: LaunchPageConfig;
  onUpdate: (config: LaunchPageConfig) => void;
}

export function LaunchPageBuilder({ config, onUpdate }: LaunchPageBuilderProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const selectedElement = config.elements.find((el) => el.id === selectedElementId);

  // Arrow key movement for selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId || !selectedElement || selectedElement.locked) return;

      const step = e.shiftKey ? 5 : 1; // Hold shift for larger steps
      let newX = selectedElement.x;
      let newY = selectedElement.y;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newY = Math.max(0, selectedElement.y - step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newY = Math.min(100, selectedElement.y + step);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newX = Math.max(0, selectedElement.x - step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newX = Math.min(100, selectedElement.x + step);
          break;
        case 'Delete':
        case 'Backspace':
          if (document.activeElement?.tagName !== 'INPUT' &&
              document.activeElement?.tagName !== 'TEXTAREA') {
            e.preventDefault();
            deleteElement(selectedElementId);
          }
          return;
        default:
          return;
      }

      updateElement(selectedElementId, { x: newX, y: newY });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selectedElement]);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    setSelectedElementId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, delta } = event;

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaXPercent = (delta.x / rect.width) * 100;
    const deltaYPercent = (delta.y / rect.height) * 100;

    const updatedElements = config.elements.map((el) => {
      if (el.id === active.id && !el.locked) {
        return {
          ...el,
          x: Math.max(0, Math.min(100, el.x + deltaXPercent)),
          y: Math.max(0, Math.min(100, el.y + deltaYPercent)),
        };
      }
      return el;
    });

    onUpdate({ ...config, elements: updatedElements });
  };

  const updateElement = useCallback(
    (elementId: string, updates: Partial<DraggableElement>) => {
      const updatedElements = config.elements.map((el) =>
        el.id === elementId ? { ...el, ...updates } : el
      );
      onUpdate({ ...config, elements: updatedElements });
    },
    [config, onUpdate]
  );

  const updateElementProperties = useCallback(
    (elementId: string, propUpdates: Partial<ElementProperties>) => {
      const updatedElements = config.elements.map((el) =>
        el.id === elementId
          ? { ...el, properties: { ...el.properties, ...propUpdates } }
          : el
      );
      onUpdate({ ...config, elements: updatedElements });
    },
    [config, onUpdate]
  );

  const addElement = useCallback(
    (type: DraggableElement['type']) => {
      const newElement: DraggableElement = {
        id: `element-${Date.now()}`,
        type,
        x: 50,
        y: 50,
        width: type === 'button' ? 30 : 20,
        height: type === 'button' ? 10 : 15,
        rotation: 0,
        visible: true,
        locked: false,
        zIndex: config.elements.length + 1,
        properties: getDefaultProperties(type),
      };

      onUpdate({ ...config, elements: [...config.elements, newElement] });
      setSelectedElementId(newElement.id);
    },
    [config, onUpdate]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      const updatedElements = config.elements.filter((el) => el.id !== elementId);
      onUpdate({ ...config, elements: updatedElements });
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [config, onUpdate, selectedElementId]
  );

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdate({ ...config, backgroundImage: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Toolbar */}
      <div className="w-full md:w-14 border-b md:border-b-0 md:border-r border-border flex md:flex-col items-center py-2 gap-1 bg-muted/30 overflow-x-auto md:overflow-x-visible">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => addElement('text')}
          title="Add Text"
        >
          <Type className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => addElement('image')}
          title="Add Image"
        >
          <Image className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => addElement('logo')}
          title="Add Logo"
        >
          <Square className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => addElement('button')}
          title="Add Button"
        >
          <MousePointer2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={() => addElement('shape')}
          title="Add Shape"
        >
          <Square className="h-5 w-5" fill="currentColor" fillOpacity={0.3} />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-2 sm:p-4 bg-muted/20 overflow-auto min-h-[300px]">
        <div className="max-w-3xl mx-auto">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              ref={canvasRef}
              className="relative aspect-video rounded-lg overflow-hidden shadow-xl"
              style={{
                backgroundColor: config.backgroundColor,
                backgroundImage: config.backgroundImage
                  ? `url(${config.backgroundImage})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              onClick={() => setSelectedElementId(null)}
            >
              {/* Background overlay for opacity */}
              {config.backgroundImage && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: config.backgroundColor,
                    opacity: 1 - config.backgroundOpacity / 100,
                  }}
                />
              )}

              {/* Elements */}
              {config.elements
                .filter((el) => el.visible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((element) => (
                  <DraggableCanvasElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElementId === element.id}
                    onSelect={() => setSelectedElementId(element.id)}
                    onPositionChange={(id, x, y) => updateElement(id, { x, y })}
                    canvasRef={canvasRef}
                  />
                ))}
            </div>
          </DndContext>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-full md:w-64 lg:w-72 border-t md:border-t-0 md:border-l border-border bg-card flex-shrink-0">
        <ScrollArea className="h-full max-h-[40vh] md:max-h-none">
          <div className="p-3 sm:p-4 space-y-4">
            <h3 className="font-semibold text-sm">Properties</h3>

            {selectedElement ? (
              <ElementPropertiesPanel
                element={selectedElement}
                onUpdate={(updates) => updateElement(selectedElement.id, updates)}
                onUpdateProperties={(props) =>
                  updateElementProperties(selectedElement.id, props)
                }
                onDelete={() => deleteElement(selectedElement.id)}
              />
            ) : (
              <BackgroundPropertiesPanel
                config={config}
                onUpdate={onUpdate}
                onBackgroundUpload={handleBackgroundUpload}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Draggable Element Component
function DraggableCanvasElement({
  element,
  isSelected,
  onSelect,
  onPositionChange,
  canvasRef,
}: {
  element: DraggableElement;
  isSelected: boolean;
  onSelect: () => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; elementX: number; elementY: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (element.locked) return;
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      elementX: element.x,
      elementY: element.y,
    };
    setIsDragging(true);
    onSelect();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!canvasRef.current || !dragStartRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      const deltaXPercent = (deltaX / rect.width) * 100;
      const deltaYPercent = (deltaY / rect.height) * 100;

      const newX = Math.max(0, Math.min(100, dragStartRef.current.elementX + deltaXPercent));
      const newY = Math.max(0, Math.min(100, dragStartRef.current.elementY + deltaYPercent));

      onPositionChange(element.id, newX, newY);
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, element.id, canvasRef, onPositionChange]);

  return (
    <div
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        if (!isDragging) onSelect();
      }}
      className={cn(
        'absolute cursor-move select-none',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        element.locked && 'cursor-not-allowed',
        isDragging && 'z-50'
      )}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: isDragging ? 1000 : element.zIndex,
      }}
    >
      <ElementRenderer element={element} />
    </div>
  );
}

// Element Renderer
function ElementRenderer({ element }: { element: DraggableElement }) {
  const { properties } = element;

  switch (element.type) {
    case 'text':
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            color: properties.color,
            fontSize: `${properties.fontSize}px`,
            fontFamily: properties.fontFamily,
            fontWeight: properties.fontWeight,
            textAlign: properties.textAlign,
          }}
        >
          {properties.text || 'Text'}
        </div>
      );

    case 'button':
      return (
        <div
          className="w-full h-full flex items-center justify-center px-4 py-2"
          style={{
            backgroundColor: properties.buttonColor,
            color: properties.buttonTextColor,
            borderRadius: `${properties.buttonBorderRadius}px`,
          }}
        >
          {properties.buttonText || 'Button'}
        </div>
      );

    case 'image':
    case 'logo':
      return properties.src ? (
        <img
          src={properties.src}
          alt=""
          className="w-full h-full"
          style={{
            objectFit: properties.objectFit || 'contain',
            borderRadius: `${properties.borderRadius || 0}px`,
            opacity: properties.opacity ?? 1,
          }}
        />
      ) : (
        <div className="w-full h-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground text-sm">
          {element.type === 'logo' ? 'Logo' : 'Image'}
        </div>
      );

    case 'shape':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: properties.fill || 'transparent',
            border: properties.stroke
              ? `${properties.strokeWidth || 2}px solid ${properties.stroke}`
              : undefined,
            borderRadius:
              properties.shapeType === 'circle' ? '50%' : `${properties.borderRadius || 0}px`,
          }}
        />
      );

    default:
      return null;
  }
}

// Element Properties Panel
function ElementPropertiesPanel({
  element,
  onUpdate,
  onUpdateProperties,
  onDelete,
}: {
  element: DraggableElement;
  onUpdate: (updates: Partial<DraggableElement>) => void;
  onUpdateProperties: (props: Partial<ElementProperties>) => void;
  onDelete: () => void;
}) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateProperties({ src: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Element Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdate({ visible: !element.visible })}
          title={element.visible ? 'Hide' : 'Show'}
        >
          {element.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdate({ locked: !element.locked })}
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Position & Size */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Position & Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">X (%)</Label>
            <Input
              type="number"
              value={Math.round(element.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Y (%)</Label>
            <Input
              type="number"
              value={Math.round(element.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Width (%)</Label>
            <Input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Height (%)</Label>
            <Input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="h-8"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Type-specific properties */}
      {element.type === 'text' && (
        <TextProperties
          properties={element.properties}
          onUpdate={onUpdateProperties}
        />
      )}

      {element.type === 'button' && (
        <ButtonProperties
          properties={element.properties}
          onUpdate={onUpdateProperties}
        />
      )}

      {(element.type === 'image' || element.type === 'logo') && (
        <ImageProperties
          properties={element.properties}
          onUpdate={onUpdateProperties}
          onUpload={handleImageUpload}
        />
      )}

      {element.type === 'shape' && (
        <ShapeProperties
          properties={element.properties}
          onUpdate={onUpdateProperties}
        />
      )}
    </div>
  );
}

// Text Properties
function TextProperties({
  properties,
  onUpdate,
}: {
  properties: ElementProperties;
  onUpdate: (props: Partial<ElementProperties>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Text</Label>
        <Input
          value={properties.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs">Font Size</Label>
        <Input
          type="number"
          value={properties.fontSize || 16}
          onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs">Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={properties.color || '#ffffff'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="h-8 w-12 p-1"
          />
          <Input
            value={properties.color || '#ffffff'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="h-8 flex-1"
          />
        </div>
      </div>
    </div>
  );
}

// Button Properties
function ButtonProperties({
  properties,
  onUpdate,
}: {
  properties: ElementProperties;
  onUpdate: (props: Partial<ElementProperties>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Button Text</Label>
        <Input
          value={properties.buttonText || ''}
          onChange={(e) => onUpdate({ buttonText: e.target.value })}
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs">Button Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={properties.buttonColor || '#3b82f6'}
            onChange={(e) => onUpdate({ buttonColor: e.target.value })}
            className="h-8 w-12 p-1"
          />
          <Input
            value={properties.buttonColor || '#3b82f6'}
            onChange={(e) => onUpdate({ buttonColor: e.target.value })}
            className="h-8 flex-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Text Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={properties.buttonTextColor || '#ffffff'}
            onChange={(e) => onUpdate({ buttonTextColor: e.target.value })}
            className="h-8 w-12 p-1"
          />
          <Input
            value={properties.buttonTextColor || '#ffffff'}
            onChange={(e) => onUpdate({ buttonTextColor: e.target.value })}
            className="h-8 flex-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Border Radius</Label>
        <Slider
          value={[properties.buttonBorderRadius || 8]}
          onValueChange={([value]) => onUpdate({ buttonBorderRadius: value })}
          max={50}
          step={1}
        />
      </div>
    </div>
  );
}

// Image Properties
function ImageProperties({
  properties,
  onUpdate,
  onUpload,
}: {
  properties: ElementProperties;
  onUpdate: (props: Partial<ElementProperties>) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Image</Label>
        <div className="mt-1">
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload Image</span>
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        </div>
      </div>
      {properties.src && (
        <>
          <div>
            <Label className="text-xs">Fit</Label>
            <select
              value={properties.objectFit || 'contain'}
              onChange={(e) =>
                onUpdate({ objectFit: e.target.value as 'contain' | 'cover' | 'fill' })
              }
              className="w-full h-8 px-2 rounded border border-input bg-background text-sm"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Opacity</Label>
            <Slider
              value={[(properties.opacity ?? 1) * 100]}
              onValueChange={([value]) => onUpdate({ opacity: value / 100 })}
              max={100}
              step={1}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Shape Properties
function ShapeProperties({
  properties,
  onUpdate,
}: {
  properties: ElementProperties;
  onUpdate: (props: Partial<ElementProperties>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Shape Type</Label>
        <select
          value={properties.shapeType || 'rectangle'}
          onChange={(e) =>
            onUpdate({
              shapeType: e.target.value as 'rectangle' | 'circle' | 'line' | 'triangle',
            })
          }
          className="w-full h-8 px-2 rounded border border-input bg-background text-sm"
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <Label className="text-xs">Fill Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={properties.fill || '#ffffff'}
            onChange={(e) => onUpdate({ fill: e.target.value })}
            className="h-8 w-12 p-1"
          />
          <Input
            value={properties.fill || '#ffffff'}
            onChange={(e) => onUpdate({ fill: e.target.value })}
            className="h-8 flex-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Border Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={properties.stroke || '#000000'}
            onChange={(e) => onUpdate({ stroke: e.target.value })}
            className="h-8 w-12 p-1"
          />
          <Input
            value={properties.stroke || '#000000'}
            onChange={(e) => onUpdate({ stroke: e.target.value })}
            className="h-8 flex-1"
          />
        </div>
      </div>
    </div>
  );
}

// Background Properties Panel
function BackgroundPropertiesPanel({
  config,
  onUpdate,
  onBackgroundUpload,
}: {
  config: LaunchPageConfig;
  onUpdate: (config: LaunchPageConfig) => void;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click on an element to edit its properties, or customize the background below.
      </p>

      <Separator />

      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Background</Label>

        <div>
          <Label className="text-xs">Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={config.backgroundColor}
              onChange={(e) => onUpdate({ ...config, backgroundColor: e.target.value })}
              className="h-8 w-12 p-1"
            />
            <Input
              value={config.backgroundColor}
              onChange={(e) => onUpdate({ ...config, backgroundColor: e.target.value })}
              className="h-8 flex-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Background Image</Label>
          <div className="mt-1">
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload Background</span>
              <input
                type="file"
                accept="image/*"
                onChange={onBackgroundUpload}
                className="hidden"
              />
            </label>
          </div>
          {config.backgroundImage && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-destructive"
              onClick={() => onUpdate({ ...config, backgroundImage: null })}
            >
              Remove Background
            </Button>
          )}
        </div>

        {config.backgroundImage && (
          <div>
            <Label className="text-xs">Background Opacity</Label>
            <Slider
              value={[config.backgroundOpacity]}
              onValueChange={([value]) =>
                onUpdate({ ...config, backgroundOpacity: value })
              }
              max={100}
              step={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function getDefaultProperties(type: DraggableElement['type']): ElementProperties {
  switch (type) {
    case 'text':
      return {
        text: 'New Text',
        fontSize: 24,
        fontFamily: 'Inter',
        fontWeight: 'normal',
        textAlign: 'center',
        color: '#ffffff',
      };
    case 'button':
      return {
        buttonText: 'Click Me',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: 8,
      };
    case 'image':
    case 'logo':
      return {
        src: '',
        objectFit: 'contain',
        borderRadius: 0,
        opacity: 1,
      };
    case 'shape':
      return {
        shapeType: 'rectangle',
        fill: 'rgba(255,255,255,0.2)',
        stroke: '#ffffff',
        strokeWidth: 2,
        borderRadius: 8,
      };
    default:
      return {};
  }
}
