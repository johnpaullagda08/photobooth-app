import { useState, useCallback, useRef, useEffect } from 'react';
import type { BoxConfig } from '@/lib/events/types';

export type ResizeHandle =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: ResizeHandle | null;
  startX: number;
  startY: number;
  startBox: BoxConfig | null;
}

interface UseDragResizeProps {
  box: BoxConfig;
  containerRef: React.RefObject<HTMLElement>;
  onUpdate: (updates: Partial<BoxConfig>) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  minSize?: number;
  disabled?: boolean;
  snapPosition?: (box: BoxConfig, x: number, y: number) => { x: number; y: number };
}

export function useDragResize({
  box,
  containerRef,
  onUpdate,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  minSize = 10,
  disabled = false,
  snapPosition,
}: UseDragResizeProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startX: 0,
    startY: 0,
    startBox: null,
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  // Convert pixel coordinates to percentage
  const pixelToPercent = useCallback(
    (pixelX: number, pixelY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (pixelX / rect.width) * 100,
        y: (pixelY / rect.height) * 100,
      };
    },
    [containerRef]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      setDragState({
        isDragging: true,
        isResizing: false,
        resizeHandle: null,
        startX: clientX,
        startY: clientY,
        startBox: { ...box },
      });

      onDragStart?.();
    },
    [box, disabled, onDragStart]
  );

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      setDragState({
        isDragging: false,
        isResizing: true,
        resizeHandle: handle,
        startX: clientX,
        startY: clientY,
        startBox: { ...box },
      });

      onResizeStart?.();
    },
    [box, disabled, onResizeStart]
  );

  // Handle mouse/touch move
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const state = dragStateRef.current;
      if (!state.isDragging && !state.isResizing) return;
      if (!state.startBox || !containerRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaPixel = {
        x: clientX - state.startX,
        y: clientY - state.startY,
      };

      const rect = containerRef.current.getBoundingClientRect();
      const deltaPercent = {
        x: (deltaPixel.x / rect.width) * 100,
        y: (deltaPixel.y / rect.height) * 100,
      };

      if (state.isDragging) {
        // Handle drag
        let newX = state.startBox.x + deltaPercent.x;
        let newY = state.startBox.y + deltaPercent.y;

        // Apply snap if available
        if (snapPosition) {
          const snapped = snapPosition(state.startBox, newX, newY);
          newX = snapped.x;
          newY = snapped.y;
        }

        // Clamp to boundaries
        newX = Math.max(0, Math.min(100 - state.startBox.width, newX));
        newY = Math.max(0, Math.min(100 - state.startBox.height, newY));

        onUpdate({ x: newX, y: newY });
      } else if (state.isResizing && state.resizeHandle) {
        // Handle resize
        let { x, y, width, height } = state.startBox;

        switch (state.resizeHandle) {
          case 'top-left':
            x = state.startBox.x + deltaPercent.x;
            y = state.startBox.y + deltaPercent.y;
            width = state.startBox.width - deltaPercent.x;
            height = state.startBox.height - deltaPercent.y;
            break;
          case 'top':
            y = state.startBox.y + deltaPercent.y;
            height = state.startBox.height - deltaPercent.y;
            break;
          case 'top-right':
            y = state.startBox.y + deltaPercent.y;
            width = state.startBox.width + deltaPercent.x;
            height = state.startBox.height - deltaPercent.y;
            break;
          case 'right':
            width = state.startBox.width + deltaPercent.x;
            break;
          case 'bottom-right':
            width = state.startBox.width + deltaPercent.x;
            height = state.startBox.height + deltaPercent.y;
            break;
          case 'bottom':
            height = state.startBox.height + deltaPercent.y;
            break;
          case 'bottom-left':
            x = state.startBox.x + deltaPercent.x;
            width = state.startBox.width - deltaPercent.x;
            height = state.startBox.height + deltaPercent.y;
            break;
          case 'left':
            x = state.startBox.x + deltaPercent.x;
            width = state.startBox.width - deltaPercent.x;
            break;
        }

        // Enforce minimum size
        if (width < minSize) {
          if (state.resizeHandle.includes('left')) {
            x = state.startBox.x + state.startBox.width - minSize;
          }
          width = minSize;
        }
        if (height < minSize) {
          if (state.resizeHandle.includes('top')) {
            y = state.startBox.y + state.startBox.height - minSize;
          }
          height = minSize;
        }

        // Clamp to boundaries
        if (x < 0) {
          width += x;
          x = 0;
        }
        if (y < 0) {
          height += y;
          y = 0;
        }
        if (x + width > 100) {
          width = 100 - x;
        }
        if (y + height > 100) {
          height = 100 - y;
        }

        onUpdate({ x, y, width, height });
      }
    };

    const handleEnd = () => {
      const state = dragStateRef.current;
      if (state.isDragging) {
        onDragEnd?.();
      }
      if (state.isResizing) {
        onResizeEnd?.();
      }

      setDragState({
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
        startX: 0,
        startY: 0,
        startBox: null,
      });
    };

    if (dragState.isDragging || dragState.isResizing) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [
    dragState.isDragging,
    dragState.isResizing,
    containerRef,
    minSize,
    onUpdate,
    onDragEnd,
    onResizeEnd,
    snapPosition,
  ]);

  return {
    isDragging: dragState.isDragging,
    isResizing: dragState.isResizing,
    resizeHandle: dragState.resizeHandle,
    handleDragStart,
    handleResizeStart,
  };
}

// Cursor styles for resize handles
export const resizeHandleCursors: Record<ResizeHandle, string> = {
  'top-left': 'nwse-resize',
  'top': 'ns-resize',
  'top-right': 'nesw-resize',
  'right': 'ew-resize',
  'bottom-right': 'nwse-resize',
  'bottom': 'ns-resize',
  'bottom-left': 'nesw-resize',
  'left': 'ew-resize',
};
