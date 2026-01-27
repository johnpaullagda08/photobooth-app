'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Move, Maximize2 } from 'lucide-react';

export interface BoxConfig {
  id: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

export interface LayoutConfig {
  boxes: BoxConfig[];
}

// Default 4R layout (1 large + 3 small)
export const DEFAULT_4R_LAYOUT: LayoutConfig = {
  boxes: [
    { id: 'photo-1', label: 'Photo 1', x: 2, y: 2, width: 48, height: 96 },
    { id: 'photo-2', label: 'Photo 2', x: 52, y: 52, width: 15, height: 46 },
    { id: 'photo-3', label: 'Photo 3', x: 68, y: 52, width: 15, height: 46 },
    { id: 'photo-4', label: 'Photo 4', x: 84, y: 52, width: 15, height: 46 },
  ],
};

interface LayoutEditorProps {
  layout: LayoutConfig;
  onChange: (layout: LayoutConfig) => void;
  className?: string;
}

export function LayoutEditor({ layout, onChange, className }: LayoutEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeBox, setActiveBox] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, boxId: string, mode: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      setActiveBox(boxId);
      setDragMode(mode);
      setDragStart({ x: e.clientX, y: e.clientY });

      const box = layout.boxes.find((b) => b.id === boxId);
      if (box) {
        setBoxStart({ x: box.x, y: box.y, width: box.width, height: box.height });
      }
    },
    [layout.boxes]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeBox || !dragMode || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      const newBoxes = layout.boxes.map((box) => {
        if (box.id !== activeBox) return box;

        if (dragMode === 'move') {
          return {
            ...box,
            x: Math.max(0, Math.min(100 - box.width, boxStart.x + deltaX)),
            y: Math.max(0, Math.min(100 - box.height, boxStart.y + deltaY)),
          };
        } else {
          // resize
          return {
            ...box,
            width: Math.max(10, Math.min(100 - box.x, boxStart.width + deltaX)),
            height: Math.max(10, Math.min(100 - box.y, boxStart.height + deltaY)),
          };
        }
      });

      onChange({ ...layout, boxes: newBoxes });
    },
    [activeBox, dragMode, dragStart, boxStart, layout, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setActiveBox(null);
    setDragMode(null);
  }, []);

  useEffect(() => {
    if (dragMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragMode, handleMouseMove, handleMouseUp]);

  const resetLayout = () => {
    onChange(DEFAULT_4R_LAYOUT);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-400 font-medium">Layout Editor</label>
        <button
          onClick={resetLayout}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Reset to Default
        </button>
      </div>

      {/* Canvas preview */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] bg-zinc-800 rounded-lg overflow-hidden border-2 border-zinc-700"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #666 1px, transparent 1px), linear-gradient(to bottom, #666 1px, transparent 1px)',
            backgroundSize: '10% 10%',
          }}
        />

        {/* Photo boxes */}
        {layout.boxes.map((box) => (
          <div
            key={box.id}
            className={cn(
              'absolute border-2 rounded transition-colors cursor-move',
              activeBox === box.id
                ? 'border-blue-500 bg-blue-500/30'
                : 'border-zinc-500 bg-zinc-700/50 hover:border-blue-400'
            )}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, box.id, 'move')}
          >
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                {box.label}
              </span>
            </div>

            {/* Move handle */}
            <div className="absolute top-1 left-1 p-1 bg-zinc-900/80 rounded cursor-move">
              <Move className="w-3 h-3 text-zinc-400" />
            </div>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => handleMouseDown(e, box.id, 'resize')}
            >
              <Maximize2 className="w-3 h-3 text-zinc-400 absolute bottom-1 right-1" />
            </div>
          </div>
        ))}

        {/* Info area placeholder */}
        <div
          className="absolute border-2 border-dashed border-zinc-600 rounded flex items-center justify-center"
          style={{ left: '52%', top: '2%', width: '46%', height: '48%' }}
        >
          <span className="text-xs text-zinc-500">Event Info Area</span>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Drag boxes to move, drag bottom-right corner to resize
      </p>

      {/* Box dimensions display */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {layout.boxes.map((box) => (
          <div
            key={box.id}
            className="bg-zinc-800 p-2 rounded flex justify-between"
          >
            <span className="text-zinc-400">{box.label}</span>
            <span className="text-zinc-500">
              {Math.round(box.width)}% × {Math.round(box.height)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
