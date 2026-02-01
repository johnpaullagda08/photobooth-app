'use client';

import { memo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDragResize, resizeHandleCursors, type ResizeHandle } from '@/hooks/layout-editor';
import type { BoxConfig } from '@/lib/events/types';

interface PhotoBoxProps {
  box: BoxConfig;
  isSelected: boolean;
  hasError: boolean;
  containerRef: React.RefObject<HTMLElement>;
  onSelect: () => void;
  onUpdate: (updates: Partial<BoxConfig>) => void;
  onDelete: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  snapPosition?: (box: BoxConfig, x: number, y: number) => { x: number; y: number };
  disabled?: boolean;
  isPreviewMode?: boolean;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
];

function PhotoBoxComponent({
  box,
  isSelected,
  hasError,
  containerRef,
  onSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  snapPosition,
  disabled = false,
  isPreviewMode = false,
}: PhotoBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  const handleUpdate = useCallback(
    (updates: Partial<BoxConfig>) => {
      onUpdate(updates);
    },
    [onUpdate]
  );

  const {
    isDragging,
    isResizing,
    handleDragStart,
    handleResizeStart,
  } = useDragResize({
    box,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    onUpdate: handleUpdate,
    onDragStart,
    onDragEnd,
    onResizeStart: onDragStart,
    onResizeEnd: onDragEnd,
    minSize: 10,
    disabled,
    snapPosition,
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
      }
    },
    [onDelete]
  );

  const isActive = isDragging || isResizing;
  const showEditingUI = !isPreviewMode && !disabled;

  // Preview mode: simple photo placeholder without any editing UI
  if (isPreviewMode) {
    return (
      <motion.div
        ref={boxRef}
        className="w-full h-full rounded-sm overflow-hidden bg-zinc-200 dark:bg-zinc-700"
        initial={false}
      >
        {/* Preview placeholder - represents where photo will appear */}
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400 dark:text-zinc-500 opacity-50" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={boxRef}
      className={cn(
        'w-full h-full rounded-lg transition-shadow select-none touch-none',
        'flex items-center justify-center overflow-hidden',
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
          : '',
        hasError
          ? 'border-2 border-red-500 bg-red-500/10'
          : isSelected
          ? 'border-2 border-primary bg-primary/5'
          : 'border-2 border-dashed border-muted-foreground/40 bg-muted/30 hover:border-muted-foreground/60',
        isActive && 'shadow-lg',
        disabled ? 'cursor-default' : 'cursor-pointer'
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isSelected ? 0 : -1}
      initial={false}
      animate={{
        scale: isActive ? 1.02 : 1,
      }}
      transition={{ duration: 0.1 }}
    >
      {/* Box Content */}
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-1 pointer-events-none',
          'text-muted-foreground transition-colors',
          isSelected && 'text-primary',
          hasError && 'text-red-500'
        )}
      >
        <Camera className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
        <span className="text-[10px] sm:text-xs font-medium">{box.label}</span>
      </div>

      {/* Drag Handle (center area) */}
      {isSelected && showEditingUI && (
        <div
          className="absolute inset-4 cursor-move"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        />
      )}

      {/* Resize Handles */}
      {isSelected && showEditingUI && (
        <>
          {RESIZE_HANDLES.map((handle) => (
            <ResizeHandleComponent
              key={handle}
              handle={handle}
              onResizeStart={handleResizeStart}
            />
          ))}
        </>
      )}

      {/* Delete Button */}
      {isSelected && showEditingUI && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            'absolute -top-2 -right-2 z-30',
            'w-5 h-5 sm:w-6 sm:h-6 rounded-full',
            'bg-destructive text-destructive-foreground',
            'flex items-center justify-center',
            'shadow-md hover:bg-destructive/90',
            'transition-colors'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </motion.button>
      )}
    </motion.div>
  );
}

// Resize Handle Component
interface ResizeHandleProps {
  handle: ResizeHandle;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => void;
}

function ResizeHandleComponent({ handle, onResizeStart }: ResizeHandleProps) {
  const positionClasses: Record<ResizeHandle, string> = {
    'top-left': '-top-1.5 -left-1.5',
    'top': '-top-1.5 left-1/2 -translate-x-1/2',
    'top-right': '-top-1.5 -right-1.5',
    'right': 'top-1/2 -right-1.5 -translate-y-1/2',
    'bottom-right': '-bottom-1.5 -right-1.5',
    'bottom': '-bottom-1.5 left-1/2 -translate-x-1/2',
    'bottom-left': '-bottom-1.5 -left-1.5',
    'left': 'top-1/2 -left-1.5 -translate-y-1/2',
  };

  const isCorner = handle.includes('-');

  return (
    <div
      className={cn(
        'absolute z-30',
        'bg-white dark:bg-zinc-800 border-2 border-primary',
        'hover:bg-primary hover:border-primary',
        'transition-colors',
        isCorner ? 'w-3 h-3 rounded-sm' : 'w-2.5 h-5 sm:w-3 sm:h-6 rounded-sm',
        handle === 'top' || handle === 'bottom' ? 'w-5 h-2.5 sm:w-6 sm:h-3' : '',
        positionClasses[handle]
      )}
      style={{ cursor: resizeHandleCursors[handle] }}
      onMouseDown={(e) => onResizeStart(e, handle)}
      onTouchStart={(e) => onResizeStart(e, handle)}
    />
  );
}

export const PhotoBox = memo(PhotoBoxComponent);
